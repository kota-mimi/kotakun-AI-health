'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2 } from 'lucide-react';
import { useLiff } from '@/contexts/LiffContext';

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [sessionData, setSessionData] = useState<any>(null);
  const [countdown, setCountdown] = useState(5);
  const { isInClient, closeWindow } = useLiff();

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
        
        // 決済成功時、3秒後に自動でウィンドウを閉じる
        setTimeout(() => {
          if (isInClient) {
            closeWindow();
          } else {
            window.close();
            // ウィンドウが閉じれない場合のフォールバック
            setTimeout(() => {
              window.location.href = 'about:blank';
            }, 1000);
          }
        }, 3000);
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
            onClick={() => {
              if (isInClient) {
                closeWindow();
              } else {
                window.close();
                setTimeout(() => {
                  window.location.href = 'about:blank';
                }, 500);
              }
            }}
            className="w-full"
          >
            ページを閉じる
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* メインコンテンツエリア */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center max-w-md w-full">
          {/* 成功アイコン */}
          <div className="mb-8">
            <div className="bg-green-500 rounded-full p-4 w-20 h-20 mx-auto flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-white" />
            </div>
          </div>

          {/* メインメッセージ */}
          <h1 className="text-2xl font-bold mb-4 text-gray-900">
            決済完了
          </h1>
          
          <div className="bg-blue-50 rounded-lg p-4 mb-8 border border-blue-200">
            <p className="text-gray-700 mb-3">
              有料プランが開始されました
            </p>
            {sessionData?.planName && (
              <div className="bg-white rounded-lg p-3">
                <p className="text-sm text-gray-600 mb-1">ご契約プラン</p>
                <p className="text-lg font-bold text-blue-700">
                  {sessionData.planName}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  すべての機能をご利用いただけます
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
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