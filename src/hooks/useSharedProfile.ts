import { useState, useEffect, createContext, useContext } from 'react';
import { useAuth } from './useAuth';
import { apiCache, createCacheKey } from '@/lib/cache';

interface ProfileData {
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

interface SharedProfileContextType {
  latestProfile: ProfileData | null;
  getProfileForDate: (date: Date) => ProfileData | null;
  isLoading: boolean;
  error: string | null;
}

// コンテキスト作成（オプション：使わない場合は直接hookで）
export const SharedProfileContext = createContext<SharedProfileContextType | null>(null);

// 🚀 統合プロフィールhook（重複API呼び出し解消）
export function useSharedProfile() {
  const { liffUser } = useAuth();
  const [latestProfile, setLatestProfile] = useState<ProfileData | null>(null);
  const [profileCache, setProfileCache] = useState<Map<string, ProfileData>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 📦 軽量プロフィール取得（一度だけ）
  const fetchLatestProfile = async () => {
    if (!liffUser?.userId || isLoading) return;

    try {
      setIsLoading(true);
      setError(null);

      // キャッシュキーと確認
      const cacheKey = createCacheKey('profile', liffUser.userId, 'latest');
      const cachedProfile = apiCache.get(cacheKey);

      if (cachedProfile) {
        setLatestProfile(cachedProfile);
        console.log('⚡ 最新プロフィールをキャッシュから取得');
        return;
      }

      // API呼び出し（統合・一度だけ）
      const response = await fetch(`/api/profile/history?lineUserId=${liffUser.userId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        const profiles = result.data;
        const profile = Array.isArray(profiles) && profiles.length > 0 ? profiles[0] : null;
        
        if (profile) {
          // キャッシュに保存（5分間）
          apiCache.set(cacheKey, profile, 5 * 60 * 1000);
          setLatestProfile(profile);
          
          console.log('✅ 最新プロフィールを取得・キャッシュ保存');
        }
      }
      
    } catch (err) {
      console.error('❌ 共有プロフィール取得エラー:', err);
      setError(err instanceof Error ? err.message : 'プロフィール取得失敗');
    } finally {
      setIsLoading(false);
    }
  };

  // 📅 特定日付のプロフィール取得（必要時のみ）
  const getProfileForDate = async (date: Date): Promise<ProfileData | null> => {
    if (!liffUser?.userId) return null;

    const dateString = date.toISOString().split('T')[0];
    
    // ローカルキャッシュチェック
    if (profileCache.has(dateString)) {
      return profileCache.get(dateString) || null;
    }

    // 今日の日付なら最新プロフィールを返す
    const today = new Date().toISOString().split('T')[0];
    if (dateString === today && latestProfile) {
      return latestProfile;
    }

    try {
      // API呼び出し（日付ベース）
      const response = await fetch(`/api/profile/history?lineUserId=${liffUser.userId}&targetDate=${dateString}`);
      
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          // ローカルキャッシュに保存
          setProfileCache(prev => new Map(prev).set(dateString, result.data));
          return result.data;
        }
      }
    } catch (error) {
      console.error('❌ 日付ベースプロフィール取得エラー:', error);
    }

    // 🏥 健康アプリ仕様：過去の日付も最新の目標値で評価（医学的に正しい）
    return latestProfile;
  };

  // 初期化（一度だけ）
  useEffect(() => {
    fetchLatestProfile();
  }, [liffUser?.userId]);

  // イベントリスナー（プロフィール更新時）
  useEffect(() => {
    const handleProfileUpdate = () => {
      fetchLatestProfile();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('profileHistoryUpdated', handleProfileUpdate);
      window.addEventListener('counselingDataUpdated', handleProfileUpdate);
      
      return () => {
        window.removeEventListener('profileHistoryUpdated', handleProfileUpdate);
        window.removeEventListener('counselingDataUpdated', handleProfileUpdate);
      };
    }
  }, []);

  return {
    latestProfile,
    getProfileForDate,
    isLoading,
    error,
    refetch: fetchLatestProfile,
  };
}