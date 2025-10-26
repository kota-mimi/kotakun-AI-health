'use client';

import { Suspense } from 'react';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { CheckCircle, ArrowLeft } from 'lucide-react';

function PaymentSuccessContent() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-slate-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-8 text-center bg-white/80 backdrop-blur-sm shadow-lg">
        <div className="space-y-6">
          {/* 成功アイコン */}
          <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle size={32} className="text-green-600" />
          </div>
          
          {/* メッセージ */}
          <div className="space-y-3">
            <h1 className="text-2xl font-bold text-gray-900">
              お支払い完了！
            </h1>
            <p className="text-gray-600">
              プランのアップグレードが完了しました。<br />
              すべての機能をお楽しみください。
            </p>
          </div>
          
          {/* 次のステップ */}
          <div className="space-y-4 pt-4">
            <div className="text-left space-y-2">
              <p className="text-sm font-semibold text-gray-800">次にできること：</p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• AI会話・記録が無制限に</li>
                <li>• 1日のフィードバック機能が利用可能</li>
                <li>• 詳細な栄養分析を確認</li>
                <li>• アプリからAI記録機能を使用</li>
              </ul>
            </div>
            
            <Button 
              className="w-full bg-green-600 hover:bg-green-700 text-white"
              onClick={() => window.location.href = '/'}
            >
              <ArrowLeft size={16} className="mr-2" />
              アプリに戻る
            </Button>
          </div>
          
          {/* サポート情報 */}
          <div className="text-xs text-gray-500 pt-4 border-t border-gray-200">
            <p>ご不明な点がございましたら</p>
            <p>サポートまでお気軽にお問い合わせください</p>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div>読み込み中...</div>
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}