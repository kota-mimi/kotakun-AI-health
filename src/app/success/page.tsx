'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SuccessPage() {
  const router = useRouter();

  useEffect(() => {
    // 3秒後にホームページにリダイレクト
    const timer = setTimeout(() => {
      router.push('/');
    }, 3000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-100 to-blue-100">
      <div className="max-w-md w-full mx-4 p-8 bg-white rounded-2xl shadow-xl text-center">
        <div className="mb-6">
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            決済が完了しました！
          </h1>
          <p className="text-gray-600">
            トライアルが開始されました。<br />
            3日間無料でサービスをご利用いただけます。
          </p>
        </div>
        
        <div className="text-sm text-gray-500 mb-4">
          3秒後にホームページに戻ります...
        </div>
        
        <button
          onClick={() => router.push('/')}
          className="w-full bg-blue-500 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-600 transition-colors"
        >
          すぐにホームに戻る
        </button>
      </div>
    </div>
  );
}