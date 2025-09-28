import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Save } from 'lucide-react';

interface SummaryEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  currentTotals: {
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
  };
  onUpdateTotals: (totals: { calories: number; protein: number; fat: number; carbs: number }) => void;
}

const mealTypeLabels = {
  breakfast: '朝食',
  lunch: '昼食',
  dinner: '夕食',
  snack: '間食'
};

export function SummaryEditModal({ 
  isOpen, 
  onClose, 
  mealType, 
  currentTotals, 
  onUpdateTotals 
}: SummaryEditModalProps) {
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [fat, setFat] = useState('');
  const [carbs, setCarbs] = useState('');

  // モーダルが開いた時に現在の値を設定
  useEffect(() => {
    if (isOpen) {
      setCalories(currentTotals.calories.toString());
      setProtein(currentTotals.protein.toString());
      setFat(currentTotals.fat.toString());
      setCarbs(currentTotals.carbs.toString());
    }
  }, [isOpen, currentTotals]);

  const handleUpdate = () => {
    if (!calories) return;

    const updatedTotals = {
      calories: parseInt(calories) || 0,
      protein: parseInt(protein) || 0,
      fat: parseInt(fat) || 0,
      carbs: parseInt(carbs) || 0
    };

    onUpdateTotals(updatedTotals);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm mx-auto max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg">
            {mealTypeLabels[mealType]}の合計を編集
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="totalCalories">カロリー (kcal)</Label>
            <Input
              id="totalCalories"
              type="number"
              inputMode="numeric"
              value={calories}
              onChange={(e) => setCalories(e.target.value)}
              placeholder="520"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label htmlFor="totalProtein">タンパク質 (g)</Label>
              <Input
                id="totalProtein"
                type="number"
                inputMode="numeric"
                value={protein}
                onChange={(e) => setProtein(e.target.value)}
                placeholder="28"
              />
            </div>
            <div>
              <Label htmlFor="totalFat">脂質 (g)</Label>
              <Input
                id="totalFat"
                type="number"
                inputMode="numeric"
                value={fat}
                onChange={(e) => setFat(e.target.value)}
                placeholder="18"
              />
            </div>
            <div>
              <Label htmlFor="totalCarbs">炭水化物 (g)</Label>
              <Input
                id="totalCarbs"
                type="number"
                inputMode="numeric"
                value={carbs}
                onChange={(e) => setCarbs(e.target.value)}
                placeholder="45"
              />
            </div>
          </div>

          {/* ボタン */}
          <div className="flex space-x-2 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              キャンセル
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={!calories}
              className="flex-1"
              style={{backgroundColor: '#4682B4'}}
            >
              <Save size={16} className="mr-1" />
              更新
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}