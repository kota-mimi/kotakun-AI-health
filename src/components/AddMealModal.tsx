import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Card } from './ui/card';
import { Camera, Upload, Plus, X, Loader2, Sparkles, Trash2, Clock, Edit2, Search } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { generateId } from '@/lib/utils';

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
  onAddMultipleMeals?: (meals: Omit<MealItem, 'id'>[]) => void;
  allMealsData?: any;
}

const mealTypeLabels = {
  breakfast: '朝食',
  lunch: '昼食',
  dinner: '夕食',
  snack: '間食'
};

export function AddMealModal({ isOpen, onClose, mealType, onAddMeal, onAddMultipleMeals, allMealsData }: AddMealModalProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [showManualInput, setShowManualInput] = useState(false);
  const [showTextInput, setShowTextInput] = useState(false);
  const [showAnalysisResult, setShowAnalysisResult] = useState(false);
  const [showPastRecords, setShowPastRecords] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [isTextAnalyzing, setIsTextAnalyzing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [mealName, setMealName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [fat, setFat] = useState('');
  const [carbs, setCarbs] = useState('');

  // 実際の過去の記録データを取得
  const getAllPastMeals = () => {
    if (!allMealsData) return [];
    
    const allMeals: any[] = [];
    
    // 全ての食事タイプから記録を取得（まずは全てを表示してテスト）
    Object.entries(allMealsData).forEach(([mealType, meals]: [string, any[]]) => {
      meals.forEach(meal => {
        allMeals.push({
          ...meal,
          mealType,
          date: meal.createdAt ? new Date(meal.createdAt).toLocaleDateString('ja-JP') : '日付不明',
          image: meal.images?.[0] || meal.image
        });
      });
    });
    
    // 新しい順にソート
    return allMeals.sort((a, b) => {
      const timeA = new Date(a.createdAt || 0).getTime();
      const timeB = new Date(b.createdAt || 0).getTime();
      return timeB - timeA;
    });
  };

  // 検索フィルタリング
  const filteredPastMeals = getAllPastMeals().filter(meal =>
    meal.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const [notes, setNotes] = useState('');
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [newFoodName, setNewFoodName] = useState('');
  const [newFoodCalories, setNewFoodCalories] = useState('');
  const [newFoodProtein, setNewFoodProtein] = useState('');
  const [newFoodFat, setNewFoodFat] = useState('');
  const [newFoodCarbs, setNewFoodCarbs] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset states when modal opens
  useEffect(() => {
    if (isOpen) {
      setShowManualInput(false);
      setShowTextInput(false);
      setShowAnalysisResult(false);
      setShowPastRecords(false);
      setUploadedImages([]);
      setTextInput('');
      setSearchTerm('');
      setMealName('');
      setCalories('');
      setProtein('');
      setFat('');
      setCarbs('');
      setFoodItems([]);
    }
  }, [isOpen]);

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
              id: generateId(),
              name: 'サーモン',
              calories: 180,
              protein: 25,
              fat: 8,
              carbs: 0
            },
            {
              id: generateId(),
              name: 'アボカド',
              calories: 160,
              protein: 2,
              fat: 15,
              carbs: 9
            },
            {
              id: generateId(),
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
    
    // AI解析のシミュレーション - 複数食事対応
    setTimeout(() => {
      // カンマやその他の区切り文字で複数食事を検出
      const detectedMeals = [];
      
      if (textInput.includes('、') || textInput.includes(',') || textInput.includes('と')) {
        // 複数の料理が含まれている場合
        if ((textInput.includes('サーモン') || textInput.includes('鮭')) && textInput.includes('サラダ')) {
          setMealName('サーモン丼とサラダセット');
          setFoodItems([
            {
              id: generateId(),
              name: 'サーモン',
              calories: 200,
              protein: 28,
              fat: 9,
              carbs: 0
            },
            {
              id: generateId(),
              name: '白米',
              calories: 180,
              protein: 3,
              fat: 0,
              carbs: 38
            },
            {
              id: generateId(),
              name: 'サラダ',
              calories: 25,
              protein: 1,
              fat: 0,
              carbs: 5
            },
            {
              id: generateId(),
              name: 'ドレッシング',
              calories: 30,
              protein: 0,
              fat: 3,
              carbs: 2
            }
          ]);
        } else if (textInput.includes('チキン') && textInput.includes('味噌汁')) {
          setMealName('チキンと味噌汁定食');
          setFoodItems([
            {
              id: generateId(),
              name: 'チキン',
              calories: 165,
              protein: 31,
              fat: 3,
              carbs: 0
            },
            {
              id: generateId(),
              name: '味噌汁',
              calories: 35,
              protein: 2,
              fat: 1,
              carbs: 4
            },
            {
              id: generateId(),
              name: '白米',
              calories: 180,
              protein: 3,
              fat: 0,
              carbs: 38
            }
          ]);
        } else {
          // 一般的な複数食事の組み合わせ
          setMealName('複数料理の組み合わせ');
          setFoodItems([
            {
              id: generateId(),
              name: 'メイン料理',
              calories: 300,
              protein: 25,
              fat: 10,
              carbs: 20
            },
            {
              id: generateId(),
              name: 'サイドディッシュ',
              calories: 120,
              protein: 3,
              fat: 5,
              carbs: 15
            },
            {
              id: generateId(),
              name: 'ご飯・パン類',
              calories: 150,
              protein: 3,
              fat: 1,
              carbs: 30
            }
          ]);
        }
      } else {
        // 単一食事の場合（従来のロジック）
        if (textInput.includes('サーモン') || textInput.includes('鮭')) {
          setMealName('サーモン丼');
          setFoodItems([
            {
              id: generateId(),
              name: 'サーモン',
              calories: 200,
              protein: 28,
              fat: 9,
              carbs: 0
            },
            {
              id: generateId(),
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
              id: generateId(),
              name: 'チキン',
              calories: 165,
              protein: 31,
              fat: 3,
              carbs: 0
            },
            {
              id: generateId(),
              name: 'サラダ',
              calories: 20,
              protein: 1,
              fat: 0,
              carbs: 4
            }
          ]);
        } else {
          setMealName(textInput.length > 20 ? textInput.substring(0, 20) + '...' : textInput);
          setFoodItems([
            {
              id: generateId(),
              name: '推定された食事',
              calories: 400,
              protein: 20,
              fat: 15,
              carbs: 45
            }
          ]);
        }
      }
      
      // 合計値も自動計算
      setTimeout(calculateTotals, 100);
      setIsTextAnalyzing(false);
      setShowTextInput(false); // 解析後は入力エリアを非表示
      setShowAnalysisResult(true); // 解析結果画面を表示
    }, 2000);
  };

  const addFoodItem = () => {
    if (!newFoodName || !newFoodCalories) return;

    const newItem: FoodItem = {
      id: generateId(),
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
    setShowAnalysisResult(false);
    setShowPastRecords(false);
    setTextInput('');
    setSearchTerm('');
    onClose();
  };

  const handleBackToSelection = () => {
    setShowTextInput(false);
    setShowManualInput(false);
    setShowAnalysisResult(false);
    setShowPastRecords(false);
    setTextInput('');
    setSearchTerm('');
    setMealName('');
    setFoodItems([]);
  };

  const handleSelectPastMeal = (pastMeal: any) => {
    // 過去の記録を現在の食事として設定
    setMealName(pastMeal.name);
    setCalories(pastMeal.calories.toString());
    setProtein(pastMeal.protein.toString());
    setFat(pastMeal.fat.toString());
    setCarbs(pastMeal.carbs.toString());
    
    // 過去記録モードを閉じて手動入力モードに切り替え
    setShowPastRecords(false);
    setShowManualInput(true);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent 
        className="max-w-sm mx-auto max-h-[50vh] overflow-y-auto"
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span>{mealTypeLabels[mealType]}を追加</span>
              {isAnalyzing && <Loader2 className="w-4 h-4 animate-spin" style={{color: '#4682B4'}} />}
            </div>
            {(showTextInput || showManualInput || showAnalysisResult || showPastRecords) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackToSelection}
                className="text-xs text-slate-500 hover:text-slate-700"
              >
                ← 選択に戻る
              </Button>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* 画像アップロード */}
          <div className="space-y-3">
            {!showManualInput && uploadedImages.length > 0 && (
              <div className="flex items-center justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllImages}
                  className="text-xs text-slate-500 hover:text-slate-700 p-1"
                >
                  <X size={12} className="mr-1" />
                  全削除
                </Button>
              </div>
            )}
            
            {showManualInput && uploadedImages.length === 0 && (
              <div className="flex items-center justify-between">
                <Label>写真を追加（任意）</Label>
              </div>
            )}
            
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

            {/* 手動入力時の写真追加ボタン */}
            {showManualInput && uploadedImages.length < 5 && (
              <div className="flex justify-center">
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center space-x-2"
                  style={{borderColor: 'rgba(70, 130, 180, 0.3)'}}
                >
                  <Camera size={16} style={{color: '#4682B4'}} />
                  <span className="text-sm" style={{color: '#4682B4'}}>写真を追加</span>
                </Button>
              </div>
            )}
            
            {/* 記録方法選択フレーム - 初期画面のみ表示 */}
            {uploadedImages.length < 5 && !showTextInput && !showManualInput && !showAnalysisResult && !showPastRecords && (
              <div className="space-y-3">
                {/* メイン記録方法 */}
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                        fileInputRef.current?.setAttribute('capture', 'camera');
                      }
                      fileInputRef.current?.click();
                    }}
                    className="h-18 flex flex-col items-center justify-center space-y-1"
                    style={{borderColor: 'rgba(70, 130, 180, 0.3)'}}
                  >
                    <Camera size={18} style={{color: '#4682B4'}} />
                    <span className="text-xs" style={{color: '#4682B4'}}>カメラで記録</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowTextInput(true)}
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
                    onClick={() => setShowPastRecords(true)}
                    className="h-18 flex flex-col items-center justify-center space-y-1"
                    style={{borderColor: 'rgba(70, 130, 180, 0.3)'}}
                  >
                    <Clock size={18} style={{color: '#4682B4'}} />
                    <span className="text-xs" style={{color: '#4682B4'}}>過去の記録から</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowManualInput(true)}
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
                placeholder="例: 今日の昼食はサーモン丼を食べました。野菜サラダも一緒に。複数の料理がある場合は詳しく書いてください。"
                className="h-24"
                disabled={isTextAnalyzing}
              />
              <div className="text-xs text-slate-500 p-2 bg-slate-50 rounded-lg">
                💡 複数の料理を食べた場合は「サーモン丼、野菜サラダ、味噌汁」のように詳細に記録すると、それぞれを個別に解析できます
              </div>
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
                    複数食事を解析する
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

          {/* 過去の記録から選択 */}
          {showPastRecords && (
            <div className="space-y-3">
              <Label>過去の記録から選択</Label>
              
              {/* 検索バー */}
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                <Input
                  type="text"
                  placeholder="食事名で検索..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* 過去の記録リスト */}
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {filteredPastMeals.length > 0 ? (
                  filteredPastMeals.map((meal) => (
                    <div
                      key={meal.id}
                      onClick={() => handleSelectPastMeal(meal)}
                      className="flex items-center space-x-3 p-3 bg-slate-50 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                    >
                      {/* 食事画像 */}
                      <div className="flex-shrink-0 w-12 h-12 bg-slate-200 rounded-lg flex items-center justify-center overflow-hidden">
                        {meal.image ? (
                          <img
                            src={meal.image}
                            alt={meal.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="text-slate-400 text-xs">画像なし</div>
                        )}
                      </div>
                      
                      {/* 食事情報 */}
                      <div className="flex-1 min-w-0">
                        <h5 className="font-medium text-slate-800 truncate mb-1">
                          {meal.name}
                        </h5>
                        <div className="text-xs text-slate-500 mb-1">
                          {meal.date} {meal.time}
                        </div>
                        <div className="text-xs text-slate-600">
                          {meal.calories}kcal • P{meal.protein}g F{meal.fat}g C{meal.carbs}g
                        </div>
                      </div>
                      
                      {/* 選択ボタン */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectPastMeal(meal);
                        }}
                        className="text-xs"
                        style={{borderColor: 'rgba(70, 130, 180, 0.3)', color: '#4682B4'}}
                      >
                        選択
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    <Clock size={24} className="mx-auto mb-2 text-slate-400" />
                    <p className="text-sm">
                      {searchTerm ? '検索結果が見つかりません' : '過去の記録がありません'}
                    </p>
                    {searchTerm && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSearchTerm('')}
                        className="mt-2 text-xs"
                        style={{color: '#4682B4'}}
                      >
                        検索をクリア
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
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
                    inputMode="numeric"
                    pattern="[0-9]*"
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
                    inputMode="numeric"
                    pattern="[0-9]*"
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
                    inputMode="numeric"
                    pattern="[0-9]*"
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
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={carbs}
                    onChange={(e) => setCarbs(e.target.value)}
                    placeholder="45"
                    disabled={isAnalyzing}
                    readOnly={foodItems.length > 0}
                  />
                </div>
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