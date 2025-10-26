import { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { createPaymentSession } from '../lib/payment';
import { 
  ArrowLeft, 
  Crown, 
  Check, 
  Star,
  Zap,
  MessageCircle,
  Camera,
  BarChart3,
  X
} from 'lucide-react';

interface PlanSettingsPageProps {
  onBack: () => void;
}

export function PlanSettingsPage({ onBack }: PlanSettingsPageProps) {
  const [currentPlan] = useState('free'); // free, monthly, quarterly, biannual
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
      features: [
        'AI会話：1日5通まで',
        'LINE記録：1日2通まで',
        '基本的な記録機能'
      ],
      limitations: [
        'アプリからAI記録は使用不可',
        '1日のフィードバック機能なし',
        '詳細分析機能なし'
      ]
    },
    {
      id: 'monthly',
      name: '月額プラン',
      price: 890,
      period: '月額',
      stripePriceId: 'price_monthly_plan', // Stripe価格ID（後で設定）
      isCurrentPlan: currentPlan === 'monthly',
      features: [
        'すべての機能が無制限',
        'AI会話・記録が使い放題',
        '1日のフィードバック機能',
        '詳細な栄養分析',
        '運動プラン提案',
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
      features: [
        'すべての機能が無制限',
        'AI会話・記録が使い放題',
        '1日のフィードバック機能',
        '詳細な栄養分析',
        '運動プラン提案',
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
      features: [
        'すべての機能が無制限',
        'AI会話・記録が使い放題',
        '1日のフィードバック機能',
        '詳細な栄養分析',
        '運動プラン提案',
        'アプリからAI記録機能'
      ]
    }
  ];

  const renderPlanCard = (plan: any) => (
    <Card key={plan.id} className={`relative p-6 transition-all duration-200 ${
      plan.isCurrentPlan 
        ? 'border-green-500 bg-green-50/50 shadow-lg' 
        : plan.isRecommended
        ? 'border-blue-500 bg-blue-50/50 shadow-lg scale-105'
        : 'border-gray-200 bg-white shadow-sm hover:shadow-md'
    }`}>
      {plan.isRecommended && (
        <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-4 py-1">
          <Star size={14} className="mr-1" />
          人気No.1
        </Badge>
      )}
      
      <div className="space-y-6">
        {/* プランヘッダー */}
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            {plan.id === 'free' && (
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                <Zap size={24} className="text-gray-600" />
              </div>
            )}
            {plan.id === 'monthly' && (
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <MessageCircle size={24} className="text-green-600" />
              </div>
            )}
            {plan.id === 'quarterly' && (
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Camera size={24} className="text-blue-600" />
              </div>
            )}
            {plan.id === 'biannual' && (
              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                <Crown size={24} className="text-purple-600" />
              </div>
            )}
          </div>
          
          <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
          
          <div className="space-y-1">
            {plan.price === 0 ? (
              <div className="text-3xl font-bold text-gray-900">無料</div>
            ) : (
              <>
                <div className="text-3xl font-bold text-gray-900">
                  ¥{plan.price.toLocaleString()}
                </div>
                <div className="text-sm text-gray-500">
                  {plan.monthlyPrice ? (
                    <>月額換算 ¥{plan.monthlyPrice}/月</>
                  ) : (
                    <>/{plan.period}</>
                  )}
                </div>
                {plan.discount && (
                  <Badge variant="secondary" className="bg-red-100 text-red-600 text-xs">
                    {plan.discount}
                  </Badge>
                )}
              </>
            )}
          </div>
        </div>

        {/* 機能一覧 */}
        <div className="space-y-3">
          {plan.features.map((feature, index) => (
            <div key={index} className="flex items-start space-x-3">
              <Check size={18} className="text-green-500 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-gray-700">{feature}</span>
            </div>
          ))}
          {plan.limitations?.map((limitation, index) => (
            <div key={`limit-${index}`} className="flex items-start space-x-3 opacity-60">
              <X size={18} className="text-gray-400 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-gray-500">{limitation}</span>
            </div>
          ))}
        </div>

        {/* アクションボタン */}
        <div className="pt-4">
          {plan.isCurrentPlan ? (
            <Button variant="outline" className="w-full" disabled>
              現在のプラン
            </Button>
          ) : plan.id === 'free' ? (
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => handlePlanChange(plan)}
              disabled={isProcessing}
            >
              {isProcessing ? '処理中...' : '無料プランに変更'}
            </Button>
          ) : (
            <Button 
              className={`w-full ${
                plan.isRecommended 
                  ? 'bg-blue-600 hover:bg-blue-700' 
                  : 'bg-green-600 hover:bg-green-700'
              } text-white disabled:opacity-50`}
              onClick={() => handlePlanChange(plan)}
              disabled={isProcessing}
            >
              {isProcessing ? '処理中...' : 'このプランを選択'}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50">
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
        <div className="text-center mb-8 mt-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">あなたに最適なプランを選択</h2>
          <p className="text-gray-600">健康管理をもっと効果的に。いつでもプラン変更可能です。</p>
        </div>

        {/* 現在の利用状況 */}
        <Card className="mb-8 p-6 bg-white/80 backdrop-blur-sm shadow-sm">
          <div className="flex items-center space-x-3 mb-4">
            <BarChart3 size={20} className="text-green-600" />
            <h3 className="font-semibold text-gray-800">今月の利用状況</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-xs text-gray-500 mb-1">AI会話</div>
              <div className="text-lg font-bold text-gray-800">23/150</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-xs text-gray-500 mb-1">LINE記録</div>
              <div className="text-lg font-bold text-gray-800">45/60</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-xs text-gray-500 mb-1">利用日数</div>
              <div className="text-lg font-bold text-gray-800">18日</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-xs text-gray-500 mb-1">継続日数</div>
              <div className="text-lg font-bold text-gray-800">42日</div>
            </div>
          </div>
        </Card>

        {/* プラン一覧 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {plans.map(plan => renderPlanCard(plan))}
        </div>

        {/* 注意事項 */}
        <Card className="p-6 bg-gray-50/80 backdrop-blur-sm shadow-sm">
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