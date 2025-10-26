import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { X, Target, Calendar, Clock, Scale } from 'lucide-react';

interface WeightSettings {
  targetWeight: number;
  goalDeadline?: string;
  weightUnit: 'kg' | 'lbs';
  reminderTime?: string;
  reminderEnabled: boolean;
}

interface WeightSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSettings: WeightSettings;
  onUpdateSettings: (settings: Partial<WeightSettings>) => void;
}

export function WeightSettingsModal({ 
  isOpen, 
  onClose, 
  currentSettings, 
  onUpdateSettings 
}: WeightSettingsModalProps) {
  const [targetWeight, setTargetWeight] = useState(currentSettings.targetWeight.toString());
  const [goalDeadline, setGoalDeadline] = useState(currentSettings.goalDeadline || '');
  const [weightUnit, setWeightUnit] = useState(currentSettings.weightUnit);
  const [reminderTime, setReminderTime] = useState(currentSettings.reminderTime || '07:00');
  const [reminderEnabled, setReminderEnabled] = useState(currentSettings.reminderEnabled);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const targetWeightValue = parseFloat(targetWeight);
    if (isNaN(targetWeightValue) || targetWeightValue <= 0 || targetWeightValue > 300) {
      alert('正しい目標体重を入力してください（0-300kg）');
      return;
    }

    onUpdateSettings({
      targetWeight: targetWeightValue,
      goalDeadline: goalDeadline || undefined,
      weightUnit,
      reminderTime: reminderEnabled ? reminderTime : undefined,
      reminderEnabled
    });

    onClose();
    
    // 設定保存後に強制リロード
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const quickTargetAdjustments = [-5, -2, -1, 1, 2, 5];

  const adjustTarget = (adjustment: number) => {
    const currentValue = parseFloat(targetWeight) || currentSettings.targetWeight;
    const newValue = Math.max(30, Math.min(150, currentValue + adjustment));
    setTargetWeight(newValue.toFixed(1));
  };

  // 目標期限の最小値（今日）と最大値（1年後）を設定
  const today = new Date().toISOString().split('T')[0];
  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() + 1);
  const maxDateString = maxDate.toISOString().split('T')[0];

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end justify-center"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-t-2xl w-full mx-4 p-6 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* ヘッダー */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-800">体重設定</h2>
            <p className="text-sm text-slate-600">目標と通知を設定</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-100"
          >
            <X size={20} className="text-slate-600" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 目標体重設定 */}
          <div className="space-y-3">
            <Label className="flex items-center space-x-2 text-slate-700">
              <Target size={16} style={{color: '#4682B4'}} />
              <span>目標体重 ({weightUnit})</span>
            </Label>
            <div className="relative">
              <Input
                type="number"
                step="0.1"
                min="30"
                max="150"
                value={targetWeight}
                onChange={(e) => setTargetWeight(e.target.value)}
                className="text-2xl font-semibold text-center py-4 rounded-xl border border-slate-200 focus:border-blue-400"
                placeholder="68.0"
                style={{color: '#4682B4'}}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500">{weightUnit}</span>
            </div>
            
            {/* クイック調整ボタン */}
            <div className="flex justify-center space-x-2">
              {quickTargetAdjustments.map((adjustment) => (
                <Button
                  key={adjustment}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => adjustTarget(adjustment)}
                  className="px-3 py-1 text-xs rounded-lg border-slate-200 hover:bg-slate-50"
                >
                  {adjustment > 0 ? '+' : ''}{adjustment}
                </Button>
              ))}
            </div>
          </div>

          {/* 単位設定 */}
          <div className="space-y-3">
            <Label className="flex items-center space-x-2 text-slate-700">
              <Scale size={16} style={{color: '#6B7280'}} />
              <span>単位</span>
            </Label>
            <div className="flex space-x-2">
              <Button
                type="button"
                variant={weightUnit === 'kg' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setWeightUnit('kg')}
                className="flex-1 rounded-xl"
                style={weightUnit === 'kg' ? {backgroundColor: '#4682B4', color: 'white'} : {}}
              >
                キログラム (kg)
              </Button>
              <Button
                type="button"
                variant={weightUnit === 'lbs' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setWeightUnit('lbs')}
                className="flex-1 rounded-xl"
                style={weightUnit === 'lbs' ? {backgroundColor: '#4682B4', color: 'white'} : {}}
              >
                ポンド (lbs)
              </Button>
            </div>
          </div>

          {/* 目標期限設定 */}
          <div className="space-y-3">
            <Label className="flex items-center space-x-2 text-slate-700">
              <Calendar size={16} style={{color: '#10B981'}} />
              <span>目標期限 <span className="text-xs text-slate-500">任意</span></span>
            </Label>
            <Input
              type="date"
              value={goalDeadline}
              min={today}
              max={maxDateString}
              onChange={(e) => setGoalDeadline(e.target.value)}
              className="rounded-xl border border-slate-200 focus:border-green-400"
            />
          </div>

          {/* リマインダー設定 */}
          <div className="space-y-4">
            <Label className="flex items-center space-x-2 text-slate-700">
              <Clock size={16} style={{color: '#F59E0B'}} />
              <span>記録リマインダー</span>
            </Label>
            
            {/* リマインダーON/OFF */}
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
              <div>
                <p className="font-medium text-slate-700">毎日の記録を促す</p>
                <p className="text-sm text-slate-500">指定した時間に通知</p>
              </div>
              <Switch
                checked={reminderEnabled}
                onCheckedChange={setReminderEnabled}
              />
            </div>

            {/* リマインダー時間設定 */}
            {reminderEnabled && (
              <div className="space-y-2">
                <Label className="text-sm text-slate-600">通知時間</Label>
                <Input
                  type="time"
                  value={reminderTime}
                  onChange={(e) => setReminderTime(e.target.value)}
                  className="rounded-xl border border-slate-200 focus:border-amber-400"
                />
              </div>
            )}
          </div>

          {/* 送信ボタン */}
          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border-slate-200 hover:bg-slate-50"
            >
              キャンセル
            </Button>
            <Button
              type="submit"
              className="flex-1 py-3 rounded-xl text-white"
              style={{backgroundColor: '#4682B4'}}
            >
              保存
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}