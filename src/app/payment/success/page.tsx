'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2 } from 'lucide-react';

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [sessionData, setSessionData] = useState<any>(null);

  useEffect(() => {
    if (sessionId) {
      verifyPayment(sessionId);
    } else {
      setStatus('error');
    }
  }, [sessionId]);

  const verifyPayment = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/payment/verify?session_id=${sessionId}`);
      if (response.ok) {
        const data = await response.json();
        setSessionData(data);
        setStatus('success');
      } else {
        setStatus('error');
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      setStatus('error');
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="p-8 text-center max-w-md mx-auto">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-blue-600 mb-4" />
          <h1 className="text-xl font-semibold mb-2">決済処理中</h1>
          <p className="text-gray-600">決済情報を確認しています...</p>
        </Card>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="p-8 text-center max-w-md mx-auto">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-600 text-xl">✗</span>
          </div>
          <h1 className="text-xl font-semibold mb-2 text-red-600">決済エラー</h1>
          <p className="text-gray-600 mb-4">
            決済の処理中にエラーが発生しました。
          </p>
          <Button 
            onClick={() => window.location.href = '/'}
            className="w-full"
          >
            ホームに戻る
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 flex items-center justify-center p-4">
      <Card className="p-8 text-center max-w-lg mx-auto bg-white/80 backdrop-blur-sm shadow-2xl border-0 rounded-3xl">
        {/* 成功アイコンとエフェクト */}
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-green-400 rounded-full opacity-20 animate-ping"></div>
          <div className="relative bg-gradient-to-r from-green-400 to-emerald-500 rounded-full p-4 w-20 h-20 mx-auto flex items-center justify-center">
            <CheckCircle className="h-10 w-10 text-white" />
          </div>
        </div>

        {/* メインメッセージ */}
        <h1 className="text-3xl font-bold mb-3 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
          🎉 決済完了！
        </h1>
        
        <div className="bg-green-50 rounded-2xl p-4 mb-6 border border-green-200">
          <p className="text-gray-700 text-lg font-medium mb-2">
            お支払いが正常に処理されました
          </p>
          {sessionData?.planName && (
            <div className="bg-white rounded-xl p-3 border border-green-300">
              <p className="text-sm text-gray-600 mb-1">アップグレード完了</p>
              <p className="text-xl font-bold text-green-700">
                {sessionData.planName}
              </p>
            </div>
          )}
        </div>

        {/* アクションボタン */}
        <div className="space-y-3 mb-6">
          <Button 
            onClick={() => window.location.href = '/dashboard'}
            className="w-full h-12 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-2xl shadow-lg transform transition-all duration-200 hover:scale-105"
          >
            🏠 ダッシュボードに戻る
          </Button>
          <Button 
            variant="outline"
            onClick={() => window.location.href = '/settings'}
            className="w-full h-12 border-2 border-gray-300 hover:border-blue-400 text-gray-700 hover:text-blue-600 font-semibold rounded-2xl transition-all duration-200 hover:scale-105"
          >
            ⚙️ プラン設定を確認
          </Button>
        </div>

        {/* サポート情報 */}
        <div className="bg-blue-50 rounded-2xl p-4 border border-blue-200">
          <p className="text-sm text-blue-800 font-medium mb-1">
            💡 すべての機能が利用可能になりました
          </p>
          <p className="text-xs text-blue-600">
            AI分析・記録・フィードバック機能をお楽しみください
          </p>
        </div>

        {/* セッション情報（開発用） */}
        {process.env.NODE_ENV === 'development' && (
          <details className="mt-4">
            <summary className="text-xs text-gray-400 cursor-pointer">開発情報</summary>
            <p className="text-xs text-gray-400 mt-2">
              Session: {sessionId}
            </p>
          </details>
        )}
      </Card>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="p-8 text-center max-w-md mx-auto">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-blue-600 mb-4" />
          <h1 className="text-xl font-semibold mb-2">読み込み中</h1>
          <p className="text-gray-600">決済情報を確認しています...</p>
        </Card>
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}