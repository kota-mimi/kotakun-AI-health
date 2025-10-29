import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  ArrowLeft, 
  CreditCard, 
  Calendar,
  DollarSign,
  FileText,
  CheckCircle,
  AlertCircle,
  Download
} from 'lucide-react';

interface PaymentSettingsPageProps {
  onBack: () => void;
}

export function PaymentSettingsPage({ onBack }: PaymentSettingsPageProps) {
  const { liffUser } = useAuth();
  const [currentSubscription, setCurrentSubscription] = useState({
    status: 'free', // free, active, expired, canceled
    plan: '無料プラン',
    nextBilling: null,
    amount: 0
  });

  const [paymentHistory, setPaymentHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // 支払い履歴を取得
  useEffect(() => {
    const fetchPaymentHistory = async () => {
      if (!liffUser?.userId) {
        setIsLoading(false);
        return;
      }

      try {
        // テスト: unknown ユーザーIDでも試してみる
        const testUserId = 'unknown';
        console.log('🔍 Fetching payment history for userId:', liffUser.userId);
        console.log('🧪 Also testing with unknown userId for debugging');
        
        const response = await fetch(`/api/payment/history?userId=${liffUser.userId}`);
        const testResponse = await fetch(`/api/payment/history?userId=${testUserId}`);
        
        console.log('📡 Payment history API response status:', response.status);
        console.log('📡 Test (unknown) API response status:', testResponse.status);
        
        // メインのレスポンスをチェック
        if (response.ok) {
          const data = await response.json();
          console.log('📊 Payment history data:', data);
          
          if (data.success) {
            setPaymentHistory(data.payments);
            console.log('💳 Setting payment history:', data.payments);
            
            // 最新の支払いからサブスクリプション状態を判定
            if (data.payments.length > 0) {
              const latestPayment = data.payments[0];
              setCurrentSubscription({
                status: 'active',
                plan: latestPayment.planName,
                nextBilling: null, // TODO: 次回請求日の計算
                amount: latestPayment.amount
              });
            }
          }
        } else {
          console.error('❌ Payment history API failed:', response.status, response.statusText);
        }
        
        // テストレスポンスもチェック
        if (testResponse.ok) {
          const testData = await testResponse.json();
          console.log('🧪 Test (unknown) payment history data:', testData);
          
          // もし unknown ユーザーIDにデータがあれば、それを表示（デバッグ用）
          if (testData.success && testData.payments.length > 0) {
            console.log('🎯 Found payments for unknown user - using this data for now');
            setPaymentHistory(testData.payments);
            
            const latestPayment = testData.payments[0];
            setCurrentSubscription({
              status: 'active',
              plan: latestPayment.planName,
              nextBilling: null,
              amount: latestPayment.amount
            });
          }
        }
      } catch (error) {
        console.error('Failed to fetch payment history:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPaymentHistory();
  }, [liffUser?.userId]);

  return (
    <div className="min-h-screen bg-white">
      {/* ヘッダー */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="flex items-center justify-between p-4 max-w-4xl mx-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft size={20} />
            <span>戻る</span>
          </Button>
          <h1 className="text-lg font-semibold text-gray-800">支払い設定</h1>
          <div className="w-16"></div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 pb-20">
        {/* 説明セクション */}
        <div className="text-center mb-12 mt-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">支払い情報・履歴</h2>
          <p className="text-gray-600">現在の契約状況と支払い履歴を確認できます。</p>
        </div>

        {/* 現在のサブスクリプション状況 */}
        <Card className="p-6 bg-white/80 backdrop-blur-sm shadow-sm">
          <div className="flex items-center space-x-3 mb-4">
            <CreditCard size={20} className="text-blue-600" />
            <h3 className="font-semibold text-gray-800">現在の契約状況</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">{currentSubscription.plan}</div>
                <div className="text-sm text-gray-500">
                  {currentSubscription.status === 'free' && '無料でご利用中'}
                  {currentSubscription.status === 'active' && 'アクティブな契約'}
                  {currentSubscription.status === 'expired' && '契約期限切れ'}
                  {currentSubscription.status === 'canceled' && 'キャンセル済み'}
                </div>
              </div>
              <Badge 
                className={`${
                  currentSubscription.status === 'free' ? 'bg-gray-100 text-gray-700' :
                  currentSubscription.status === 'active' ? 'bg-green-100 text-green-700' :
                  'bg-red-100 text-red-700'
                }`}
              >
                {currentSubscription.status === 'free' && '無料'}
                {currentSubscription.status === 'active' && 'アクティブ'}
                {currentSubscription.status === 'expired' && '期限切れ'}
                {currentSubscription.status === 'canceled' && 'キャンセル'}
              </Badge>
            </div>

            {currentSubscription.status === 'active' && currentSubscription.nextBilling && (
              <div className="pt-4 border-t border-gray-200">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-xs text-blue-600 mb-1">次回請求日</div>
                    <div className="font-semibold text-blue-900">{currentSubscription.nextBilling}</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-xs text-green-600 mb-1">請求金額</div>
                    <div className="font-semibold text-green-900">¥{currentSubscription.amount?.toLocaleString()}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>

        <div className="h-6"></div>

        {/* アクション */}
        <Card className="p-6 bg-white/80 backdrop-blur-sm shadow-sm">
          <div className="flex items-center space-x-3 mb-4">
            <DollarSign size={20} className="text-green-600" />
            <h3 className="font-semibold text-gray-800">プラン管理</h3>
          </div>
          
          <div className="space-y-3">
            <Button 
              className="w-full justify-start"
              onClick={() => console.log('プラン変更へ')}
            >
              <CreditCard size={16} className="mr-2" />
              プラン変更・アップグレード
            </Button>
            
            {currentSubscription.status === 'active' && (
              <Button 
                variant="outline"
                className="w-full justify-start border-red-300 text-red-700 hover:bg-red-50"
                onClick={() => console.log('キャンセル')}
              >
                <AlertCircle size={16} className="mr-2" />
                サブスクリプションをキャンセル
              </Button>
            )}
          </div>
        </Card>

        <div className="h-6"></div>

        {/* 支払い履歴 */}
        <Card className="p-6 bg-white/80 backdrop-blur-sm shadow-sm">
          <div className="flex items-center space-x-3 mb-4">
            <FileText size={20} className="text-purple-600" />
            <h3 className="font-semibold text-gray-800">支払い履歴</h3>
          </div>
          
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-gray-600">支払い履歴を読み込み中...</p>
            </div>
          ) : paymentHistory.length === 0 ? (
            <div className="text-center py-8">
              <Calendar size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">支払い履歴はありません</p>
              <p className="text-sm text-gray-400 mt-2">
                有料プランを契約すると、こちらに履歴が表示されます
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {paymentHistory.map((payment: any, index) => (
                <div key={payment.id || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <CheckCircle size={16} className="text-green-500" />
                    <div>
                      <div className="font-medium text-gray-900">{payment.planName}</div>
                      <div className="text-sm text-gray-500">{payment.date}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">¥{payment.amount?.toLocaleString()}</div>
                    <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                      <Download size={12} className="mr-1" />
                      領収書
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <div className="h-6"></div>

        {/* サポート情報 */}
        <Card className="p-6 bg-gray-50/80 backdrop-blur-sm shadow-sm">
          <h4 className="font-semibold text-gray-800 mb-3">支払いに関するご注意</h4>
          <div className="space-y-2 text-sm text-gray-600">
            <p>• 支払いはStripeによる安全な決済システムを使用しています</p>
            <p>• クレジットカード情報は暗号化されて保護されます</p>
            <p>• 契約の変更・キャンセルはいつでも可能です</p>
            <p>• ご不明な点がございましたらサポートまでお問い合わせください</p>
          </div>
        </Card>
      </div>
    </div>
  );
}