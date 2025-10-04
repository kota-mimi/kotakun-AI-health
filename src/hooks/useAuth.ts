import { useEffect, useState } from 'react';
import { useLiff } from '@/contexts/LiffContext';
import { FirestoreService } from '@/services/firestoreService';
import type { User, UserProfile } from '@/types';

export function useAuth() {
  const liff = useLiff();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUserData = async () => {
      if (!liff.isReady) return;

      setIsLoading(true);

      try {
        if (liff.isLoggedIn && liff.user) {
          // 本番環境対応：Firestoreアクセスを削除、基本ユーザー情報のみ設定
          const basicUser: User = {
            userId: `firebase_${liff.user.userId}`,
            lineUserId: liff.user.userId,
            profile: {
              name: liff.user.displayName || 'ユーザー',
              age: 30,
              gender: 'other',
              height: 170,
              weight: 70,
              activityLevel: 'moderate',
              goals: [],
            },
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          
          setUser(basicUser);
          setProfile(basicUser.profile);
        }
      } catch (error) {
        console.error('ユーザーデータ読み込みエラー:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, [liff.isReady, liff.isLoggedIn, liff.user]);

  const updateProfile = async (newProfile: UserProfile) => {
    setProfile(newProfile);
    
    if (user) {
      const updatedUser = {
        ...user,
        profile: newProfile,
        updatedAt: new Date(),
      };
      setUser(updatedUser);
    }
  };

  const clearUserData = () => {
    setUser(null);
    setProfile(null);
    localStorage.removeItem('userProfile');
    localStorage.removeItem('counselingAnswers');
    localStorage.removeItem('dailyRecords');
  };

  const hasCompletedCounseling = () => {
    // ローカルストレージで簡易チェック（本番環境対応）
    if (typeof window !== 'undefined') {
      return !!localStorage.getItem('counselingAnswers') || !!localStorage.getItem('hasCompletedCounseling');
    }
    return false;
  };

  const requireAuth = () => {
    if (!liff.isLoggedIn) {
      liff.login();
      return false;
    }
    return true;
  };

  const requireCounseling = () => {
    if (!hasCompletedCounseling()) {
      window.location.href = '/counseling';
      return false;
    }
    return true;
  };

  return {
    // LIFF関連
    isLiffReady: liff.isReady,
    isLoggedIn: liff.isLoggedIn,
    liffUser: liff.user,
    liffError: liff.error,
    isInClient: liff.isInClient,
    
    // ユーザー関連
    user,
    profile,
    isLoading,
    hasCompletedCounseling: hasCompletedCounseling(),
    
    // アクション
    login: liff.login,
    logout: liff.logout,
    updateProfile,
    clearUserData,
    requireAuth,
    requireCounseling,
    
    // LIFF機能
    closeWindow: liff.closeWindow,
    sendMessage: liff.sendMessage,
    openWindow: liff.openWindow,
  };
}