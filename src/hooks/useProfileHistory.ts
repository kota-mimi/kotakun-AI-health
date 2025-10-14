import { useState, useEffect } from 'react';
import FirestoreService from '@/services/firestoreService';
import { calculateCalorieTarget, calculateMacroTargets, calculateBMR, calculateTDEE } from '@/utils/calculations';
import type { UserProfile, HealthGoal } from '@/types';

export interface ProfileHistoryEntry {
  changeDate: string;
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  height: number;
  weight: number;
  targetWeight: number;
  activityLevel: string;
  primaryGoal: string;
  targetCalories: number;
  bmr: number;
  tdee: number;
  macros: {
    protein: number;
    fat: number;
    carbs: number;
  };
}
import { useAuth } from './useAuth';

interface UseProfileHistoryReturn {
  profileData: ProfileHistoryEntry | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// 指定日付に有効なプロフィールデータを取得するフック
export function useProfileHistory(targetDate: Date): UseProfileHistoryReturn {
  const [profileData, setProfileData] = useState<ProfileHistoryEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { liffUser } = useAuth();

  const fetchProfileData = async () => {
    if (!liffUser?.userId) return;

    try {
      setLoading(true);
      setError(null);
      
      const dateString = targetDate.toISOString().split('T')[0];
      const firestoreService = new FirestoreService();
      
      const profile = await firestoreService.getProfileHistory(liffUser.userId, dateString);
      setProfileData(profile);
      
      console.log('📊 プロフィール履歴取得:', {
        targetDate: dateString,
        userId: liffUser.userId,
        hasProfile: !!profile,
        profileDate: profile?.changeDate
      });
    } catch (err) {
      console.error('❌ プロフィール履歴取得エラー:', err);
      setError(err instanceof Error ? err.message : 'プロフィールデータの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, [targetDate, liffUser?.userId]);

  // プロフィール履歴更新イベントをリスニング（日付ベース用）
  useEffect(() => {
    const handleProfileHistoryUpdate = () => {
      console.log('📊 プロフィール履歴更新イベント受信 - 日付ベースプロフィール再取得');
      fetchProfileData();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('profileHistoryUpdated', handleProfileHistoryUpdate);
      
      return () => {
        window.removeEventListener('profileHistoryUpdated', handleProfileHistoryUpdate);
      };
    }
  }, [fetchProfileData]);

  return {
    profileData,
    loading,
    error,
    refetch: fetchProfileData
  };
}

// 最新のプロフィールデータを取得するフック
export function useLatestProfile(): UseProfileHistoryReturn {
  const [profileData, setProfileData] = useState<ProfileHistoryEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { liffUser } = useAuth();

  const fetchLatestProfile = async () => {
    if (!liffUser?.userId) return;

    try {
      setLoading(true);
      setError(null);
      
      const firestoreService = new FirestoreService();
      const profiles = await firestoreService.getProfileHistory(liffUser.userId);
      const profile = Array.isArray(profiles) && profiles.length > 0 ? profiles[0] : null;
      setProfileData(profile);
      
      console.log('📊 最新プロフィール取得:', {
        userId: liffUser.userId,
        hasProfile: !!profile,
        profileDate: profile?.changeDate
      });
    } catch (err) {
      console.error('❌ 最新プロフィール取得エラー:', err);
      setError(err instanceof Error ? err.message : '最新プロフィールデータの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLatestProfile();
    
    // プロフィール更新イベントをリスニング
    const handleProfileUpdate = () => {
      console.log('📊 プロフィール更新イベント受信 - 最新プロフィール再取得');
      fetchLatestProfile();
    };

    const handleProfileHistoryUpdate = () => {
      console.log('📊 プロフィール履歴更新イベント受信 - 最新プロフィール再取得');
      fetchLatestProfile();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('counselingDataUpdated', handleProfileUpdate);
      window.addEventListener('profileHistoryUpdated', handleProfileHistoryUpdate);
      
      return () => {
        window.removeEventListener('counselingDataUpdated', handleProfileUpdate);
        window.removeEventListener('profileHistoryUpdated', handleProfileHistoryUpdate);
      };
    }
  }, [liffUser?.userId]);

  return {
    profileData,
    loading,
    error,
    refetch: fetchLatestProfile
  };
}

// プロフィールデータから現在の日付に対応する目標値を取得するユーティリティ
export function getTargetValuesForDate(profileData: ProfileHistoryEntry | null, counselingFallback?: any) {
  console.log('🎯 目標値取得:', {
    hasProfileData: !!profileData,
    profileDate: profileData?.changeDate,
    hasCounselingFallback: !!counselingFallback,
    counselingStructure: counselingFallback ? {
      hasAiAnalysis: !!counselingFallback.aiAnalysis,
      hasNutritionPlan: !!counselingFallback.aiAnalysis?.nutritionPlan,
      dailyCalories: counselingFallback.aiAnalysis?.nutritionPlan?.dailyCalories,
      bmr: counselingFallback.aiAnalysis?.nutritionPlan?.bmr,
      tdee: counselingFallback.aiAnalysis?.nutritionPlan?.tdee,
      macros: counselingFallback.aiAnalysis?.nutritionPlan?.macros
    } : null
  });

  // 🚨 優先順位変更: 最新のaiAnalysisがあればそれを優先（リアルタイム更新対応）
  if (counselingFallback?.aiAnalysis?.nutritionPlan?.bmr && counselingFallback?.aiAnalysis?.nutritionPlan?.tdee) {
    const freshValues = {
      targetCalories: counselingFallback.aiAnalysis.nutritionPlan.dailyCalories,
      bmr: counselingFallback.aiAnalysis.nutritionPlan.bmr,
      tdee: counselingFallback.aiAnalysis.nutritionPlan.tdee,
      macros: counselingFallback.aiAnalysis.nutritionPlan.macros || {
        protein: Math.round((counselingFallback.aiAnalysis.nutritionPlan.dailyCalories * 0.25) / 4),
        fat: Math.round((counselingFallback.aiAnalysis.nutritionPlan.dailyCalories * 0.30) / 9),
        carbs: Math.round((counselingFallback.aiAnalysis.nutritionPlan.dailyCalories * 0.45) / 4)
      },
      fromHistory: false
    };
    console.log('🔥 最新aiAnalysisから目標値取得（優先）:', freshValues);
    return freshValues;
  }

  if (profileData) {
    // プロフィール履歴から取得（aiAnalysisがない場合のフォールバック）
    console.log('✅ プロフィール履歴から目標値取得（フォールバック）:', profileData);
    return {
      targetCalories: profileData.targetCalories,
      bmr: profileData.bmr,
      tdee: profileData.tdee,
      macros: profileData.macros,
      fromHistory: true
    };
  }

  // カウンセリング結果から計算済みの値を取得、または動的計算
  if (counselingFallback?.aiAnalysis?.nutritionPlan) {
    // カウンセリング結果にBMR/TDEE/macrosが含まれている場合はそれを使用
    if (counselingFallback.aiAnalysis.nutritionPlan.bmr && counselingFallback.aiAnalysis.nutritionPlan.tdee) {
      const fallbackValues = {
        targetCalories: counselingFallback.aiAnalysis.nutritionPlan.dailyCalories,
        bmr: counselingFallback.aiAnalysis.nutritionPlan.bmr,
        tdee: counselingFallback.aiAnalysis.nutritionPlan.tdee,
        macros: counselingFallback.aiAnalysis.nutritionPlan.macros || {
          protein: Math.round((counselingFallback.aiAnalysis.nutritionPlan.dailyCalories * 0.25) / 4),
          fat: Math.round((counselingFallback.aiAnalysis.nutritionPlan.dailyCalories * 0.30) / 9),
          carbs: Math.round((counselingFallback.aiAnalysis.nutritionPlan.dailyCalories * 0.45) / 4)
        },
        fromHistory: false
      };
      console.log('📋 カウンセリング結果から目標値取得:', fallbackValues);
      return fallbackValues;
    }
    
    // カウンセリング結果はあるが計算値がない場合は、カウンセリングデータから動的計算
    if (counselingFallback.answers) {
      const dynamicValues = calculateDynamicValues(counselingFallback.answers);
      console.log('🧮 カウンセリングデータから動的計算:', dynamicValues);
      return {
        ...dynamicValues,
        fromHistory: false
      };
    }
  }

  // 最後の手段：基本的なデフォルト値（体重60kg女性想定）
  const defaultValues = {
    targetCalories: 1600, // より現実的な値に変更
    bmr: 1200, // 女性平均
    tdee: 1600, // 軽い活動レベル想定
    macros: {
      protein: 100,
      fat: 53,
      carbs: 180
    },
    fromHistory: false
  };
  console.log('⚠️ デフォルト値を使用:', defaultValues);
  return defaultValues;
}

// カウンセリングデータから動的に目標値を計算
function calculateDynamicValues(answers: any) {
  try {
    const profile: UserProfile = {
      name: answers.name || 'ユーザー',
      age: Number(answers.age) || 30,
      gender: answers.gender || 'female',
      height: Number(answers.height) || 160,
      weight: Number(answers.weight) || 60,
      targetWeight: Number(answers.targetWeight) || Number(answers.weight) || 60,
      activityLevel: answers.activityLevel || 'normal',
      goals: [{
        type: answers.primaryGoal || 'fitness_improve',
        targetValue: Number(answers.targetWeight) || Number(answers.weight) || 60,
      }] as HealthGoal[],
      sleepDuration: '8h_plus',
      sleepQuality: 'normal',
      exerciseHabit: 'yes',
      exerciseFrequency: 'weekly_3_4',
      mealFrequency: '3',
      snackFrequency: 'sometimes',
      alcoholFrequency: 'none'
    };

    const goals: HealthGoal[] = [{
      type: answers.primaryGoal as HealthGoal['type'] || 'fitness_improve',
      targetValue: profile.targetWeight
    }];

    const targetCalories = calculateCalorieTarget(profile, goals);
    const macros = calculateMacroTargets(targetCalories);
    const bmr = calculateBMR(profile);
    const tdee = calculateTDEE(profile);

    console.log('🧮 動的計算結果:', { targetCalories, bmr, tdee, macros });

    return {
      targetCalories,
      bmr: Math.round(bmr),
      tdee: Math.round(tdee),
      macros: {
        protein: macros.protein,
        fat: macros.fat,
        carbs: macros.carbs
      }
    };
  } catch (error) {
    console.error('❌ 動的計算エラー:', error);
    // エラー時はより安全なデフォルト値を返す
    return {
      targetCalories: 1600,
      bmr: 1200,
      tdee: 1600,
      macros: {
        protein: 100,
        fat: 53,
        carbs: 180
      }
    };
  }
}