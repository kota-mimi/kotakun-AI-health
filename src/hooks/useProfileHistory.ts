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
      fetchLatestProfile();
    };

    const handleProfileHistoryUpdate = () => {
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
  console.log('🔍 getTargetValuesForDate:', { 
    hasProfileData: !!profileData, 
    hasCounselingFallback: !!counselingFallback,
    counselingCalories: counselingFallback?.aiAnalysis?.nutritionPlan?.dailyCalories
  });

  // ✅ 正しい優先順位: 日付ベースのプロフィール履歴を最優先
  if (profileData && profileData.targetCalories) {
    // プロフィール履歴から取得（日付ベース - 最優先）
    return {
      targetCalories: profileData.targetCalories,
      bmr: profileData.bmr,
      tdee: profileData.tdee,
      macros: profileData.macros,
      fromHistory: true
    };
  }

  // 📅 プロフィール履歴がない場合のフォールバック: 最新のaiAnalysis
  if (counselingFallback?.aiAnalysis?.nutritionPlan?.dailyCalories) {
    // BMRとTDEEが存在する場合は使用、なければ動的計算用の値は後で設定
    const fallbackValues = {
      targetCalories: counselingFallback.aiAnalysis.nutritionPlan.dailyCalories,
      bmr: counselingFallback.aiAnalysis.nutritionPlan.bmr || 0,
      tdee: counselingFallback.aiAnalysis.nutritionPlan.tdee || 0,
      macros: counselingFallback.aiAnalysis.nutritionPlan.macros || {
        protein: Math.round((counselingFallback.aiAnalysis.nutritionPlan.dailyCalories * 0.25) / 4),
        fat: Math.round((counselingFallback.aiAnalysis.nutritionPlan.dailyCalories * 0.30) / 9),
        carbs: Math.round((counselingFallback.aiAnalysis.nutritionPlan.dailyCalories * 0.45) / 4)
      },
      fromHistory: false
    };
    return fallbackValues;
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
      return fallbackValues;
    }
    
    // カウンセリング結果はあるが計算値がない場合は、カウンセリングデータから動的計算
    if (counselingFallback.answers) {
      const dynamicValues = calculateDynamicValues(counselingFallback.answers);
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
  return defaultValues;
}

// カウンセリングデータから動的に目標値を計算（カウンセリングページと同じロジック）
function calculateDynamicValues(answers: any) {
  try {
    // カウンセリングページと同じBMR計算
    const age = Number(answers.age) || 30;
    const gender = answers.gender || 'female';
    const height = Number(answers.height) || 160;
    const weight = Number(answers.weight) || 60;
    
    let bmr;
    if (gender === 'male') {
      bmr = 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
    } else if (gender === 'female') {
      bmr = 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
    } else {
      // その他の場合は平均値を使用
      const maleValue = 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
      const femaleValue = 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
      bmr = (maleValue + femaleValue) / 2;
    }
    
    // カウンセリングページと同じTDEE計算
    // アクティビティレベルが取得できない場合は、より安全なデフォルト値を使用
    const activityLevel = answers.activityLevel || 'moderate'; // lightからmoderateに変更
    const multipliers = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55
    };
    const tdee = bmr * (multipliers[activityLevel] || 1.55); // 1.375から1.55に変更
    
    // カウンセリングページと同じターゲットカロリー計算
    const goal = answers.primaryGoal || 'weight_loss';
    let targetCalories;
    switch (goal) {
      case 'weight_loss':
        targetCalories = tdee - 500; // アプリと統一（標準的な500kcal減）
        break;
      case 'muscle_gain':
        targetCalories = tdee + 300;
        break;
      case 'maintenance':
      default:
        targetCalories = tdee;
    }
    
    // カウンセリングページと同じPFC計算
    let proteinMultiplier = 1.6;
    if (goal === 'muscle_gain') proteinMultiplier = 2.0;
    if (goal === 'weight_loss') proteinMultiplier = 1.8;
    
    const protein = Math.round(weight * proteinMultiplier);
    const proteinCalories = protein * 4;
    
    const fatCalories = targetCalories * 0.25;
    const fat = Math.round(fatCalories / 9);
    
    const carbCalories = targetCalories - proteinCalories - fatCalories;
    const carbs = Math.round(carbCalories / 4);


    return {
      targetCalories: Math.round(targetCalories),
      bmr: Math.round(bmr),
      tdee: Math.round(tdee),
      macros: {
        protein,
        fat,
        carbs
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