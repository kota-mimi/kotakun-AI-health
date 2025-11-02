import { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { createPaymentSession } from '../lib/payment';
import { useAuth } from '@/hooks/useAuth';
import { 
  ArrowLeft, 
  Check, 
  Star,
  X,
  AlertCircle
} from 'lucide-react';

interface PlanSettingsPageProps {
  onBack: () => void;
}

interface PlanInfo {
  plan: 'free' | 'monthly' | 'quarterly';
  planName: string;
  status: 'active' | 'inactive' | 'cancelled' | 'cancel_at_period_end';
  currentPeriodEnd?: Date;
  stripeSubscriptionId?: string;
}

export function PlanSettingsPage({ onBack }: PlanSettingsPageProps) {
  const { liffUser } = useAuth();
  const [currentPlan, setCurrentPlan] = useState<PlanInfo>({
    plan: 'free',
    planName: '無料プラン',
    status: 'inactive'
  });
  const [selectedPlan, setSelectedPlan] = useState('quarterly');
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 現在のプラン情報を取得
  useEffect(() => {
    const fetchCurrentPlan = async () => {
      if (!liffUser?.userId) {
        setIsLoading(false);
        return;
      }

      try {
        console.log('🔍 プラン情報取得中...', liffUser.userId);
        const response = await fetch(`/api/plan/current?userId=${liffUser.userId}`);
        
        if (response.ok) {
          const data = await response.json();
          console.log('📊 プラン情報取得結果:', data);
          
          if (data.success) {
            setCurrentPlan({
              plan: data.plan,
              planName: data.planName,
              status: data.status,
              currentPeriodEnd: data.currentPeriodEnd ? new Date(data.currentPeriodEnd) : undefined,
              stripeSubscriptionId: data.stripeSubscriptionId
            });
          } else {
            setError('プラン情報の取得に失敗しました');
          }
        } else {
          setError(`APIエラー: ${response.status}`);
        }
      } catch (err) {
        console.error('プラン取得エラー:', err);
        setError('ネットワークエラーが発生しました');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCurrentPlan();
  }, [liffUser?.userId]);

  // プラン購入処理
  const handlePurchase = async (planId: string) => {
    setIsProcessing(true);
    setError(null);
    
    try {
      if (!liffUser?.userId) {
        setError('ユーザー情報が取得できません');
        return;
      }

      console.log('💳 決済処理開始:', planId);
      
      const session = await createPaymentSession(
        planId,
        liffUser.userId,
        `${window.location.origin}/payment/success`,
        `${window.location.origin}/payment/cancel`
      );

      if (session.url) {
        window.location.href = session.url;
      } else {
        alert(`${plans.find(p => p.id === planId)?.name}の決済を開始します`);
      }
    } catch (err) {
      console.error('決済エラー:', err);
      setError('決済処理でエラーが発生しました');
    } finally {
      setIsProcessing(false);
    }
  };

  // Stripe Billing Portal処理
  const handleBillingPortal = async () => {
    setIsProcessing(true);
    setError(null);
    
    try {
      if (!liffUser?.userId) {
        setError('ユーザー情報が取得できません');
        return;
      }

      console.log('🔄 Billing Portal開始');
      const response = await fetch('/api/stripe/billing-portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: liffUser.userId }),
      });

      const data = await response.json();
      
      if (data.success && data.url) {
        // Stripe Billing Portalにリダイレクト
        window.location.href = data.url;
      } else {
        setError(data.error || 'プラン管理画面の作成に失敗しました');
      }
    } catch (err) {
      console.error('Billing Portalエラー:', err);
      setError('プラン管理画面の作成でエラーが発生しました');
    } finally {
      setIsProcessing(false);
    }
  };

  // プラン解約処理（Legacy - Billing Portalで代替）
  const handleCancel = async () => {
    if (!confirm('本当にプランを解約しますか？')) {
      return;
    }

    setIsProcessing(true);
    setError(null);
    
    try {
      if (!liffUser?.userId) {
        setError('ユーザー情報が取得できません');
        return;
      }

      console.log('🔄 解約処理開始');
      const response = await fetch('/api/plan/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: liffUser.userId }),
      });

      const data = await response.json();
      
      if (data.success) {
        alert('プランを解約しました');
        // プラン情報を再取得
        window.location.reload();
      } else {
        setError(data.error || '解約処理に失敗しました');
      }
    } catch (err) {
      console.error('解約エラー:', err);
      setError('解約処理でエラーが発生しました');
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
      stripePriceId: 'price_1SMXAsKMirzoVNsdglrHigMa',
      isRecommended: true,
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

  const renderPlanCard = (plan: any) => {
    const isCurrentPlan = currentPlan.plan === plan.id;
    const isSelected = selectedPlan === plan.id;
    
    return (
      <Card 
        key={plan.id} 
        className={`relative p-4 transition-all duration-300 border-2 bg-white/80 backdrop-blur-sm cursor-pointer transform hover:scale-102 ${
          isSelected 
            ? 'border-blue-500 shadow-lg scale-102 ring-1 ring-blue-200' 
            : isCurrentPlan && currentPlan.status === 'active'
            ? 'border-green-500 shadow-lg scale-102'
            : 'border-gray-300 shadow-sm hover:shadow-lg hover:border-blue-300'
        }`}
        onClick={() => setSelectedPlan(plan.id)}
      >
        
        {isSelected && (
          <div className="absolute top-2 left-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center shadow-sm">
            <Check size={12} className="text-white" />
          </div>
        )}
        
        <div className="space-y-3">
          {/* 人気バッジ */}
          {plan.isRecommended && (
            <div className="text-center">
              <div className="inline-flex items-center bg-blue-600 text-white px-2 py-0.5 rounded-full text-xs font-medium">
                <Star size={10} className="mr-1" />
                人気
              </div>
            </div>
          )}
          
          {/* 現在のプランバッジ */}
          {isCurrentPlan && (currentPlan.status === 'active' || currentPlan.status === 'cancel_at_period_end') && (
            <div className="text-center">
              <Badge variant="outline" className={
                currentPlan.status === 'active' 
                  ? "bg-green-100 text-green-700 border-green-300"
                  : "bg-orange-100 text-orange-700 border-orange-300"
              }>
                {currentPlan.status === 'active' ? '現在のプラン' : '解約予定'}
              </Badge>
            </div>
          )}
          
          {/* メインコンテンツ */}
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
              {plan.features.map((feature: string, index: number) => (
                <div key={index} className="flex items-start space-x-1">
                  <Check size={12} className="text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-xs text-gray-700">{feature}</span>
                </div>
              ))}
              {plan.limitations?.map((limitation: string, index: number) => (
                <div key={`limit-${index}`} className="flex items-start space-x-1 opacity-60">
                  <X size={12} className="text-gray-400 flex-shrink-0 mt-0.5" />
                  <span className="text-xs text-gray-500">{limitation}</span>
                </div>
              ))}
            </div>
          </div>

          {/* アクションボタン */}
          <div className="pt-2">
            {plan.id === 'free' ? (
              <Button variant="outline" className="w-full h-8 text-xs" disabled>
                無料プラン
              </Button>
            ) : isCurrentPlan && (currentPlan.status === 'active' || currentPlan.status === 'cancel_at_period_end') ? (
              <div className="space-y-2">
                <Button variant="outline" className="w-full h-8 text-xs" disabled>
                  現在のプラン
                </Button>
                {currentPlan.status === 'active' && (
                  <Button 
                    variant="outline" 
                    className="w-full h-8 text-xs text-blue-600 border-blue-600"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleBillingPortal();
                    }}
                    disabled={isProcessing}
                  >
                    {isProcessing ? '処理中...' : '🔧 プラン管理'}
                  </Button>
                )}
                {currentPlan.status === 'cancel_at_period_end' && (
                  <Button 
                    variant="outline" 
                    className="w-full h-8 text-xs"
                    disabled
                  >
                    解約予定（{currentPlan.currentPeriodEnd?.toLocaleDateString('ja-JP')}まで利用可能）
                  </Button>
                )}
              </div>
            ) : (
              <Button 
                className={`w-full h-8 text-xs transition-all duration-200 ${
                  isSelected
                    ? 'bg-blue-600 hover:bg-blue-700 ring-1 ring-blue-300' 
                    : 'bg-blue-500 hover:bg-blue-600'
                } text-white disabled:opacity-50 shadow-sm hover:shadow-md`}
                onClick={(e) => {
                  e.stopPropagation();
                  handlePurchase(plan.id);
                }}
                disabled={isProcessing}
              >
                {isProcessing ? '処理中...' : (currentPlan.status === 'active' ? 'プラン変更' : '購入する')}
              </Button>
            )}
          </div>
        </div>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600">プラン情報を読み込み中...</p>
        </div>
      </div>
    );
  }

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
          <h1 className="text-lg font-semibold text-gray-800">プラン管理</h1>
          <div className="w-16"></div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 pb-20">
        {/* エラー表示 */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
            <AlertCircle size={16} className="text-red-500" />
            <span className="text-red-700 text-sm">{error}</span>
          </div>
        )}

        {/* 現在のプラン状況 */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">現在のプラン状況</h3>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className={
                currentPlan.status === 'active' || currentPlan.status === 'cancel_at_period_end' 
                  ? 'bg-green-100 text-green-700 border-green-300' 
                  : 'bg-gray-100 text-gray-700'
              }>
                {currentPlan.planName}
              </Badge>
              <span className="text-sm text-blue-700">
                {currentPlan.status === 'active' && '有効'}
                {currentPlan.status === 'cancel_at_period_end' && '解約予定'}
                {(currentPlan.status === 'inactive' || currentPlan.status === 'cancelled') && '無効'}
              </span>
            </div>
            
            {/* 有効期限表示 */}
            {currentPlan.currentPeriodEnd && (currentPlan.status === 'active' || currentPlan.status === 'cancel_at_period_end') && (
              <div className="text-sm text-blue-600">
                {currentPlan.status === 'active' && (
                  <>📅 次回更新日: {currentPlan.currentPeriodEnd.toLocaleDateString('ja-JP')}</>
                )}
                {currentPlan.status === 'cancel_at_period_end' && (
                  <>⏰ 利用終了日: {currentPlan.currentPeriodEnd.toLocaleDateString('ja-JP')}</>
                )}
              </div>
            )}
            
            {/* Billing Portalボタン（有料プランの場合のみ） */}
            {(currentPlan.status === 'active' || currentPlan.status === 'cancel_at_period_end') && currentPlan.plan !== 'free' && (
              <div className="mt-3">
                <Button 
                  onClick={handleBillingPortal}
                  disabled={isProcessing}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm"
                >
                  {isProcessing ? '処理中...' : '🔧 プラン管理・変更・解約'}
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* 説明セクション */}
        <div className="text-center mb-6 mt-4">
          <h2 className="text-xl font-bold text-gray-900 mb-2">プランの種類</h2>
        </div>

        {/* プラン一覧 */}
        <div className="space-y-4 max-w-lg mx-auto">
          {plans.map(plan => renderPlanCard(plan))}
        </div>

        <div className="h-4"></div>

        {/* 注意事項 */}
        <Card className="p-6 bg-white/80 backdrop-blur-sm shadow-sm">
          <h4 className="font-semibold text-gray-800 mb-3">プラン管理について</h4>
          <div className="space-y-2 text-sm text-gray-600">
            <p>• <strong>🔧 プラン管理</strong>ボタンで、プラン変更・解約・請求書確認が可能です</p>
            <p>• プラン変更は即時反映されます（月額↔3ヶ月プラン）</p>
            <p>• 解約は期間終了まで利用可能（即座解約ではありません）</p>
            <p>• 請求履歴・次回請求日もStripe管理画面で確認できます</p>
            <p>• 全ての変更はセキュアなStripe公式システムで処理されます</p>
          </div>
        </Card>
      </div>
    </div>
  );
}