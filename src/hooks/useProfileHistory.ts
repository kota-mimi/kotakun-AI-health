import { useState, useEffect } from 'react';
import { getProfileForDate, getLatestProfile, type ProfileHistoryEntry } from '@/lib/profileHistory';
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
      const userId = `firebase_${liffUser.userId}`;
      
      const profile = await getProfileForDate(userId, dateString);
      setProfileData(profile);
      
      console.log('📊 プロフィール履歴取得:', {
        targetDate: dateString,
        userId,
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
      
      const userId = `firebase_${liffUser.userId}`;
      const profile = await getLatestProfile(userId);
      setProfileData(profile);
      
      console.log('📊 最新プロフィール取得:', {
        userId,
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

    if (typeof window !== 'undefined') {
      window.addEventListener('counselingDataUpdated', handleProfileUpdate);
      
      return () => {
        window.removeEventListener('counselingDataUpdated', handleProfileUpdate);
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
  if (profileData) {
    // プロフィール履歴から取得
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
    return {
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
  }

  // デフォルト値
  return {
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
}