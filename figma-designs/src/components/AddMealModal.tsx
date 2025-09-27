import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Card } from './ui/card';
import { Camera, Upload, Plus, X, Loader2, Sparkles, Trash2, Clock, Edit2 } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface FoodItem {
  id: string;
  name: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
}

interface MealItem {
  id: string;
  name: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  time: string;
  images?: string[];
  foodItems?: FoodItem[];
}

interface AddMealModalProps {
  isOpen: boolean;
  onClose: () => void;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  onAddMeal: (meal: Omit<MealItem, 'id'>) => void;
}

const mealTypeLabels = {
  breakfast: '朝食',
  lunch: '昼食',
  dinner: '夕食',
  snack: '間食'
};

export function AddMealModal({ isOpen, onClose, mealType, onAddMeal }: AddMealModalProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [showManualInput, setShowManualInput] = useState(false);
  const [showTextInput, setShowTextInput] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [isTextAnalyzing, setIsTextAnalyzing] = useState(false);
  const [mealName, setMealName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [fat, setFat] = useState('');
  const [carbs, setCarbs] = useState('');
  const [notes, setNotes] = useState('');
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [newFoodName, setNewFoodName] = useState('');
  const [newFoodCalories, setNewFoodCalories] = useState('');
  const [newFoodProtein, setNewFoodProtein] = useState('');
  const [newFoodFat, setNewFoodFat] = useState('');
  const [newFoodCarbs, setNewFoodCarbs] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      setIsAnalyzing(true);
      
      const newImages: string[] = [];
      const fileReaders: Promise<string>[] = [];

      for (let i = 0; i < Math.min(files.length, 5 - uploadedImages.length); i++) {
        const file = files[i];
        const promise = new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsDataURL(file);
        });
        fileReaders.push(promise);
      }

      const results = await Promise.all(fileReaders);
      setUploadedImages(prev => [...prev, ...results]);

      // AI解析のシミュレーション（複数食品を検出）
      setTimeout(() => {
        if (uploadedImages.length === 0) {
          // 初回アップロード時のダミーデータ
          setMealName('サーモンアボカド丼');
          setFoodItems([
            {
              id: Date.now().toString(),
              name: 'サーモン',
              calories: 180,
              protein: 25,
              fat: 8,
              carbs: 0
            },
            {
              id: (Date.now() + 1).toString(),
              name: 'アボカド',
              calories: 160,
              protein: 2,
              fat: 15,
              carbs: 9
            },
            {
              id: (Date.now() + 2).toString(),
              name: '白米',
              calories: 180,
              protein: 3,
              fat: 0,
              carbs: 38
            }
          ]);
        }
        setIsAnalyzing(false);
      }, 2000);
    }
  };

  const calculateTotals = () => {
    const totalCalories = foodItems.reduce((sum, item) => sum + item.calories, 0);
    const totalProtein = foodItems.reduce((sum, item) => sum + item.protein, 0);
    const totalFat = foodItems.reduce((sum, item) => sum + item.fat, 0);
    const totalCarbs = foodItems.reduce((sum, item) => sum + item.carbs, 0);
    
    setCalories(totalCalories.toString());
    setProtein(totalProtein.toString());
    setFat(totalFat.toString());
    setCarbs(totalCarbs.toString());
  };

  const handleTextAnalysis = async () => {
    if (!textInput.trim()) return;
    
    setIsTextAnalyzing(true);
    
    // AI解析のシミュレーション
    setTimeout(() => {
      // テキストから食事情報を抽出（ダミーデータ）
      if (textInput.includes('サーモン') || textInput.includes('鮭')) {
        setMealName('サーモン丼');
        setFoodItems([
          {
            id: Date.now().toString(),
            name: 'サーモン',
            calories: 200,
            protein: 28,
            fat: 9,
            carbs: 0
          },
          {
            id: (Date.now() + 1).toString(),
            name: '白米',
            calories: 180,
            protein: 3,
            fat: 0,
            carbs: 38
          }
        ]);
      } else if (textInput.includes('チキン') || textInput.includes('鶏')) {
        setMealName('チキンサラダ');
        setFoodItems([
          {
            id: Date.now().toString(),
            name: 'チキン',
            calories: 165,
            protein: 31,
            fat: 3,
            carbs: 0
          },
          {
            id: (Date.now() + 1).toString(),
            name: 'サラダ',
            calories: 20,
            protein: 1,
            fat: 0,
            carbs: 4
          }
        ]);
      } else {
        // 一般的な食事として処理
        setMealName(textInput.length > 20 ? textInput.substring(0, 20) + '...' : textInput);
        setFoodItems([
          {
            id: Date.now().toString(),
            name: '推定された食事',
            calories: 400,
            protein: 20,
            fat: 15,
            carbs: 45
          }
        ]);
      }
      
      // 合計値も自動計算
      setTimeout(calculateTotals, 100);
      setIsTextAnalyzing(false);
      setShowTextInput(false); // 解析後は入力エリアを非表示
    }, 2000);
  };

  const addFoodItem = () => {
    if (!newFoodName || !newFoodCalories) return;

    const newItem: FoodItem = {
      id: Date.now().toString(),
      name: newFoodName,
      calories: parseInt(newFoodCalories),
      protein: parseInt(newFoodProtein) || 0,
      fat: parseInt(newFoodFat) || 0,
      carbs: parseInt(newFoodCarbs) || 0
    };

    setFoodItems(prev => [...prev, newItem]);
    
    // フォームクリア
    setNewFoodName('');
    setNewFoodCalories('');
    setNewFoodProtein('');
    setNewFoodFat('');
    setNewFoodCarbs('');
    
    // 合計を再計算
    setTimeout(calculateTotals, 100);
  };

  const removeFoodItem = (id: string) => {
    setFoodItems(prev => prev.filter(item => item.id !== id));
    setTimeout(calculateTotals, 100);
  };

  const handleSubmit = () => {
    if (!mealName) return;

    const currentTime = new Date().toLocaleTimeString('ja-JP', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    onAddMeal({
      name: mealName,
      calories: parseInt(calories) || 0,
      protein: parseInt(protein) || 0,
      fat: parseInt(fat) || 0,
      carbs: parseInt(carbs) || 0,
      time: currentTime,
      images: uploadedImages.length > 0 ? uploadedImages : undefined,
      foodItems: foodItems.length > 0 ? foodItems : undefined
    });

    // フォームリセット
    setMealName('');
    setCalories('');
    setProtein('');
    setFat('');
    setCarbs('');
    setNotes('');
    setUploadedImages([]);
    setFoodItems([]);
    setNewFoodName('');
    setNewFoodCalories('');
    setNewFoodProtein('');
    setNewFoodFat('');
    setNewFoodCarbs('');
    setShowManualInput(false);
    setShowTextInput(false);
    setTextInput('');
    onClose();
  };

  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  const clearAllImages = () => {
    setUploadedImages([]);
    setMealName('');
    setCalories('');
    setProtein('');
    setFat('');
    setCarbs('');
    setFoodItems([]);
    setShowManualInput(false);
    setShowTextInput(false);
    setTextInput('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    setShowManualInput(false);
    setShowTextInput(false);
    setTextInput('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm mx-auto max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <span>{mealTypeLabels[mealType]}を追加</span>
            {isAnalyzing && <Loader2 className="w-4 h-4 animate-spin" style={{color: '#4682B4'}} />}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* 画像アップロード */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>写真から自動解析 ({uploadedImages.length}/5)</Label>
              {uploadedImages.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllImages}
                  className="text-xs text-slate-500 hover:text-slate-700 p-1"
                >
                  <X size={12} className="mr-1" />
                  全削除
                </Button>
              )}
            </div>
            
            {/* 複数画像表示 */}
            {uploadedImages.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {uploadedImages.map((image, index) => (
                  <Card key={index} className="relative">
                    <ImageWithFallback
                      src={image}
                      alt={`アップロード画像 ${index + 1}`}
                      className="w-full h-20 object-cover rounded-lg"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 p-0.5 bg-black/50 hover:bg-black/70 text-white rounded-full h-5 w-5"
                    >
                      <X size={8} />
                    </Button>
                  </Card>
                ))}
              </div>
            )}

            {/* 記録方法選択フレーム */}
            {uploadedImages.length < 5 && (
              <div className="space-y-3">
                {/* メイン記録方法 */}
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="h-18 flex flex-col items-center justify-center space-y-1"
                    style={{borderColor: 'rgba(70, 130, 180, 0.3)'}}
                  >
                    <Camera size={18} style={{color: '#4682B4'}} />
                    <span className="text-xs" style={{color: '#4682B4'}}>カメラで記録</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowTextInput(!showTextInput)}
                    className="h-18 flex flex-col items-center justify-center space-y-1"
                    style={{borderColor: 'rgba(70, 130, 180, 0.3)'}}
                  >
                    <Edit2 size={18} style={{color: '#4682B4'}} />
                    <span className="text-xs" style={{color: '#4682B4'}}>テキストで記録</span>
                  </Button>
                </div>
                
                {/* 追加の記録方法 */}
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      // 過去の記録から選択する機能（未実装）
                      console.log('過去の記録から選択');
                    }}
                    className="h-18 flex flex-col items-center justify-center space-y-1"
                    style={{borderColor: 'rgba(70, 130, 180, 0.3)'}}
                  >
                    <Clock size={18} style={{color: '#4682B4'}} />
                    <span className="text-xs" style={{color: '#4682B4'}}>過去の記録から</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowManualInput(!showManualInput)}
                    className="h-18 flex flex-col items-center justify-center space-y-1"
                    style={{borderColor: 'rgba(70, 130, 180, 0.3)'}}
                  >
                    <Edit2 size={18} style={{color: '#4682B4'}} />
                    <span className="text-xs" style={{color: '#4682B4'}}>手動で入力</span>
                  </Button>
                </div>
              </div>
            )}
            
            {isAnalyzing && (
              <Card className="p-4">
                <div className="text-center" style={{color: '#4682B4'}}>
                  <Sparkles className="w-6 h-6 mx-auto mb-2 animate-pulse" />
                  <p className="text-sm">AI解析中...</p>
                </div>
              </Card>
            )}
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>

          {/* 検出された食品一覧 */}
          {foodItems.length > 0 && (
            <div className="space-y-2">
              <Label>検出された食品</Label>
              <div className="space-y-1">
                {foodItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{item.name}</p>
                      <p className="text-xs text-slate-600">
                        {item.calories}kcal • P{item.protein}g F{item.fat}g C{item.carbs}g
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFoodItem(item.id)}
                      className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 size={12} />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* テキスト入力エリア（条件付き表示） */}
          {showTextInput && (
            <div className="space-y-3">
              <Label>食事をテキストで記録</Label>
              <Textarea
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="例: 今日の昼食はサーモン丼を食べました。野菜サラダも一緒に。"
                className="h-20"
                disabled={isTextAnalyzing}
              />
              <Button
                onClick={handleTextAnalysis}
                disabled={!textInput.trim() || isTextAnalyzing}
                className="w-full"
                style={{backgroundColor: '#4682B4'}}
              >
                {isTextAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    解析中...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    解析する
                  </>
                )}
              </Button>
            </div>
          )}

          {/* 解析中表示 */}
          {isTextAnalyzing && (
            <Card className="p-4">
              <div className="text-center" style={{color: '#4682B4'}}>
                <Sparkles className="w-6 h-6 mx-auto mb-2 animate-pulse" />
                <p className="text-sm">テキストを解析しています...</p>
              </div>
            </Card>
          )}

          {/* 食品手動追加 */}


          {/* 手動入力フォーム（条件付き表示） */}
          {showManualInput && (
            <div className="space-y-3">
              <div>
                <Label htmlFor="mealName">食事名</Label>
                <Input
                  id="mealName"
                  value={mealName}
                  onChange={(e) => setMealName(e.target.value)}
                  placeholder="例: サーモンアボカド丼"
                  disabled={isAnalyzing}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="calories">カロリー (kcal)</Label>
                  <Input
                    id="calories"
                    type="number"
                    value={calories}
                    onChange={(e) => setCalories(e.target.value)}
                    placeholder="520"
                    disabled={isAnalyzing}
                    readOnly={foodItems.length > 0}
                  />
                </div>
                <div>
                  <Label htmlFor="protein">タンパク質 (g)</Label>
                  <Input
                    id="protein"
                    type="number"
                    value={protein}
                    onChange={(e) => setProtein(e.target.value)}
                    placeholder="28"
                    disabled={isAnalyzing}
                    readOnly={foodItems.length > 0}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="fat">脂質 (g)</Label>
                  <Input
                    id="fat"
                    type="number"
                    value={fat}
                    onChange={(e) => setFat(e.target.value)}
                    placeholder="18"
                    disabled={isAnalyzing}
                    readOnly={foodItems.length > 0}
                  />
                </div>
                <div>
                  <Label htmlFor="carbs">炭水化物 (g)</Label>
                  <Input
                    id="carbs"
                    type="number"
                    value={carbs}
                    onChange={(e) => setCarbs(e.target.value)}
                    placeholder="45"
                    disabled={isAnalyzing}
                    readOnly={foodItems.length > 0}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="notes">メモ（任意）</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="美味しかった、塩分多め など"
                  className="h-16"
                  disabled={isAnalyzing}
                />
              </div>
            </div>
          )}

          {/* ボタン */}
          <div className="flex space-x-2 pt-4">
            <Button variant="outline" onClick={handleClose} className="flex-1">
              キャンセル
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!mealName || isAnalyzing}
              className="flex-1"
              style={{backgroundColor: '#4682B4'}}
            >
              <Plus size={16} className="mr-1" />
              追加
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}