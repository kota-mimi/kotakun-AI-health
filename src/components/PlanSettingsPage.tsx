import { Card } from './ui/card';
import { Button } from './ui/button';
import { ArrowLeft, Settings } from 'lucide-react';

interface PlanSettingsPageProps {
  onBack: () => void;
}

export function PlanSettingsPage({ onBack }: PlanSettingsPageProps) {
  return (
    <div className="min-h-screen bg-gray-50 max-w-sm mx-auto relative">
      
      {/* ヘッダー */}
      <div className="relative px-4 pt-4 pb-2">
        <div className="flex items-center space-x-3 mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="p-2 hover:bg-gray-100"
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
      <div className="relative px-4 py-8 pb-20 flex items-center justify-center min-h-[60vh]">
        <Card className="bg-white shadow-sm border border-gray-200 rounded-xl p-8 text-center max-w-xs">
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto bg-slate-100 rounded-full flex items-center justify-center">
              <Settings size={32} className="text-slate-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">準備中</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                プラン機能は現在開発中です。<br />
                しばらくお待ちください。
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}