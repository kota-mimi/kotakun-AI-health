import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { ArrowLeft, Bell, Clock, Utensils } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface ReminderSetting {
  id: string;
  name: string;
  enabled: boolean;
  time: string;
  message: string;
}

interface ReminderSettingsPageProps {
  onBack: () => void;
}

export function ReminderSettingsPage({ onBack }: ReminderSettingsPageProps) {
  const { liffUser } = useAuth();
  const [reminders, setReminders] = useState<ReminderSetting[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 設定をAPIから読み込み
  useEffect(() => {
    const loadReminders = async () => {
      console.log('🔍 loadReminders called, liffUser:', liffUser);
      
      if (!liffUser?.userId) {
        console.log('❌ No userId, setting loading to false');
        setIsLoading(false);
        return;
      }

      try {
        console.log('📡 Fetching reminders for userId:', liffUser.userId);
        const response = await fetch(`/api/reminders?userId=${liffUser.userId}`);
        console.log('📡 Response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('📡 Response data:', data);
          
          if (data.success) {
            setReminders(data.reminders);
            console.log('✅ Reminders set:', data.reminders);
          }
        } else {
          console.error('❌ Failed to load reminder settings, status:', response.status);
        }
      } catch (error) {
        console.error('❌ Error loading reminder settings:', error);
      } finally {
        console.log('✅ Setting loading to false');
        setIsLoading(false);
      }
    };

    loadReminders();
  }, [liffUser?.userId]);

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

  const handleMessageChange = (id: string, message: string) => {
    setReminders(prev =>
      prev.map(reminder =>
        reminder.id === id ? { ...reminder, message } : reminder
      )
    );
  };

  const handleSave = async () => {
    if (!liffUser?.userId) {
      alert('ログインが必要です');
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch('/api/reminders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: liffUser.userId,
          reminders
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          alert('リマインダー設定を保存しました');
        } else {
          throw new Error(data.error || '保存に失敗しました');
        }
      } else {
        throw new Error('保存に失敗しました');
      }
    } catch (error: any) {
      console.error('Failed to save reminder settings:', error);
      alert(error.message || '保存に失敗しました');
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

      <div className="p-4 pb-8 space-y-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-gray-600">設定を読み込み中...</p>
            </div>
          </div>
        ) : reminders.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <p className="text-gray-600">リマインダー設定が見つかりません</p>
              <p className="text-sm text-gray-500 mt-2">ログイン状態を確認してください</p>
            </div>
          </div>
        ) : (
          <>
            {/* 説明カード */}
            <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-start space-x-3">
            <Bell className="w-5 h-5 text-blue-600 mt-1" />
            <div>
              <h3 className="font-medium text-blue-800 mb-1">食事リマインダーについて</h3>
              <p className="text-sm text-blue-700">
                設定した時間にLINEに通知メッセージが届きます。通知メッセージは自由にカスタマイズできます。
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
                    <Utensils className="w-5 h-5 text-orange-600" />
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
                  
                  <div className="space-y-2">
                    <Label htmlFor={`message-${reminder.id}`} className="text-sm font-medium">
                      通知メッセージ
                    </Label>
                    <textarea
                      id={`message-${reminder.id}`}
                      value={reminder.message}
                      onChange={(e) => handleMessageChange(reminder.id, e.target.value)}
                      placeholder="通知メッセージを入力してください"
                      className="w-full p-3 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={3}
                    />
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
        <Card className="p-4 bg-yellow-50 border-yellow-200 mb-8">
          <h4 className="font-medium text-yellow-800 mb-2">⚠️ ご注意</h4>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• 通知はLINEのトーク画面に送信されます</li>
            <li>• 通知の送信には数分の遅れが生じる場合があります</li>
            <li>• LINEアカウントとの連携が必要です</li>
          </ul>
        </Card>
          </>
        )}
      </div>
    </div>
  );
}