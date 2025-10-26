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
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="p-8 text-center max-w-md mx-auto">
        <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
        <h1 className="text-xl font-semibold mb-2 text-green-600">
          決済完了！
        </h1>
        <p className="text-gray-600 mb-4">
          お支払いが正常に処理されました。
          {sessionData?.planName && (
            <>
              <br />
              <strong>{sessionData.planName}</strong>にアップグレードされました。
            </>
          )}
        </p>
        <div className="space-y-2 mb-6">
          <Button 
            onClick={() => window.location.href = '/'}
            className="w-full"
          >
            アプリを使い始める
          </Button>
          <Button 
            variant="outline"
            onClick={() => window.location.href = '/settings'}
            className="w-full"
          >
            設定を確認
          </Button>
        </div>
        <p className="text-xs text-gray-500">
          セッションID: {sessionId}
        </p>
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