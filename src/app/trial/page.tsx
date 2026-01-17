'use client';

import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Sparkles, 
  MessageCircle, 
  BarChart3, 
  Brain,
  Timer,
  CreditCard,
  ArrowRight
} from 'lucide-react';

export default function TrialPage() {
  const { isLiffReady, isLoggedIn } = useAuth();

  const handleStartTrial = () => {
    // TODO: Stripe決済フローに進む
    console.log('トライアル開始');
  };

  if (!isLiffReady) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* ヘッダー */}
      <div className="bg-white shadow-sm">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="text-center">
            <Badge className="bg-green-100 text-green-800 border-green-200 mb-2">
              <Timer className="w-3 h-3 mr-1" />
              今だけ限定
            </Badge>
            <h1 className="text-2xl font-bold text-gray-900">
              3日間無料体験
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              あなた専用の健康プランを体験
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 space-y-6">
        
        {/* メイン訴求 */}
        <Card className="p-6 text-center bg-gradient-to-r from-green-500 to-blue-600 text-white">
          <div className="mb-4">
            <Sparkles className="w-12 h-12 mx-auto mb-3" />
            <h2 className="text-xl font-bold mb-2">
              すべての機能が使い放題
            </h2>
            <p className="text-green-100">
              カウンセリング結果を元に、<br />
              あなた専用の健康管理を体験
            </p>
          </div>
        </Card>

        {/* 機能紹介 */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800 text-center">
            利用できる機能
          </h3>
          
          <div className="space-y-3">
            <Card className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <MessageCircle className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">AI会話</h4>
                  <p className="text-sm text-gray-600">健康に関する質問が無制限</p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <BarChart3 className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">記録機能</h4>
                  <p className="text-sm text-gray-600">食事・運動・体重の記録が無制限</p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Brain className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">パーソナル分析</h4>
                  <p className="text-sm text-gray-600">あなた専用のアドバイスを毎日</p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* 価格情報 */}
        <Card className="p-6 text-center">
          <div className="mb-4">
            <div className="text-3xl font-bold text-gray-900 mb-1">
              3日間無料
            </div>
            <div className="text-sm text-gray-600 mb-3">
              その後 月額790円
            </div>
            <div className="text-xs text-gray-500">
              いつでも解約可能
            </div>
          </div>
          
          <Button 
            onClick={handleStartTrial}
            className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-semibold py-3 text-lg"
          >
            <CreditCard className="w-5 h-5 mr-2" />
            無料で始める
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </Card>

        {/* 注意事項 */}
        <div className="text-xs text-gray-500 text-center space-y-1">
          <p>• クレジットカード登録が必要です</p>
          <p>• 3日後から自動的に月額790円が課金されます</p>
          <p>• 無料期間中はいつでも解約可能です</p>
        </div>
      </div>
    </div>
  );
}