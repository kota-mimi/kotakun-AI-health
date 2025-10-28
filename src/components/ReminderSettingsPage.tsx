import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { ArrowLeft, Bell, Clock, Utensils, Scale, Dumbbell, Plus } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface ReminderSetting {
  id: string;
  name: string;
  category: 'meal' | 'weight' | 'exercise' | 'custom';
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
  const [showAddForm, setShowAddForm] = useState(false);
  const [newReminderName, setNewReminderName] = useState('');
  const [newReminderCategory, setNewReminderCategory] = useState<'meal' | 'weight' | 'exercise' | 'custom'>('custom');

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'meal': return <Utensils className="w-5 h-5 text-orange-600" />;
      case 'weight': return <Scale className="w-5 h-5 text-blue-600" />;
      case 'exercise': return <Dumbbell className="w-5 h-5 text-green-600" />;
      default: return <Bell className="w-5 h-5 text-purple-600" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'meal': return 'bg-orange-100';
      case 'weight': return 'bg-blue-100';
      case 'exercise': return 'bg-green-100';
      default: return 'bg-purple-100';
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'meal': return '食事';
      case 'weight': return '体重記録';
      case 'exercise': return '運動';
      default: return 'カスタム';
    }
  };

  // 設定をAPIから読み込み
  useEffect(() => {
    const loadReminders = async () => {
      
      if (!liffUser?.userId) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/reminders?userId=${liffUser.userId}`);
        
        if (response.ok) {
          const data = await response.json();
          
          if (data.success) {
            setReminders(data.reminders);
          }
        } else {
          console.error('❌ Failed to load reminder settings, status:', response.status);
        }
      } catch (error) {
        console.error('❌ Error loading reminder settings:', error);
      } finally {
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

  const handleAddReminder = () => {
    if (!newReminderName.trim()) {
      alert('リマインダー名を入力してください');
      return;
    }

    const newReminder: ReminderSetting = {
      id: Date.now().toString(),
      name: newReminderName.trim(),
      category: newReminderCategory,
      enabled: true,
      time: '08:00',
      message: `${newReminderName}の時間です！`
    };

    setReminders(prev => [...prev, newReminder]);
    setNewReminderName('');
    setNewReminderCategory('custom');
    setShowAddForm(false);
  };

  const handleDeleteReminder = (id: string) => {
    setReminders(prev => prev.filter(reminder => reminder.id !== id));
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
    <div className="min-h-screen bg-white overflow-y-auto">
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

      <div className="p-4 pb-20 space-y-6">
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
              <h3 className="font-medium text-blue-800 mb-1">リマインダーについて</h3>
              <p className="text-sm text-blue-700">
                設定した時間にLINEに通知メッセージが届きます。食事・体重・運動などのカテゴリから選択するか、カスタムリマインダーを作成できます。
              </p>
            </div>
          </div>
        </Card>

        {/* 新しいリマインダー追加ボタン */}
        <Card className="p-4">
          {!showAddForm ? (
            <Button
              onClick={() => setShowAddForm(true)}
              variant="outline"
              className="w-full h-12 border-dashed border-2 border-gray-300 text-gray-600 hover:border-blue-400 hover:text-blue-600"
            >
              <Plus size={20} className="mr-2" />
              新しいリマインダーを追加
            </Button>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-gray-800">新しいリマインダー</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowAddForm(false);
                    setNewReminderName('');
                    setNewReminderCategory('custom');
                  }}
                  className="text-gray-500"
                >
                  キャンセル
                </Button>
              </div>
              
              <div className="space-y-3">
                <div>
                  <Label className="text-sm font-medium">カテゴリ</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <button
                      onClick={() => setNewReminderCategory('meal')}
                      className={`p-3 rounded-lg border-2 flex items-center space-x-2 transition-colors ${
                        newReminderCategory === 'meal'
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Utensils size={16} className="text-orange-600" />
                      <span className="text-sm font-medium">食事</span>
                    </button>

                    <button
                      onClick={() => setNewReminderCategory('weight')}
                      className={`p-3 rounded-lg border-2 flex items-center space-x-2 transition-colors ${
                        newReminderCategory === 'weight'
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Scale size={16} className="text-blue-600" />
                      <span className="text-sm font-medium">体重記録</span>
                    </button>

                    <button
                      onClick={() => setNewReminderCategory('exercise')}
                      className={`p-3 rounded-lg border-2 flex items-center space-x-2 transition-colors ${
                        newReminderCategory === 'exercise'
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Dumbbell size={16} className="text-green-600" />
                      <span className="text-sm font-medium">運動</span>
                    </button>

                    <button
                      onClick={() => setNewReminderCategory('custom')}
                      className={`p-3 rounded-lg border-2 flex items-center space-x-2 transition-colors ${
                        newReminderCategory === 'custom'
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Bell size={16} className="text-purple-600" />
                      <span className="text-sm font-medium">カスタム</span>
                    </button>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="new-reminder-name" className="text-sm font-medium">
                    リマインダー名
                  </Label>
                  <Input
                    id="new-reminder-name"
                    value={newReminderName}
                    onChange={(e) => setNewReminderName(e.target.value)}
                    placeholder="例: 朝食、ジョギング、薬を飲む"
                    className="mt-2"
                  />
                </div>
                
                <Button
                  onClick={handleAddReminder}
                  className="w-full"
                  style={{ backgroundColor: '#4682B4' }}
                >
                  追加
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* リマインダー設定リスト */}
        <div className="space-y-4">
          {reminders.map((reminder) => (
            <Card key={reminder.id} className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full ${getCategoryColor(reminder.category)} flex items-center justify-center`}>
                    {getCategoryIcon(reminder.category)}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium text-gray-800">{reminder.name}のリマインダー</h4>
                      <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                        {getCategoryLabel(reminder.category)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">
                      {reminder.enabled ? `${reminder.time} に通知` : '無効'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Switch
                    checked={reminder.enabled}
                    onCheckedChange={(enabled) => handleToggle(reminder.id, enabled)}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteReminder(reminder.id)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    削除
                  </Button>
                </div>
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
        <Card className="p-4 bg-yellow-50 border-yellow-200">
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