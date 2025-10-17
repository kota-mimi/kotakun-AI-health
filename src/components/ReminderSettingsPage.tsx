import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { ArrowLeft, Bell, Clock, Utensils } from 'lucide-react';

interface ReminderSetting {
  id: string;
  name: string;
  enabled: boolean;
  time: string;
  icon: string;
}

interface ReminderSettingsPageProps {
  onBack: () => void;
}

export function ReminderSettingsPage({ onBack }: ReminderSettingsPageProps) {
  const [reminders, setReminders] = useState<ReminderSetting[]>([
    {
      id: 'breakfast',
      name: '朝食',
      enabled: false,
      time: '07:00',
      icon: '🌅'
    },
    {
      id: 'lunch', 
      name: '昼食',
      enabled: false,
      time: '12:00',
      icon: '☀️'
    },
    {
      id: 'dinner',
      name: '夕食', 
      enabled: false,
      time: '18:00',
      icon: '🌆'
    },
    {
      id: 'snack',
      name: '間食',
      enabled: false, 
      time: '15:00',
      icon: '🍎'
    }
  ]);

  const [isSaving, setIsSaving] = useState(false);

  // 設定を読み込み（後でAPIから取得）
  useEffect(() => {
    // TODO: API から設定を読み込み
    const savedSettings = localStorage.getItem('reminderSettings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setReminders(parsed);
      } catch (error) {
        console.error('Failed to parse reminder settings:', error);
      }
    }
  }, []);

  const handleToggle = (id: string, enabled: boolean) => {
    setReminders(prev => 
      prev.map(reminder => 
        reminder.id === id ? { ...reminder, enabled } : reminder
      )
    );
  };

  const handleTimeChange = (id: string, time: string) => {
    setReminders(prev =>
      prev.map(reminder =>
        reminder.id === id ? { ...reminder, time } : reminder
      )
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // TODO: API に設定を保存
      localStorage.setItem('reminderSettings', JSON.stringify(reminders));
      
      // 成功メッセージ表示（簡易版）
      alert('リマインダー設定を保存しました');
    } catch (error) {
      console.error('Failed to save reminder settings:', error);
      alert('保存に失敗しました');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50">
      {/* ヘッダー */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="flex items-center justify-between p-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft size={20} />
            <span>戻る</span>
          </Button>
          <h1 className="text-lg font-semibold text-gray-800">リマインダー設定</h1>
          <div className="w-16"></div> {/* スペーサー */}
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* 説明カード */}
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-start space-x-3">
            <Bell className="w-5 h-5 text-blue-600 mt-1" />
            <div>
              <h3 className="font-medium text-blue-800 mb-1">食事リマインダーについて</h3>
              <p className="text-sm text-blue-700">
                設定した時間にLINEに通知メッセージが届きます。食事の記録忘れを防ぎ、健康的な食生活をサポートします。
              </p>
            </div>
          </div>
        </Card>

        {/* リマインダー設定リスト */}
        <div className="space-y-4">
          {reminders.map((reminder) => (
            <Card key={reminder.id} className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                    <span className="text-lg">{reminder.icon}</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800">{reminder.name}のリマインダー</h4>
                    <p className="text-sm text-gray-500">
                      {reminder.enabled ? `${reminder.time} に通知` : '無効'}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={reminder.enabled}
                  onCheckedChange={(enabled) => handleToggle(reminder.id, enabled)}
                />
              </div>

              {reminder.enabled && (
                <div className="space-y-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center space-x-3">
                    <Clock size={16} className="text-gray-400" />
                    <Label htmlFor={`time-${reminder.id}`} className="text-sm font-medium">
                      通知時間
                    </Label>
                  </div>
                  <Input
                    id={`time-${reminder.id}`}
                    type="time"
                    value={reminder.time}
                    onChange={(e) => handleTimeChange(reminder.id, e.target.value)}
                    className="w-full"
                  />
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">通知メッセージ例：</span>
                    </p>
                    <p className="text-sm text-gray-700 mt-1">
                      {reminder.icon} {reminder.name}の時間です！<br />
                      今日も健康的な食事を心がけましょう💪
                    </p>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>

        {/* 保存ボタン */}
        <Card className="p-4">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full h-12 text-white font-medium"
            style={{ backgroundColor: '#4682B4' }}
          >
            {isSaving ? '保存中...' : '設定を保存'}
          </Button>
        </Card>

        {/* 注意事項 */}
        <Card className="p-4 bg-yellow-50 border-yellow-200">
          <h4 className="font-medium text-yellow-800 mb-2">⚠️ ご注意</h4>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• 通知はLINEのトーク画面に送信されます</li>
            <li>• 通知の送信には数分の遅れが生じる場合があります</li>
            <li>• LINEアカウントとの連携が必要です</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}