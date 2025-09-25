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
          const firestoreService = new FirestoreService();
          
          // Firestoreからユーザーデータを取得
          const firestoreUser = await firestoreService.getUser(liff.user.userId);
          
          if (firestoreUser) {
            // Firestoreからデータが見つかった場合
            setUser(firestoreUser);
            setProfile(firestoreUser.profile);
          } else {
            // Firestoreにデータがない場合、ローカルストレージから移行を試行
            const migrationSuccess = await firestoreService.migrateFromLocalStorage(liff.user.userId);
            
            if (migrationSuccess) {
              // 移行成功後、再度Firestoreからデータを取得
              const migratedUser = await firestoreService.getUser(liff.user.userId);
              if (migratedUser) {
                setUser(migratedUser);
                setProfile(migratedUser.profile);
              }
            } else {
              // 移行もできない場合、基本的なユーザーデータを作成
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
              
              // 基本ユーザーデータをFirestoreに保存
              await firestoreService.saveUser(liff.user.userId, basicUser);
              setUser(basicUser);
              setProfile(basicUser.profile);
            }
          }
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
    
    if (user && liff.user) {
      const firestoreService = new FirestoreService();
      
      // Firestoreにプロフィールを保存
      await firestoreService.saveUser(liff.user.userId, { profile: newProfile });
      
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
    return !!profile;
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