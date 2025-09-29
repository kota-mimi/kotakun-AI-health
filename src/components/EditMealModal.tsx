import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Card } from './ui/card';
import { Camera, Upload, Save, X, Trash2 } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface MealItem {
  id: string;
  name: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  time: string;
  image?: string;
}

interface EditMealModalProps {
  isOpen: boolean;
  onClose: () => void;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  meal: MealItem | null;
  onUpdateMeal: (updatedMeal: MealItem) => void;
  onDeleteMeal: (mealId: string) => void;
}

const mealTypeLabels = {
  breakfast: '朝食',
  lunch: '昼食',
  dinner: '夕食',
  snack: '間食'
};

export function EditMealModal({ isOpen, onClose, mealType, meal, onUpdateMeal, onDeleteMeal }: EditMealModalProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [mealName, setMealName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [fat, setFat] = useState('');
  const [carbs, setCarbs] = useState('');
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 編集対象の食事データを初期値として設定
  useEffect(() => {
    if (meal && isOpen) {
      setMealName(meal.name);
      setCalories(meal.calories.toString());
      setProtein(meal.protein?.toString() || '');
      setFat(meal.fat?.toString() || '');
      setCarbs(meal.carbs?.toString() || '');
      setTime(meal.time);
      setUploadedImage(meal.image || null);
      setNotes('');
    }
  }, [meal, isOpen]);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // 画像をプレビュー用にセット
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdate = () => {
    if (!meal || !mealName || !calories) return;

    const updatedMeal: MealItem = {
      ...meal,
      name: mealName,
      calories: parseInt(calories),
      protein: parseInt(protein) || 0,
      fat: parseInt(fat) || 0,
      carbs: parseInt(carbs) || 0,
      time: time,
      image: uploadedImage || undefined
    };

    onUpdateMeal(updatedMeal);
    onClose();
  };

  const handleDelete = () => {
    if (meal && window.confirm('この食事記録を削除しますか？')) {
      onDeleteMeal(meal.id);
      onClose();
    }
  };

  const handleClearImage = () => {
    setUploadedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (!meal) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-sm mx-auto max-h-[50vh] overflow-y-auto"
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span>{mealTypeLabels[mealType]}を編集</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 h-auto"
            >
              <Trash2 size={16} />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* 画像アップロード */}
          <div className="space-y-3">
            <Label>写真を変更</Label>
            
            {uploadedImage ? (
              <Card className="relative">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-40 block"
                >
                  <ImageWithFallback
                    src={uploadedImage}
                    alt="編集中の食事"
                    className="w-full h-full object-cover rounded-lg hover:opacity-90 transition-opacity"
                  />
                </button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearImage}
                  className="absolute top-2 right-2 p-1 bg-black/50 hover:bg-black/70 text-white rounded-full"
                >
                  <X size={14} />
                </Button>
              </Card>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="h-20 flex flex-col items-center justify-center space-y-1"
                  style={{borderColor: 'rgba(70, 130, 180, 0.3)'}}
                >
                  <Camera size={20} style={{color: '#4682B4'}} />
                  <span className="text-xs" style={{color: '#4682B4'}}>カメラ</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="h-20 flex flex-col items-center justify-center space-y-1"
                  style={{borderColor: 'rgba(70, 130, 180, 0.3)'}}
                >
                  <Upload size={20} style={{color: '#4682B4'}} />
                  <span className="text-xs" style={{color: '#4682B4'}}>アルバム</span>
                </Button>
              </div>
            )}
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>

          {/* 手動入力フォーム */}
          <div className="space-y-3">
            <div>
              <Label htmlFor="mealName">食事名</Label>
              <Input
                id="mealName"
                value={mealName}
                onChange={(e) => setMealName(e.target.value)}
                placeholder="例: サーモンアボカド丼"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label htmlFor="time">時刻</Label>
                <Input
                  id="time"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  placeholder="19:30"
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="calories">カロリー (kcal)</Label>
                <Input
                  id="calories"
                  type="number"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={calories}
                  onChange={(e) => setCalories(e.target.value)}
                  placeholder="520"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label htmlFor="protein">タンパク質 (g)</Label>
                <Input
                  id="protein"
                  type="number"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={protein}
                  onChange={(e) => setProtein(e.target.value)}
                  placeholder="28"
                />
              </div>
              <div>
                <Label htmlFor="fat">脂質 (g)</Label>
                <Input
                  id="fat"
                  type="number"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={fat}
                  onChange={(e) => setFat(e.target.value)}
                  placeholder="18"
                />
              </div>
              <div>
                <Label htmlFor="carbs">炭水化物 (g)</Label>
                <Input
                  id="carbs"
                  type="number"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={carbs}
                  onChange={(e) => setCarbs(e.target.value)}
                  placeholder="45"
                />
              </div>
            </div>


          </div>

          {/* ボタン */}
          <div className="flex space-x-2 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">
              キャンセル
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={!mealName || !calories}
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