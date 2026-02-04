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
  plan: 'free' | 'monthly' | 'quarterly' | 'biannual' | 'crowdfund_1m' | 'crowdfund_3m' | 'crowdfund_6m' | 'crowdfund_lifetime' | 'lifetime';
  planName: string;
  status: 'active' | 'inactive' | 'cancelled' | 'cancel_at_period_end' | 'lifetime';
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
  const [couponCode, setCouponCode] = useState('');
  const [isCouponProcessing, setIsCouponProcessing] = useState(false);
  const [couponSuccess, setCouponSuccess] = useState<string | null>(null);

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

  // クーポンコード適用処理
  const handleCouponSubmit = async () => {
    if (!couponCode.trim()) {
      setError('クーポンコードを入力してください');
      return;
    }

    setIsCouponProcessing(true);
    setError(null);
    setCouponSuccess(null);
    
    try {
      if (!liffUser?.userId) {
        setError('ユーザー情報が取得できません');
        return;
      }

      console.log('🎟️ クーポンコード適用開始:', couponCode);
      
      const response = await fetch('/api/coupon/redeem', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: liffUser.userId,
          couponCode: couponCode.trim(),
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setCouponSuccess(`✅ クーポンを適用しました！${data.planName}が有効になりました。`);
        setCouponCode('');
        // プラン情報を再取得
        window.location.reload();
      } else {
        setError(data.error || 'クーポンの適用に失敗しました');
      }
    } catch (err) {
      console.error('クーポン適用エラー:', err);
      setError('クーポンの適用でエラーが発生しました');
    } finally {
      setIsCouponProcessing(false);
    }
  };

  // プラン解約処理
  const handleCancel = async () => {
    const periodEndText = currentPlan.currentPeriodEnd 
      ? `期限: ${currentPlan.currentPeriodEnd.toLocaleDateString('ja-JP')}まで`
      : '期限終了まで';
    
    const confirmMessage = currentPlan.status === 'trial' 
      ? `お試し期間を終了しますか？\n\n終了後は即座に無料プランに切り替わります。`
      : `プランを解約しますか？\n\n解約後も${periodEndText}全機能をご利用いただけます。\n期間終了後は自動的に無料プランに切り替わります。`;
    
    if (!confirm(confirmMessage)) {
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
        const successMessage = data.currentPeriodEnd 
          ? `プランを解約しました\n\n${new Date(data.currentPeriodEnd).toLocaleDateString('ja-JP')}まで全機能をご利用いただけます。`
          : data.message || 'プランを解約しました';
        
        alert(successMessage);
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
        'AI会話：1日3通まで',
        'LINE記録：1日1通まで',
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
      price: 790,
      period: '月額',
      stripePriceId: 'price_1SxAFZHAuO7vhfyIhLShYjMX',
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
      price: 3000,
      period: '6ヶ月',
      originalPrice: 4740,
      discount: '37%OFF',
      monthlyPrice: 500,
      stripePriceId: 'price_1SWx4vKToWVElLyI2TyVD57H',
      isRecommended: true,
      features: [
        'すべての機能が無制限',
        'AI会話・記録が使い放題',
        '1日のフィードバック機能',
        'アプリからAI記録機能',
        '月額より37%お得！'
      ]
    }
  ];

  const renderPlanCard = (plan: any) => {
    const isCurrentPlan = currentPlan.plan === plan.id;
    const isSelected = selectedPlan === plan.id;
    
    return (
      <Card 
        key={plan.id} 
        className={`relative p-6 transition-all duration-300 border-2 bg-gradient-to-br from-white to-gray-50/50 backdrop-blur-sm cursor-pointer transform hover:scale-102 rounded-xl ${
          isSelected 
            ? 'border-blue-500 shadow-xl scale-102 ring-2 ring-blue-200/50' 
            : isCurrentPlan && currentPlan.status === 'active'
            ? 'border-emerald-500 shadow-xl scale-102 ring-2 ring-emerald-200/50 bg-gradient-to-br from-emerald-50 to-white'
            : 'border-gray-200 shadow-md hover:shadow-xl hover:border-blue-300 hover:ring-1 hover:ring-blue-100'
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
          {isCurrentPlan && (currentPlan.status === 'active' || currentPlan.status === 'cancel_at_period_end' || currentPlan.status === 'trial') && (
            <div className="text-center">
              <Badge variant="outline" className={
                currentPlan.status === 'active' || currentPlan.status === 'trial'
                  ? "bg-emerald-100 text-emerald-700 border-emerald-300 font-medium"
                  : "bg-orange-100 text-orange-700 border-orange-300 font-medium"
              }>
                {(currentPlan.status === 'active' || currentPlan.status === 'trial') || currentPlan.plan === 'free' ? '現在のプラン' : '解約予定'}
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
            ) : isCurrentPlan && (currentPlan.status === 'active' || currentPlan.status === 'cancel_at_period_end' || currentPlan.status === 'trial') ? (
              <Button variant="outline" className="w-full h-8 text-xs" disabled>
                現在のプラン
              </Button>
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
                currentPlan.status === 'active' || currentPlan.status === 'cancel_at_period_end' || currentPlan.status === 'lifetime' || currentPlan.status === 'trial' || (currentPlan.status === 'cancelled' && currentPlan.currentPeriodEnd && new Date() < currentPlan.currentPeriodEnd)
                  ? 'bg-green-100 text-green-700 border-green-300' 
                  : 'bg-gray-100 text-gray-700'
              }>
                {currentPlan.planName}
              </Badge>
              {currentPlan.plan !== 'free' && (
                <span className="text-sm text-blue-700">
                  {currentPlan.status === 'active' && '有効'}
                  {currentPlan.status === 'trial' && 'お試し期間中'}
                  {currentPlan.status === 'lifetime' && '永続'}
                  {currentPlan.status === 'cancel_at_period_end' && '解約予定'}
                  {currentPlan.status === 'cancelled' && currentPlan.currentPeriodEnd && new Date() < currentPlan.currentPeriodEnd && '解約済み（期限内）'}
                  {currentPlan.status === 'cancelled' && (!currentPlan.currentPeriodEnd || new Date() >= currentPlan.currentPeriodEnd) && '無効'}
                  {currentPlan.status === 'inactive' && '無効'}
                </span>
              )}
            </div>
            
            {/* 有効期限表示 */}
            {currentPlan.plan !== 'free' && (
              <div className="text-sm text-blue-600">
                {currentPlan.status === 'lifetime' && (
                  <>♾️ 永続利用プラン（期限なし）</>
                )}
                {currentPlan.currentPeriodEnd && currentPlan.status === 'active' && !currentPlan.plan.startsWith('crowdfund') && (
                  <>📅 次回更新日: {currentPlan.currentPeriodEnd.toLocaleDateString('ja-JP')}</>
                )}
                {currentPlan.currentPeriodEnd && currentPlan.status === 'cancel_at_period_end' && (
                  <>⏰ 利用終了日: {currentPlan.currentPeriodEnd.toLocaleDateString('ja-JP')}</>
                )}
                {currentPlan.currentPeriodEnd && currentPlan.status === 'cancelled' && new Date() < currentPlan.currentPeriodEnd && (
                  <>⏰ 利用終了日: {currentPlan.currentPeriodEnd.toLocaleDateString('ja-JP')}</>
                )}
                {currentPlan.currentPeriodEnd && currentPlan.plan.startsWith('crowdfund') && currentPlan.status === 'active' && (
                  <>📅 有効期限: {currentPlan.currentPeriodEnd.toLocaleDateString('ja-JP')}</>
                )}
              </div>
            )}
            
            {/* 解約ボタン（有料プランかつアクティブまたはトライアルの場合、永続プランは除外） */}
            {(currentPlan.status === 'active' || currentPlan.status === 'trial') && currentPlan.plan !== 'free' && currentPlan.status !== 'lifetime' && !currentPlan.plan.startsWith('crowdfund') && (
              <div className="mt-3">
                <Button 
                  onClick={handleCancel}
                  disabled={isProcessing}
                  className="w-full bg-red-600 hover:bg-red-700 text-white text-sm"
                >
                  {isProcessing ? '処理中...' : '❌ プランを解約する'}
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* クーポンコード入力セクション */}
        <Card className="p-4 bg-gray-50 border border-gray-200 shadow-sm mb-6">
          <h3 className="font-semibold text-gray-800 mb-3">クーポンコード</h3>
          
          <div className="space-y-3">
            <div className="flex space-x-2">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                placeholder="CF600-1M-001"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isCouponProcessing}
              />
              <Button 
                onClick={handleCouponSubmit}
                disabled={isCouponProcessing || !couponCode.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6"
              >
                {isCouponProcessing ? '適用中...' : '適用'}
              </Button>
            </div>
            
            {couponSuccess && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-2">
                <Check size={16} className="text-green-500" />
                <span className="text-green-700 text-sm">{couponSuccess}</span>
              </div>
            )}
          </div>
        </Card>

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
            <p>• <strong>❌ プランを解約する</strong>ボタンで、いつでも簡単に解約できます</p>
            <p>• 解約後も期間終了まで全機能をご利用いただけます</p>
            <p>• 期間終了後は自動的に無料プランに切り替わります</p>
            <p>• 解約処理はStripe公式システムで安全に処理されます</p>
            <p>• 支払い方法変更などのご相談はお問い合わせください</p>
          </div>
        </Card>
      </div>
    </div>
  );
}