import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useAuth } from '@/hooks/useAuth';

interface TargetValues {
  targetCalories: number;
  protein: number;
  fat: number;
  carbs: number;
}

interface TargetSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date;
  currentTargets: TargetValues;
  onSave: () => void;
}

export function TargetSettingsModal({ 
  isOpen, 
  onClose, 
  selectedDate, 
  currentTargets,
  onSave 
}: TargetSettingsModalProps) {
  const { liffUser } = useAuth();
  const [targets, setTargets] = useState<TargetValues>(currentTargets);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTargets(currentTargets);
    }
  }, [isOpen, currentTargets]);

  // カロリーからPFCパーセンテージを計算
  const percentages = useMemo(() => {
    const calories = Number(targets.targetCalories) || 0;
    if (calories <= 0) return { protein: 0, fat: 0, carbs: 0 };
    
    const protein = Number(targets.protein) || 0;
    const fat = Number(targets.fat) || 0;
    const carbs = Number(targets.carbs) || 0;
    
    const proteinPercent = Math.round((protein * 4 / calories) * 100);
    const fatPercent = Math.round((fat * 9 / calories) * 100);
    const carbsPercent = Math.round((carbs * 4 / calories) * 100);
    
    return { protein: proteinPercent, fat: fatPercent, carbs: carbsPercent };
  }, [targets]);

  const handleSave = async () => {
    if (!liffUser?.userId) return;
    
    setSaving(true);
    try {
      const changeDate = selectedDate.toISOString().split('T')[0];
      
      const profileData = {
        changeDate,
        targetCalories: Number(targets.targetCalories) || 0,
        macros: {
          protein: Number(targets.protein) || 0,
          fat: Number(targets.fat) || 0,
          carbs: Number(targets.carbs) || 0
        },
        // 既存の計算値は保持（手動編集時はBMR/TDEEは計算しない）
        bmr: Math.round((Number(targets.targetCalories) || 0) * 0.7), // 簡易計算
        tdee: Number(targets.targetCalories) || 0,
        source: 'manual', // 手動編集フラグ
        name: '手動設定',
        age: 0,
        gender: 'other',
        height: 0,
        weight: 0,
        targetWeight: 0,
        activityLevel: 'manual',
        primaryGoal: 'manual'
      };

      const response = await fetch('/api/profile/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lineUserId: liffUser.userId,
          profileData
        })
      });

      if (response.ok) {
        // プロフィール履歴更新イベントを発火
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('profileHistoryUpdated'));
        }
        onSave();
        onClose();
      } else {
        throw new Error('保存に失敗しました');
      }
    } catch (error) {
      console.error('目標値保存エラー:', error);
      alert('保存に失敗しました。もう一度お試しください。');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ja-JP', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            目標値設定
            <div className="text-sm font-normal text-gray-600 mt-1">
              {formatDate(selectedDate)}
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* カロリー目標 */}
          <div>
            <Label htmlFor="calories" className="text-sm font-medium">
              カロリー目標
            </Label>
            <div className="relative mt-1">
              <Input
                id="calories"
                type="number"
                inputMode="decimal"
                pattern="[0-9]*"
                step="0.1"
                value={targets.targetCalories || ''}
                onChange={(e) => setTargets(prev => ({ 
                  ...prev, 
                  targetCalories: e.target.value === '' ? '' : parseFloat(e.target.value)
                }))}
                onFocus={(e) => e.target.select()}
                className="text-center text-sm h-8 pr-12"
                min="500"
                max="5000"
              />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">
                kcal
              </span>
            </div>
          </div>

          {/* PFCバランス */}
          <div>
            <Label className="text-sm font-medium mb-3 block">PFCバランス</Label>
            
            <div className="space-y-4">
              {/* タンパク質 */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-700">タンパク質</span>
                  <span className="text-sm text-red-600 font-medium">
                    {percentages.protein}%
                  </span>
                </div>
                <div className="relative">
                  <Input
                    type="number"
                    inputMode="decimal"
                    pattern="[0-9]*"
                    step="0.1"
                    value={targets.protein || ''}
                    onChange={(e) => setTargets(prev => ({ 
                      ...prev, 
                      protein: e.target.value === '' ? '' : parseFloat(e.target.value) 
                    }))}
                    onFocus={(e) => e.target.select()}
                    className="text-center text-sm h-8 pr-8"
                    min="0"
                    max="500"
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">
                    g
                  </span>
                </div>
              </div>

              {/* 脂質 */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-700">脂質</span>
                  <span className="text-sm text-orange-600 font-medium">
                    {percentages.fat}%
                  </span>
                </div>
                <div className="relative">
                  <Input
                    type="number"
                    inputMode="decimal"
                    pattern="[0-9]*"
                    step="0.1"
                    value={targets.fat || ''}
                    onChange={(e) => setTargets(prev => ({ 
                      ...prev, 
                      fat: e.target.value === '' ? '' : parseFloat(e.target.value) 
                    }))}
                    onFocus={(e) => e.target.select()}
                    className="text-center text-sm h-8 pr-8"
                    min="0"
                    max="300"
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">
                    g
                  </span>
                </div>
              </div>

              {/* 炭水化物 */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-700">炭水化物</span>
                  <span className="text-sm text-green-600 font-medium">
                    {percentages.carbs}%
                  </span>
                </div>
                <div className="relative">
                  <Input
                    type="number"
                    inputMode="decimal"
                    pattern="[0-9]*"
                    step="0.1"
                    value={targets.carbs || ''}
                    onChange={(e) => setTargets(prev => ({ 
                      ...prev, 
                      carbs: e.target.value === '' ? '' : parseFloat(e.target.value) 
                    }))}
                    onFocus={(e) => e.target.select()}
                    className="text-center text-sm h-8 pr-8"
                    min="0"
                    max="800"
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">
                    g
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 合計カロリー確認 */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-sm text-gray-600">
              PFCからの計算カロリー: 
              <span className="font-medium ml-1">
                {Math.round((Number(targets.protein) || 0) * 4 + (Number(targets.fat) || 0) * 9 + (Number(targets.carbs) || 0) * 4)} kcal
              </span>
            </div>
          </div>

          {/* ボタン */}
          <div className="flex space-x-3 pt-4">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="flex-1"
              disabled={saving}
            >
              キャンセル
            </Button>
            <Button 
              onClick={handleSave}
              className="flex-1"
              disabled={saving}
            >
              {saving ? '保存中...' : '保存'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}