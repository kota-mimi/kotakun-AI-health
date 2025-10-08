import { Card } from './ui/card';
import { Button } from './ui/button';
import { ArrowLeft, CreditCard } from 'lucide-react';

interface PaymentSettingsPageProps {
  onBack: () => void;
}

export function PaymentSettingsPage({ onBack }: PaymentSettingsPageProps) {
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
      <div className="relative px-4 py-8 pb-20 flex items-center justify-center min-h-[60vh]">
        <Card className="backdrop-blur-xl bg-white/80 shadow-lg border border-white/30 rounded-xl p-8 text-center max-w-xs">
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto bg-slate-100 rounded-full flex items-center justify-center">
              <CreditCard size={32} className="text-slate-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">準備中</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                支払い機能は現在開発中です。<br />
                しばらくお待ちください。
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}