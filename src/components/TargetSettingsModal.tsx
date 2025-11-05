import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useSharedProfile } from '@/hooks/useSharedProfile';
import { useCounselingData } from '@/hooks/useCounselingData';

interface TargetValues {
  targetCalories: number | string;
  protein: number | string;
  fat: number | string;
  carbs: number | string;
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
  const { latestProfile } = useSharedProfile();
  const { counselingResult } = useCounselingData();
  const [targets, setTargets] = useState<TargetValues>(currentTargets);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTargets(currentTargets);
    }
  }, [isOpen]);

  // カロリーからPFCパーセンテージを計算
  const getPercentages = () => {
    const calories = Number(targets.targetCalories) || 0;
    if (calories <= 0) return { protein: 0, fat: 0, carbs: 0 };
    
    const protein = Number(targets.protein) || 0;
    const fat = Number(targets.fat) || 0;
    const carbs = Number(targets.carbs) || 0;
    
    const proteinPercent = Math.round((protein * 4 / calories) * 100);
    const fatPercent = Math.round((fat * 9 / calories) * 100);
    const carbsPercent = Math.round((carbs * 4 / calories) * 100);
    
    return { protein: proteinPercent, fat: fatPercent, carbs: carbsPercent };
  };

  const percentages = getPercentages();

  const handleSave = async () => {
    if (!liffUser?.userId) return;
    
    setSaving(true);
    try {
      const changeDate = selectedDate.toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' });
      
      const targetCalories = Number(targets.targetCalories) || 0;
      const protein = Number(targets.protein) || 0;
      const fat = Number(targets.fat) || 0;
      const carbs = Number(targets.carbs) || 0;
      
      console.log('🔍 カロリー変更保存時の値確認:', {
        targetCalories,
        protein,
        fat,
        carbs,
        changeDate
      });
      
      // 既存のプロフィールデータを保持
      const existingProfile = latestProfile || {
        name: counselingResult?.answers?.name || counselingResult?.userProfile?.name || '未設定',
        age: counselingResult?.answers?.age || counselingResult?.userProfile?.age || 25,
        gender: counselingResult?.answers?.gender || counselingResult?.userProfile?.gender || 'other',
        height: counselingResult?.answers?.height || counselingResult?.userProfile?.height || 170,
        weight: counselingResult?.answers?.weight || counselingResult?.userProfile?.weight || 70,
        targetWeight: counselingResult?.answers?.targetWeight || counselingResult?.userProfile?.targetWeight || 65,
        activityLevel: 'moderate',
        primaryGoal: 'maintenance'
      };

      const profileData = {
        changeDate,
        targetCalories,
        macros: {
          protein,
          fat,
          carbs
        },
        // 既存の計算値は保持
        bmr: existingProfile.bmr || Math.round(targetCalories * 0.7),
        tdee: existingProfile.tdee || targetCalories,
        // 既存のプロフィール情報を保持
        name: existingProfile.name,
        age: existingProfile.age,
        gender: existingProfile.gender,
        height: existingProfile.height,
        weight: existingProfile.weight,
        targetWeight: existingProfile.targetWeight,
        activityLevel: existingProfile.activityLevel,
        primaryGoal: existingProfile.primaryGoal
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
        // プロフィール更新イベントを発火（useSharedProfileで受け取り）
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('profileUpdated'));
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

        {/* 更新中表示 */}
        {saving && (
          <div className="flex items-center justify-center py-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full mr-2"></div>
            <span className="text-blue-700 font-medium">目標値を更新中...</span>
          </div>
        )}

        <div className={`space-y-6 ${saving ? 'opacity-50 pointer-events-none' : ''} transition-opacity duration-300`}>
          {/* カロリー目標 */}
          <div>
            <Label htmlFor="calories" className="text-sm font-medium">
              カロリー目標
            </Label>
            <div className="relative mt-1">
              <Input
                id="calories"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={targets.targetCalories || ''}
                onChange={(e) => setTargets(prev => ({ 
                  ...prev, 
                  targetCalories: e.target.value
                }))}
                className="pr-12"
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
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={targets.protein || ''}
                    onChange={(e) => setTargets(prev => ({ 
                      ...prev, 
                      protein: e.target.value 
                    }))}
                    className="pr-8"
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
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={targets.fat || ''}
                    onChange={(e) => setTargets(prev => ({ 
                      ...prev, 
                      fat: e.target.value 
                    }))}
                    className="pr-8"
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
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={targets.carbs || ''}
                    onChange={(e) => setTargets(prev => ({ 
                      ...prev, 
                      carbs: e.target.value 
                    }))}
                    className="pr-8"
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
                {Math.round(targets.protein * 4 + targets.fat * 9 + targets.carbs * 4)} kcal
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