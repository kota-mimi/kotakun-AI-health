import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  ArrowLeft, 
  CreditCard, 
  Calendar,
  Receipt,
  Plus,
  MoreHorizontal,
  Shield,
  CheckCircle
} from 'lucide-react';

interface PaymentSettingsPageProps {
  onBack: () => void;
}

export function PaymentSettingsPage({ onBack }: PaymentSettingsPageProps) {
  const paymentMethods = [
    {
      id: '1',
      type: 'visa',
      lastFour: '4532',
      expiryDate: '12/25',
      isDefault: true,
      cardholderName: '田中 太郎'
    },
    {
      id: '2',
      type: 'mastercard',
      lastFour: '8765',
      expiryDate: '03/26',
      isDefault: false,
      cardholderName: '田中 太郎'
    }
  ];

  const billingHistory = [
    {
      id: '1',
      date: '2024/01/15',
      plan: 'プレミアム',
      amount: 980,
      status: 'paid',
      receiptUrl: '#'
    },
    {
      id: '2',
      date: '2023/12/15',
      plan: 'プレミアム',
      amount: 980,
      status: 'paid',
      receiptUrl: '#'
    },
    {
      id: '3',
      date: '2023/11/15',
      plan: 'プレミアム',
      amount: 980,
      status: 'paid',
      receiptUrl: '#'
    }
  ];

  const getCardIcon = (type: string) => {
    const baseClasses = "w-8 h-5 rounded flex items-center justify-center text-white text-xs font-bold";
    switch (type) {
      case 'visa':
        return <div className={`${baseClasses} bg-blue-600`}>VISA</div>;
      case 'mastercard':
        return <div className={`${baseClasses} bg-red-500`}>MC</div>;
      default:
        return <CreditCard size={16} className="text-slate-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-success/20 text-success">支払い済み</Badge>;
      case 'pending':
        return <Badge className="bg-warning/20 text-warning">保留中</Badge>;
      case 'failed':
        return <Badge className="bg-destructive/20 text-destructive">失敗</Badge>;
      default:
        return null;
    }
  };

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
            <h1 className="text-xl font-semibold text-slate-800">支払い設定</h1>
            <p className="text-sm text-slate-600">支払い方法・請求履歴</p>
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="relative px-4 py-2 pb-20 space-y-4">
        {/* 現在のプラン情報 */}
        <Card className="backdrop-blur-xl bg-health-primary/10 shadow-lg border border-health-primary/30 rounded-xl p-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-health-primary/20 flex items-center justify-center">
                  <Shield size={16} className="text-health-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800">現在のプラン</h3>
                  <p className="text-sm text-slate-600">次回請求日: 2024/02/15</p>
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-slate-800">プレミアム</div>
                <div className="text-sm text-slate-600">¥980/月</div>
              </div>
            </div>
          </div>
        </Card>

        {/* 支払い方法 */}
        <Card className="backdrop-blur-xl bg-white/80 shadow-lg border border-white/30 rounded-xl overflow-hidden">
          <div className="px-4 pt-2 pb-0 border-b border-white/40 bg-white/40">
            <h3 className="font-semibold text-slate-800">支払い方法</h3>
          </div>
          <div className="divide-y divide-white/30">
            {paymentMethods.map((method) => (
              <div key={method.id} className="flex items-center justify-between pt-2 pb-4 px-4">
                <div className="flex items-center space-x-3">
                  {getCardIcon(method.type)}
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-slate-800">•••• {method.lastFour}</span>
                      {method.isDefault && (
                        <Badge variant="secondary" className="bg-health-primary/20 text-health-primary text-xs">
                          メイン
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-slate-500">
                      {method.cardholderName} • {method.expiryDate}
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="p-1">
                  <MoreHorizontal size={16} className="text-slate-400" />
                </Button>
              </div>
            ))}
            <Button
              variant="ghost"
              className="w-full justify-start pt-2 pb-4 px-4 hover:bg-white/60 rounded-none"
              onClick={() => console.log('カード追加')}
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-5 rounded border-2 border-dashed border-slate-300 flex items-center justify-center">
                  <Plus size={12} className="text-slate-400" />
                </div>
                <span className="text-sm text-slate-600">新しいカードを追加</span>
              </div>
            </Button>
          </div>
        </Card>

        {/* 請求履歴 */}
        <Card className="backdrop-blur-xl bg-white/80 shadow-lg border border-white/30 rounded-xl overflow-hidden">
          <div className="px-4 pt-2 pb-0 border-b border-white/40 bg-white/40">
            <h3 className="font-semibold text-slate-800">請求履歴</h3>
          </div>
          <div className="divide-y divide-white/30">
            {billingHistory.map((bill) => (
              <div key={bill.id} className="flex items-center justify-between pt-2 pb-4 px-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                    <Receipt size={14} className="text-slate-600" />
                  </div>
                  <div>
                    <div className="font-medium text-slate-800">{bill.plan}</div>
                    <div className="text-xs text-slate-500 flex items-center space-x-2">
                      <Calendar size={10} />
                      <span>{bill.date}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <div className="font-semibold text-slate-800">¥{bill.amount.toLocaleString()}</div>
                  {getStatusBadge(bill.status)}
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 border-t border-white/30">
            <Button variant="outline" className="w-full" onClick={() => console.log('履歴をもっと見る')}>
              過去の履歴をもっと見る
            </Button>
          </div>
        </Card>

        {/* セキュリティ情報 */}
        <Card className="backdrop-blur-xl bg-slate-50/80 shadow-lg border border-slate-200/50 rounded-xl p-4">
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <CheckCircle size={16} className="text-success" />
              <h4 className="font-semibold text-slate-800">セキュリティ</h4>
            </div>
            <div className="space-y-2 text-sm text-slate-600">
              <p>• すべての支払い情報は暗号化されて保護されています</p>
              <p>• PCI DSS準拠の決済システムを使用</p>
              <p>• カード情報は当社のサーバーには保存されません</p>
              <p>• 不正利用の監視を24時間実施</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}