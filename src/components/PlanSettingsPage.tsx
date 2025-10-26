import { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { createPaymentSession } from '../lib/payment';
import { 
  ArrowLeft, 
  Check, 
  Star,
  X
} from 'lucide-react';

interface PlanSettingsPageProps {
  onBack: () => void;
}

export function PlanSettingsPage({ onBack }: PlanSettingsPageProps) {
  const [currentPlan, setCurrentPlan] = useState('free'); // free, monthly, quarterly, biannual
  const [selectedPlan, setSelectedPlan] = useState('biannual'); // 表示用の選択状態（人気No.1を初期選択）
  const [isProcessing, setIsProcessing] = useState(false);

  // 決済処理ハンドラー
  const handlePlanChange = async (selectedPlan: any) => {
    setIsProcessing(true);
    
    try {
      if (selectedPlan.id === 'free') {
        // 無料プランへの変更
        console.log('無料プランに変更');
        // TODO: サーバーAPIを呼び出してプラン変更
        // await changePlan('current_user_id', 'free');
        alert('無料プランに変更しました！');
      } else {
        // 有料プランの場合は決済フローへ
        console.log('決済フローを開始:', selectedPlan);
        
        // 決済セッション作成
        const session = await createPaymentSession(
          selectedPlan.id,
          'current_user_id', // TODO: 実際のユーザーIDを取得
          `${window.location.origin}/payment/success`,
          `${window.location.origin}/payment/cancel`
        );

        // Stripe Checkoutにリダイレクト（現在はモック）
        if (session.url) {
          window.location.href = session.url;
        } else {
          // モック用アラート
          alert(`${selectedPlan.name}の決済を開始します。\n金額: ¥${selectedPlan.price.toLocaleString()}`);
        }
      }
    } catch (error) {
      console.error('プラン変更エラー:', error);
      alert('エラーが発生しました。しばらく後でお試しください。');
    } finally {
      setIsProcessing(false);
    }
  };

  const plans = [
    {
      id: 'free',
      name: '無料プラン',
      price: 0,
      period: '無料',
      isCurrentPlan: currentPlan === 'free',
      isSelected: selectedPlan === 'free',
      features: [
        'AI会話：1日5通まで',
        'LINE記録：1日2通まで',
        '基本的な記録機能'
      ],
      limitations: [
        'アプリからAI記録は使用不可',
        '1日のフィードバック機能なし'
      ]
    },
    {
      id: 'monthly',
      name: '月額プラン',
      price: 890,
      period: '月額',
      stripePriceId: 'price_monthly_plan', // Stripe価格ID（後で設定）
      isCurrentPlan: currentPlan === 'monthly',
      isSelected: selectedPlan === 'monthly',
      features: [
        'すべての機能が無制限',
        'AI会話・記録が使い放題',
        '1日のフィードバック機能',
        'アプリからAI記録機能'
      ]
    },
    {
      id: 'quarterly',
      name: '3ヶ月プラン',
      price: 2480,
      period: '3ヶ月',
      monthlyPrice: 827,
      discount: '7%OFF',
      stripePriceId: 'price_quarterly_plan', // Stripe価格ID（後で設定）
      isCurrentPlan: currentPlan === 'quarterly',
      isSelected: selectedPlan === 'quarterly',
      features: [
        'すべての機能が無制限',
        'AI会話・記録が使い放題',
        '1日のフィードバック機能',
        'アプリからAI記録機能'
      ]
    },
    {
      id: 'biannual',
      name: '半年プラン',
      price: 3480,
      period: '半年',
      monthlyPrice: 580,
      discount: '35%OFF',
      stripePriceId: 'price_biannual_plan', // Stripe価格ID（後で設定）
      isRecommended: true,
      isCurrentPlan: currentPlan === 'biannual',
      isSelected: selectedPlan === 'biannual',
      features: [
        'すべての機能が無制限',
        'AI会話・記録が使い放題',
        '1日のフィードバック機能',
        'アプリからAI記録機能'
      ]
    }
  ];

  const renderPlanCard = (plan: any) => (
    <Card 
      key={plan.id} 
      className={`relative p-4 transition-all duration-300 border-2 bg-white/80 backdrop-blur-sm cursor-pointer transform hover:scale-102 ${
        plan.isSelected 
          ? 'border-blue-500 shadow-lg scale-102 ring-1 ring-blue-200' 
          : plan.isCurrentPlan
          ? 'border-green-500 shadow-lg scale-102'
          : 'border-gray-300 shadow-sm hover:shadow-lg hover:border-blue-300'
      }`}
      onClick={() => setSelectedPlan(plan.id)}
    >
      
      {plan.isSelected && (
        <div className="absolute top-2 left-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center shadow-sm">
          <Check size={12} className="text-white" />
        </div>
      )}
      
      <div className="space-y-3">
        {/* 人気バッジ（上部中央） */}
        {plan.isRecommended && (
          <div className="text-center">
            <div className="inline-flex items-center bg-blue-600 text-white px-2 py-0.5 rounded-full text-xs font-medium">
              <Star size={10} className="mr-1" />
              人気
            </div>
          </div>
        )}
        
        {/* メインコンテンツ（左右分割） */}
        <div className="flex space-x-3">
          {/* 左側：プラン情報 */}
          <div className="flex-1 space-y-1">
            <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
            <div className="space-y-0.5">
              {plan.price === 0 ? (
                <div className="text-xl font-bold text-gray-900">無料</div>
              ) : (
                <>
                  <div className="text-xl font-bold text-gray-900">
                    ¥{plan.price.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500">
                    {plan.monthlyPrice ? (
                      <>月額換算 ¥{plan.monthlyPrice}/月</>
                    ) : (
                      <>/{plan.period}</>
                    )}
                  </div>
                  {plan.discount && (
                    <Badge variant="secondary" className="bg-red-100 text-red-600 text-xs px-1 py-0">
                      {plan.discount}
                    </Badge>
                  )}
                </>
              )}
            </div>
          </div>

          {/* 右側：機能一覧 */}
          <div className="flex-1 space-y-1">
            {plan.features.map((feature, index) => (
              <div key={index} className="flex items-start space-x-1">
                <Check size={12} className="text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-xs text-gray-700">{feature}</span>
              </div>
            ))}
            {plan.limitations?.map((limitation, index) => (
              <div key={`limit-${index}`} className="flex items-start space-x-1 opacity-60">
                <X size={12} className="text-gray-400 flex-shrink-0 mt-0.5" />
                <span className="text-xs text-gray-500">{limitation}</span>
              </div>
            ))}
          </div>
        </div>

        {/* アクションボタン */}
        <div className="pt-2">
          {plan.isCurrentPlan ? (
            <Button variant="outline" className="w-full h-8 text-xs" disabled>
              現在のプラン
            </Button>
          ) : plan.id === 'free' ? (
            <Button 
              variant="outline" 
              className="w-full h-8 text-xs"
              onClick={() => handlePlanChange(plan)}
              disabled={isProcessing}
            >
              {isProcessing ? '処理中...' : '無料プランに変更'}
            </Button>
          ) : (
            <Button 
              className={`w-full h-8 text-xs transition-all duration-200 ${
                plan.isSelected
                  ? 'bg-blue-600 hover:bg-blue-700 ring-1 ring-blue-300' 
                  : 'bg-blue-500 hover:bg-blue-600'
              } text-white disabled:opacity-50 shadow-sm hover:shadow-md`}
              onClick={(e) => {
                e.stopPropagation();
                handlePlanChange(plan);
              }}
              disabled={isProcessing}
            >
              {isProcessing ? '処理中...' : plan.isSelected ? '選択中' : '選択'}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );

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
          <h1 className="text-lg font-semibold text-gray-800">プラン変更</h1>
          <div className="w-16"></div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 pb-20">
        {/* 説明セクション */}
        <div className="text-center mb-6 mt-4">
          <h2 className="text-xl font-bold text-gray-900 mb-2">プランの種類</h2>
        </div>

        {/* プラン一覧 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {plans.map(plan => renderPlanCard(plan))}
        </div>

        <div className="h-4"></div>

        {/* 注意事項 */}
        <Card className="p-6 bg-white/80 backdrop-blur-sm shadow-sm">
          <h4 className="font-semibold text-gray-800 mb-3">プラン変更について</h4>
          <div className="space-y-2 text-sm text-gray-600">
            <p>• プラン変更は即時反映されます</p>
            <p>• 有料プランの途中解約の場合、残り期間分は返金されません</p>
            <p>• 無料プランへの変更はいつでも可能です</p>
            <p>• 次回更新日前日まで現在のプランが継続されます</p>
          </div>
        </Card>
      </div>
    </div>
  );
}