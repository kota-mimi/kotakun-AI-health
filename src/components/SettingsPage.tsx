import { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { Separator } from './ui/separator';
import { 
  ArrowLeft,
  Trash2,
  Database,
  Settings,
  Bell,
  AlertTriangle,
  Clock,
  Volume2
} from 'lucide-react';

interface SettingsPageProps {
  onBack: () => void;
  onNavigateToNutritionSettings?: () => void;
}

export function SettingsPage({ onBack, onNavigateToNutritionSettings }: SettingsPageProps) {
  // 通知設定の状態管理
  const [notificationSettings, setNotificationSettings] = useState({
    mealReminder: true,
    weightReminder: true,
    workoutReminder: false,
    soundEnabled: true,
    vibrationEnabled: true,
    dailyReport: true,
    weeklyReport: false,
    goalAchievement: true
  });

  const updateNotificationSetting = (key: string, value: boolean) => {
    setNotificationSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // 通知設定セクション
  const notificationSections = [
    {
      title: "基本リマインダー",
      icon: Clock,
      color: "#4682B4",
      items: [
        { 
          key: 'mealReminder', 
          label: '食事リマインダー', 
          description: '食事時間になったら通知',
          value: notificationSettings.mealReminder 
        },
        { 
          key: 'weightReminder', 
          label: '体重測定リマインダー', 
          description: '毎日決まった時間に通知',
          value: notificationSettings.weightReminder 
        },
        { 
          key: 'workoutReminder', 
          label: '運動リマインダー', 
          description: 'トレーニング予定時間に通知',
          value: notificationSettings.workoutReminder 
        }
      ]
    },
    {
      title: "通知方法",
      icon: Volume2,
      color: "#F59E0B",
      items: [
        { 
          key: 'soundEnabled', 
          label: '通知音', 
          description: '通知時に音を再生',
          value: notificationSettings.soundEnabled 
        },
        { 
          key: 'vibrationEnabled', 
          label: 'バイブレーション', 
          description: '通知時に振動',
          value: notificationSettings.vibrationEnabled 
        }
      ]
    },
    {
      title: "レポート",
      icon: Bell,
      color: "#10B981",
      items: [
        { 
          key: 'dailyReport', 
          label: '日次レポート', 
          description: '1日の記録サマリーを通知',
          value: notificationSettings.dailyReport 
        },
        { 
          key: 'weeklyReport', 
          label: '週次レポート', 
          description: '週の進捗レポートを通知',
          value: notificationSettings.weeklyReport 
        },
        { 
          key: 'goalAchievement', 
          label: '目標達成通知', 
          description: '目標を達成した時に通知',
          value: notificationSettings.goalAchievement 
        }
      ]
    }
  ];

  const settingSections = [];

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
      action: () => console.log("データ削除")
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
          console.log("アカウント削除");
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

      {/* 通知設定セクション */}
      {notificationSections.map((section, sectionIndex) => {
        const Icon = section.icon;
        return (
          <Card key={sectionIndex} className="backdrop-blur-xl bg-white/80 shadow-lg border border-white/30 rounded-xl p-4">
            <div className="flex items-center space-x-3 mb-4">
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{backgroundColor: `${section.color}15`}}
              >
                <Icon size={20} style={{color: section.color}} />
              </div>
              <h2 className="text-lg font-semibold text-slate-800">{section.title}</h2>
            </div>
            
            <div className="space-y-4">
              {section.items.map((item, itemIndex) => (
                <div key={itemIndex}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-slate-800 mb-1">{item.label}</p>
                      <p className="text-xs text-slate-500">{item.description}</p>
                    </div>
                    <Switch
                      checked={item.value}
                      onCheckedChange={(checked) => 
                        updateNotificationSetting(item.key, checked)
                      }
                      className="ml-4"
                    />
                  </div>
                  {itemIndex < section.items.length - 1 && <Separator className="mt-4" />}
                </div>
              ))}
            </div>
          </Card>
        );
      })}

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