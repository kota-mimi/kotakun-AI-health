import { useState, useEffect } from 'react';
import FirestoreService from '@/services/firestoreService';

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
      dailyCalories: counselingFallback.aiAnalysis?.nutritionPlan?.dailyCalories
    } : null
  });

  if (profileData) {
    // プロフィール履歴から取得
    console.log('✅ プロフィール履歴から目標値取得:', profileData);
    return {
      targetCalories: profileData.targetCalories,
      bmr: profileData.bmr,
      tdee: profileData.tdee,
      macros: profileData.macros,
      fromHistory: true
    };
  }

  if (counselingFallback?.aiAnalysis?.nutritionPlan) {
    // カウンセリング結果からフォールバック
    const fallbackValues = {
      targetCalories: counselingFallback.aiAnalysis.nutritionPlan.dailyCalories || 2000,
      bmr: counselingFallback.aiAnalysis.nutritionPlan.bmr || 1200,
      tdee: counselingFallback.aiAnalysis.nutritionPlan.tdee || 1800,
      macros: {
        protein: counselingFallback.aiAnalysis.nutritionPlan.macros?.protein || 120,
        fat: counselingFallback.aiAnalysis.nutritionPlan.macros?.fat || 60,
        carbs: counselingFallback.aiAnalysis.nutritionPlan.macros?.carbs || 250
      },
      fromHistory: false
    };
    console.log('📋 カウンセリング結果から目標値取得:', fallbackValues);
    return fallbackValues;
  }

  // デフォルト値
  const defaultValues = {
    targetCalories: 2000,
    bmr: 1200,
    tdee: 1800,
    macros: {
      protein: 120,
      fat: 60,
      carbs: 250
    },
    fromHistory: false
  };
  console.log('⚠️ デフォルト値を使用:', defaultValues);
  return defaultValues;
}