'use client';

import { useAuth } from '@/hooks/useAuth';
import { useEffect } from 'react';

export default function Home() {
  const { 
    isLiffReady, 
    isLoggedIn, 
    hasCompletedCounseling,
    login
  } = useAuth();

  useEffect(() => {
    // LIFF準備完了後、直接ダッシュボードへリダイレクト
    if (isLiffReady) {
      if (isLoggedIn && hasCompletedCounseling) {
        window.location.href = '/dashboard';
      } else if (isLoggedIn && !hasCompletedCounseling) {
        window.location.href = '/counseling';
      } else {
        // 未ログインの場合は自動ログイン試行
        login();
      }
    }
  }, [isLiffReady, isLoggedIn, hasCompletedCounseling, login]);

  // ローディング表示
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
        <p className="text-gray-600">アプリを読み込み中...</p>
      </div>
    </div>
  );
}