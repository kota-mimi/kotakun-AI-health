import { Card } from './ui/card';
import { Button } from './ui/button';
import { 
  ArrowLeft,
  Trash2,
  Database,
  Settings,
  AlertTriangle,
  FileText,
  Shield
} from 'lucide-react';

interface SettingsPageProps {
  onBack: () => void;
  onNavigateToNutritionSettings?: () => void;
}

export function SettingsPage({ onBack, onNavigateToNutritionSettings }: SettingsPageProps) {

  const dataActionButtons = [
    {
      icon: Settings,
      label: "栄養素設定",
      description: "表示する栄養素を選択・カスタマイズ",
      color: "#4682B4",
      action: () => onNavigateToNutritionSettings?.()
    },
    {
      icon: Trash2,
      label: "データ削除",
      description: "すべての記録を完全削除",
      color: "#EF4444",
    }
  ];

  const accountActionButtons = [
    {
      icon: AlertTriangle,
      label: "アカウント削除",
      description: "アカウントとすべてのデータを完全削除",
      color: "#EF4444",
      action: () => {
        if (window.confirm("本当にアカウントを削除しますか？この操作は取り消せません。")) {
        }
      }
    }
  ];

  return (
    <div className="space-y-4">
      {/* ヘッダー */}
      <Card className="backdrop-blur-xl bg-white/90 shadow-lg border border-white/40 rounded-xl p-4">
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="p-2 rounded-xl hover:bg-white/60"
          >
            <ArrowLeft size={20} style={{color: '#4682B4'}} />
          </Button>
          <div>
            <h1 className="text-xl font-semibold text-slate-800">設定</h1>
            <p className="text-sm text-slate-600">アプリの動作をカスタマイズ</p>
          </div>
        </div>
      </Card>

      {/* データ管理 */}
      <Card className="backdrop-blur-xl bg-white/80 shadow-lg border border-white/30 rounded-xl p-4">
        <div className="flex items-center space-x-3 mb-4">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{backgroundColor: 'rgba(107, 114, 128, 0.1)'}}
          >
            <Database size={20} style={{color: '#6B7280'}} />
          </div>
          <h2 className="text-lg font-semibold text-slate-800">データ管理</h2>
        </div>
        
        <div className="space-y-3">
          {dataActionButtons.map((button, index) => {
            const Icon = button.icon;
            return (
              <Button
                key={index}
                variant="ghost"
                className="w-full justify-start p-4 h-auto hover:bg-white/60 rounded-xl transition-all"
                onClick={button.action}
              >
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{backgroundColor: `${button.color}15`}}
                  >
                    <Icon size={18} style={{color: button.color}} />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-slate-800">{button.label}</p>
                    <p className="text-xs text-slate-500">{button.description}</p>
                  </div>
                </div>
              </Button>
            );
          })}
        </div>
      </Card>

      {/* アカウント管理 */}
      <Card className="backdrop-blur-xl bg-gradient-to-r from-red-50/80 to-orange-50/80 shadow-lg border border-red-200/50 rounded-xl p-4">
        <div className="flex items-center space-x-3 mb-4">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{backgroundColor: 'rgba(239, 68, 68, 0.1)'}}
          >
            <AlertTriangle size={20} style={{color: '#EF4444'}} />
          </div>
          <h2 className="text-lg font-semibold text-slate-800">アカウント管理</h2>
        </div>
        
        <div className="space-y-3">
          {accountActionButtons.map((button, index) => {
            const Icon = button.icon;
            return (
              <Button
                key={index}
                variant="ghost"
                className="w-full justify-start p-4 h-auto hover:bg-red-50 rounded-xl transition-all"
                onClick={button.action}
              >
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{backgroundColor: `${button.color}15`}}
                  >
                    <Icon size={18} style={{color: button.color}} />
                  </div>
                  <div className="text-left">
                    <p className="font-medium" style={{color: button.color}}>{button.label}</p>
                    <p className="text-xs text-slate-500">{button.description}</p>
                  </div>
                </div>
              </Button>
            );
          })}
        </div>
      </Card>

      {/* 法的情報 */}
      <Card className="backdrop-blur-xl bg-white/80 shadow-lg border border-white/30 rounded-xl p-4">
        <div className="flex items-center space-x-3 mb-4">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{backgroundColor: 'rgba(55, 65, 81, 0.1)'}}
          >
            <FileText size={20} style={{color: '#374151'}} />
          </div>
          <h2 className="text-lg font-semibold text-slate-800">法的情報</h2>
        </div>
        
        <div className="space-y-3">
          <Button
            variant="ghost"
            className="w-full justify-start p-4 h-auto hover:bg-white/60 rounded-xl transition-all"
            onClick={() => window.open('/terms', '_blank')}
          >
            <div className="flex items-center space-x-3">
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{backgroundColor: '#37415115'}}
              >
                <FileText size={18} style={{color: '#374151'}} />
              </div>
              <div className="text-left">
                <p className="font-medium text-slate-800">利用規約</p>
                <p className="text-xs text-slate-500">サービス利用条件</p>
              </div>
            </div>
          </Button>
          
          <Button
            variant="ghost"
            className="w-full justify-start p-4 h-auto hover:bg-white/60 rounded-xl transition-all"
            onClick={() => window.open('/privacy', '_blank')}
          >
            <div className="flex items-center space-x-3">
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{backgroundColor: '#37415115'}}
              >
                <Shield size={18} style={{color: '#374151'}} />
              </div>
              <div className="text-left">
                <p className="font-medium text-slate-800">プライバシーポリシー</p>
                <p className="text-xs text-slate-500">個人情報保護方針</p>
              </div>
            </div>
          </Button>
        </div>
      </Card>

      {/* 注意事項 */}
      <Card className="backdrop-blur-xl bg-white/60 shadow-lg border border-white/30 rounded-xl p-4">
        <div className="text-center space-y-2">
          <p className="text-xs text-slate-500">
            設定はアプリを再起動するまで保存されます
          </p>
          <p className="text-xs text-slate-400">
            アカウント削除は取り消すことができません
          </p>
        </div>
      </Card>

    </div>
  );
}