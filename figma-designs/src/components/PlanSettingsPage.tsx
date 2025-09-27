import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  ArrowLeft, 
  Crown, 
  Check, 
  Star,
  Zap,
  Users,
  Trophy
} from 'lucide-react';

interface PlanSettingsPageProps {
  onBack: () => void;
}

export function PlanSettingsPage({ onBack }: PlanSettingsPageProps) {
  const plans = [
    {
      id: 'basic',
      name: 'ベーシック',
      price: 0,
      period: '無料',
      isCurrentPlan: true,
      features: [
        '基本的な記録機能',
        '体重・食事・運動記録',
        '週間レポート',
        '基本的な分析'
      ],
      limitations: [
        '月間記録数に制限あり',
        'AIアドバイス機能なし'
      ]
    },
    {
      id: 'premium',
      name: 'プレミアム',
      price: 980,
      period: '月額',
      isCurrentPlan: false,
      isRecommended: true,
      features: [
        'すべての記録機能',
        '無制限の記録数',
        'AIパーソナルアドバイス',
        '詳細な栄養分析',
        '運動プラン提案',
        '月次詳細レポート',
        '目標設定サポート'
      ]
    },
    {
      id: 'family',
      name: 'ファミリー',
      price: 1480,
      period: '月額',
      isCurrentPlan: false,
      features: [
        'プレミアム機能すべて',
        '最大6人まで利用可能',
        'ファミリー健康レポート',
        '家族間での励まし機能',
        '専用サポート'
      ]
    }
  ];

  const renderPlanCard = (plan: any) => (
    <Card key={plan.id} className={`backdrop-blur-xl shadow-lg border rounded-xl p-4 relative ${
      plan.isCurrentPlan 
        ? 'bg-health-primary/10 border-health-primary/50' 
        : 'bg-white/80 border-white/30'
    }`}>
      {plan.isRecommended && (
        <Badge className="absolute -top-2 left-4 bg-health-primary text-white">
          <Star size={12} className="mr-1" />
          おすすめ
        </Badge>
      )}
      
      <div className="space-y-4">
        {/* プランヘッダー */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {plan.id === 'basic' && (
              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                <Users size={16} className="text-slate-600" />
              </div>
            )}
            {plan.id === 'premium' && (
              <div className="w-8 h-8 rounded-lg bg-health-primary/20 flex items-center justify-center">
                <Crown size={16} className="text-health-primary" />
              </div>
            )}
            {plan.id === 'family' && (
              <div className="w-8 h-8 rounded-lg bg-warning/20 flex items-center justify-center">
                <Trophy size={16} className="text-warning" />
              </div>
            )}
            <div>
              <h3 className="font-semibold text-slate-800">{plan.name}</h3>
              <div className="flex items-baseline space-x-1">
                {plan.price === 0 ? (
                  <span className="text-lg font-bold text-slate-800">{plan.period}</span>
                ) : (
                  <>
                    <span className="text-lg font-bold text-slate-800">¥{plan.price.toLocaleString()}</span>
                    <span className="text-sm text-slate-500">/{plan.period}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          {plan.isCurrentPlan && (
            <Badge variant="secondary" className="bg-health-primary/20 text-health-primary">
              現在のプラン
            </Badge>
          )}
        </div>

        {/* 機能一覧 */}
        <div className="space-y-2">
          {plan.features.map((feature, index) => (
            <div key={index} className="flex items-center space-x-2">
              <Check size={14} className="text-success flex-shrink-0" />
              <span className="text-sm text-slate-700">{feature}</span>
            </div>
          ))}
          {plan.limitations?.map((limitation, index) => (
            <div key={`limit-${index}`} className="flex items-center space-x-2 opacity-60">
              <div className="w-3.5 h-3.5 rounded-full border border-slate-400 flex-shrink-0" />
              <span className="text-sm text-slate-500">{limitation}</span>
            </div>
          ))}
        </div>

        {/* アクションボタン */}
        <div className="pt-2">
          {plan.isCurrentPlan ? (
            <Button variant="outline" className="w-full" disabled>
              現在利用中
            </Button>
          ) : (
            <Button 
              className="w-full bg-health-primary hover:bg-health-primary-dark text-white"
              onClick={() => console.log(`プラン変更: ${plan.name}`)}
            >
              このプランに変更
            </Button>
          )}
        </div>
      </div>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50 max-w-sm mx-auto relative">
      {/* 背景装飾 */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-100/30 via-transparent to-indigo-50/20 pointer-events-none" style={{background: 'linear-gradient(135deg, rgba(70, 130, 180, 0.1) 0%, transparent 50%, rgba(70, 130, 180, 0.05) 100%)'}}></div>
      
      {/* ヘッダー */}
      <div className="relative px-4 pt-4 pb-2">
        <div className="flex items-center space-x-3 mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="p-2 hover:bg-white/60"
          >
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-xl font-semibold text-slate-800">プラン設定</h1>
            <p className="text-sm text-slate-600">プランの変更・アップグレード</p>
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="relative px-4 py-2 pb-20 space-y-4">
        {/* 現在の利用状況 */}
        <Card className="backdrop-blur-xl bg-white/80 shadow-lg border border-white/30 rounded-xl p-4">
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Zap size={16} className="text-health-primary" />
              <h3 className="font-semibold text-slate-800">利用状況</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-3 bg-white/70 rounded-lg border border-white/60">
                <div className="text-xs text-slate-500 mb-1">今月の記録数</div>
                <div className="text-lg font-bold text-slate-800">127/150</div>
              </div>
              <div className="text-center p-3 bg-white/70 rounded-lg border border-white/60">
                <div className="text-xs text-slate-500 mb-1">利用開始日</div>
                <div className="text-sm font-semibold text-slate-800">2024/01/15</div>
              </div>
            </div>
          </div>
        </Card>

        {/* プラン一覧 */}
        {plans.map(plan => renderPlanCard(plan))}

        {/* 注意事項 */}
        <Card className="backdrop-blur-xl bg-slate-50/80 shadow-lg border border-slate-200/50 rounded-xl p-4">
          <div className="space-y-2">
            <h4 className="font-semibold text-slate-800">ご注意</h4>
            <div className="space-y-1 text-sm text-slate-600">
              <p>• プラン変更は即時反映されます</p>
              <p>• 月の途中での変更の場合、日割り計算となります</p>
              <p>• ダウングレード時は次回請求日から適用されます</p>
              <p>• 無料プランへの変更はいつでも可能です</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}