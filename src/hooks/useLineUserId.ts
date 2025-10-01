import { useState, useEffect } from 'react';

export function useLineUserId() {
  const [lineUserId, setLineUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const getLineUserId = async () => {
      console.log('useLineUserId: 開始');
      try {
        // LIFF環境かチェック
        if (typeof window !== 'undefined' && window.liff) {
          console.log('useLineUserId: LIFF環境を検出');
          await window.liff.init({
            liffId: process.env.NEXT_PUBLIC_LIFF_ID || ''
          });
          
          if (window.liff.isLoggedIn()) {
            const profile = await window.liff.getProfile();
            console.log('useLineUserId: LIFF profile取得成功', profile.userId);
            setLineUserId(profile.userId);
          } else {
            console.log('useLineUserId: LIFFでログインしていない');
          }
        } else {
          // LIFF環境でない場合（開発用）
          // ローカルストレージまたはテスト用IDを使用
          const testUserId = localStorage.getItem('testLineUserId') || 'test-user-001';
          console.log('useLineUserId: LIFF環境でない場合、テスト用ID使用', testUserId);
          setLineUserId(testUserId);
        }
      } catch (error) {
        console.error('LINE User ID 取得エラー:', error);
        // フォールバック: テスト用ID
        const testUserId = localStorage.getItem('testLineUserId') || 'test-user-001';
        console.log('useLineUserId: エラー発生、テスト用ID使用', testUserId);
        setLineUserId(testUserId);
      } finally {
        setIsLoading(false);
        console.log('useLineUserId: 完了');
      }
    };

    getLineUserId();
  }, []);

  return { lineUserId, isLoading };
}