import { useState, useEffect } from 'react';

export function useLineUserId() {
  const [lineUserId, setLineUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const getLineUserId = async () => {
      try {
        // LIFF環境かチェック
        if (typeof window !== 'undefined' && window.liff) {
          await window.liff.init({
            liffId: process.env.NEXT_PUBLIC_LIFF_ID || ''
          });
          
          if (window.liff.isLoggedIn()) {
            const profile = await window.liff.getProfile();
            setLineUserId(profile.userId);
          } else {
          }
        } else {
          // 本番環境：LIFF環境でない場合はnullのまま
          console.warn('LIFF環境ではありません。LINEアプリから開いてください。');
          setLineUserId(null);
        }
      } catch (error) {
        console.error('LINE User ID 取得エラー:', error);
        // 本番環境：エラー時もnullのまま
        setLineUserId(null);
      } finally {
        setIsLoading(false);
      }
    };

    getLineUserId();
  }, []);

  return { lineUserId, isLoading };
}