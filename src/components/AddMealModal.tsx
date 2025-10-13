import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Camera, Upload, Plus, X, Loader2, Sparkles, Trash2, Clock, Edit2, Search } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { generateId } from '@/lib/utils';
import { compressImage } from '@/lib/imageUtils';
import { useAuth } from '@/hooks/useAuth';

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
  allMealsData?: any;
}

const mealTypeLabels = {
  breakfast: '朝食',
  lunch: '昼食',
  dinner: '夕食',
  snack: '間食'
};

export function AddMealModal({ isOpen, onClose, mealType, onAddMeal, allMealsData }: AddMealModalProps) {
  const { liffUser } = useAuth();
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
  const manualCameraInputRef = useRef<HTMLInputElement>(null);
  const manualAlbumInputRef = useRef<HTMLInputElement>(null);

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

  // 手動入力用の画像アップロード（API経由・AI分析なし）
  const handleManualImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && liffUser?.userId) {
      setIsAnalyzing(true);
      
      try {
        console.log('🔧 Starting manual image upload via API (no AI analysis)');
        
        const formData = new FormData();
        formData.append('file', file);
        formData.append('userId', liffUser.userId);

        const response = await fetch('/api/upload-image', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Upload failed');
        }

        const data = await response.json();
        
        if (data.success && data.imageUrl) {
          // 手動モードでは画像追加のみ、AI分析は実行しない
          setUploadedImages(prev => [...prev, data.imageUrl]);
          console.log('✅ Manual image upload successful (no AI analysis)');
        } else {
          throw new Error('Invalid response');
        }
      } catch (error) {
        console.error('❌ Manual image upload failed:', error);
      } finally {
        setIsAnalyzing(false);
        // input要素をクリア
        if (event.target) {
          event.target.value = '';
        }
      }
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      setIsAnalyzing(true);
      
      const newImages: string[] = [];
      const fileReaders: Promise<string>[] = [];

      for (let i = 0; i < Math.min(files.length, 5 - uploadedImages.length); i++) {
        const file = files[i];
        const promise = compressImage(file, {
          maxWidth: 800,
          maxHeight: 800,
          quality: 0.8,
          maxSizeKB: 1000
        });
        fileReaders.push(promise);
      }

      const results = await Promise.all(fileReaders);
      setUploadedImages(prev => [...prev, ...results]);

      // AI画像解析をAPI経由で実行
      try {
        const file = files[0];
        const formData = new FormData();
        formData.append('image', file);
        
        const response = await fetch('/api/analyze/image', {
          method: 'POST',
          body: formData,
        });
        
        if (response.ok) {
          const data = await response.json();
          const analysis = data.analysis;
          
          if (analysis.isMultipleMeals && analysis.meals) {
            // 複数食事の場合
            setMealName(analysis.meals.map((meal: any) => meal.displayName || meal.name).join('、'));
            const foodItemsData = analysis.meals.map((meal: any) => ({
              id: generateId(),
              name: meal.name,
              calories: meal.calories || 0,
              protein: meal.protein || 0,
              fat: meal.fat || 0,
              carbs: meal.carbs || 0
            }));
            setFoodItems(foodItemsData);
            // 合計値も計算して設定
            setTimeout(calculateTotals, 100);
          } else {
            // 単一食事の場合
            setMealName(analysis.displayName || analysis.foodItems?.[0] || '食事');
            setFoodItems([{
              id: generateId(),
              name: analysis.foodItems?.[0] || '食事',
              calories: analysis.calories || 0,
              protein: analysis.protein || 0,
              fat: analysis.fat || 0,
              carbs: analysis.carbs || 0
            }]);
            // 合計値も計算して設定
            setTimeout(calculateTotals, 100);
          }
        } else {
          throw new Error('API解析失敗');
        }
      } catch (error) {
        console.error('AI画像解析エラー:', error);
        // フォールバック - ダミーデータ
        setMealName('食事');
        setFoodItems([{
          id: generateId(),
          name: '食事',
          calories: 400,
          protein: 20,
          fat: 15,
          carbs: 50
        }]);
        // 合計値も計算して設定
        setTimeout(calculateTotals, 100);
      }
      
      setIsAnalyzing(false);
      setShowManualInput(true); // AI解析後は手動入力モードに切り替え
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
    
    try {
      const response = await fetch('/api/analyze/text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: textInput }),
      });
      
      if (response.ok) {
        const data = await response.json();
        const analysis = data.analysis;
        
        if (analysis.isMultipleMeals && analysis.meals) {
          // 複数食事の場合
          setMealName(analysis.meals.map((meal: any) => meal.displayName || meal.name).join('、'));
          const foodItemsData = analysis.meals.map((meal: any) => ({
            id: generateId(),
            name: meal.name,
            calories: meal.calories || 0,
            protein: meal.protein || 0,
            fat: meal.fat || 0,
            carbs: meal.carbs || 0
          }));
          setFoodItems(foodItemsData);
        } else {
          // 単一食事の場合
          setMealName(analysis.displayName || analysis.foodItems?.[0] || textInput);
          setFoodItems([{
            id: generateId(),
            name: analysis.foodItems?.[0] || textInput,
            calories: analysis.calories || 0,
            protein: analysis.protein || 0,
            fat: analysis.fat || 0,
            carbs: analysis.carbs || 0
          }]);
        }
      } else {
        throw new Error('API解析失敗');
      }
      
      // 合計値も自動計算
      setTimeout(calculateTotals, 100);
      setShowTextInput(false); // 解析後は入力エリアを非表示
      setShowManualInput(true); // 解析結果を手動入力モードで表示
    } catch (error) {
      console.error('AIテキスト解析エラー:', error);
      // フォールバック - 基本的なデータ
      setMealName(textInput.length > 20 ? textInput.substring(0, 20) + '...' : textInput);
      setFoodItems([{
        id: generateId(),
        name: textInput,
        calories: 400,
        protein: 20,
        fat: 15,
        carbs: 45
      }]);
      setTimeout(calculateTotals, 100);
      setShowTextInput(false);
      setShowManualInput(true);
    }
    
    setIsTextAnalyzing(false);
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

    // 複数食事の場合も単品食事と同じ構造で送信
    if (foodItems.length > 1) {
      const totalCalories = foodItems.reduce((sum, item) => sum + item.calories, 0);
      const totalProtein = foodItems.reduce((sum, item) => sum + item.protein, 0);
      const totalFat = foodItems.reduce((sum, item) => sum + item.fat, 0);
      const totalCarbs = foodItems.reduce((sum, item) => sum + item.carbs, 0);
      
      onAddMeal({
        name: mealName,
        calories: totalCalories,
        protein: totalProtein,
        fat: totalFat,
        carbs: totalCarbs,
        time: currentTime,
        images: uploadedImages.length > 0 ? uploadedImages : undefined,
        isMultipleMeals: true,
        meals: foodItems.map(item => ({
          name: item.name,
          calories: item.calories,
          protein: item.protein,
          fat: item.fat,
          carbs: item.carbs
        })),
        foodItems: foodItems
      });
    } else {
      // 単一食事または手動入力の場合
      const totalCalories = foodItems.length > 0 
        ? foodItems[0].calories
        : parseInt(calories) || 0;
      
      const totalProtein = foodItems.length > 0 
        ? foodItems[0].protein
        : parseInt(protein) || 0;
      
      const totalFat = foodItems.length > 0 
        ? foodItems[0].fat
        : parseInt(fat) || 0;
      
      const totalCarbs = foodItems.length > 0 
        ? foodItems[0].carbs
        : parseInt(carbs) || 0;

      onAddMeal({
        name: mealName,
        calories: totalCalories,
        protein: totalProtein,
        fat: totalFat,
        carbs: totalCarbs,
        time: currentTime,
        images: uploadedImages.length > 0 ? uploadedImages : undefined,
        foodItems: foodItems.length > 0 ? foodItems : undefined
      });
    }

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
            
            
            {/* 複数画像表示（解析結果表示中は非表示） */}
            {uploadedImages.length > 0 && foodItems.length === 0 && (
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
            
            {/* 記録方法選択フレーム - 初期画面のみ表示（解析中は非表示） */}
            {uploadedImages.length < 5 && !showTextInput && !showManualInput && !showAnalysisResult && !showPastRecords && !isAnalyzing && (
              <div className="space-y-3">
                {/* メイン記録方法 */}
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (fileInputRef.current) {
                        fileInputRef.current.removeAttribute('capture');
                        fileInputRef.current.click();
                      }
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
            
            {/* 画像解析中表示 */}
            {isAnalyzing && (
              <Card className="p-4">
                <div className="text-center" style={{color: '#4682B4'}}>
                  <p className="text-sm">解析中...</p>
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
              <div className="space-y-2">
                {foodItems.map((item) => (
                  <div key={item.id} className="bg-white rounded-lg border border-slate-200 p-3 shadow-sm">
                    <div className="flex items-center space-x-3">
                      {/* 食事画像（画像がある場合のみ表示） */}
                      {uploadedImages.length > 0 && (
                        <div className="flex-shrink-0 w-12 h-12">
                          <img
                            src={uploadedImages[0]}
                            alt={item.name}
                            className="w-full h-full object-cover rounded-lg border border-slate-200"
                          />
                        </div>
                      )}

                      {/* 食事情報 */}
                      <div className="flex-1 min-w-0">
                        <h5 className="font-semibold text-base text-slate-800 break-words leading-tight mb-1.5">
                          {item.name}
                        </h5>
                        
                        {/* PFC・カロリー */}
                        <div className="flex items-center justify-between">
                          <div className="flex space-x-1">
                            <Badge className="text-white font-medium text-xs px-1.5 py-0.5 rounded min-w-[36px] text-center" style={{backgroundColor: '#EF4444'}}>
                              P{item.protein || 0}
                            </Badge>
                            <Badge className="text-white font-medium text-xs px-1.5 py-0.5 rounded min-w-[36px] text-center" style={{backgroundColor: '#F59E0B'}}>
                              F{item.fat || 0}
                            </Badge>
                            <Badge className="text-white font-medium text-xs px-1.5 py-0.5 rounded min-w-[36px] text-center" style={{backgroundColor: '#10B981'}}>
                              C{item.carbs || 0}
                            </Badge>
                          </div>
                          <div className="text-sm font-bold text-blue-600">
                            {item.calories}kcal
                          </div>
                        </div>
                      </div>

                      {/* 削除ボタン */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFoodItem(item.id)}
                        className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
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
                placeholder=""
                className="h-24"
                disabled={isTextAnalyzing}
              />
              <Button
                onClick={handleTextAnalysis}
                disabled={!textInput.trim() || isTextAnalyzing}
                className="w-full"
                style={{backgroundColor: '#4682B4'}}
              >
                {isTextAnalyzing ? "解析中..." : "解析する"}
              </Button>
            </div>
          )}


          {/* 過去の記録から選択 */}
          {showPastRecords && (
            <div className="space-y-3">
              <Label>過去の記録から選択</Label>
              
              {/* 検索バー */}
              <div className="relative">
                <Input
                  type="text"
                  placeholder="食事名で検索..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* 過去の記録リスト */}
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {filteredPastMeals.length > 0 ? (
                  filteredPastMeals.map((meal) => {
                    const images = meal.images || (meal.image ? [meal.image] : []);
                    
                    return (
                      <div
                        key={meal.id}
                        onClick={() => handleSelectPastMeal(meal)}
                        className="bg-white rounded-lg border border-slate-200 p-3 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
                      >
                        <div className="flex items-center space-x-3">
                          {/* 食事画像（画像がある場合のみ表示） */}
                          {images.length > 0 && (
                            <div className="flex-shrink-0 w-12 h-12">
                              <img
                                src={images[0]}
                                alt={meal.name}
                                className="w-full h-full object-cover rounded-lg border border-slate-200"
                              />
                            </div>
                          )}

                          {/* 食事情報 */}
                          <div className="flex-1 min-w-0">
                            <h5 className="font-semibold text-base text-slate-800 break-words leading-tight mb-1.5">
                              {meal.name}
                            </h5>
                            
                            {/* PFC・カロリー */}
                            <div className="flex items-center justify-between">
                              <div className="flex space-x-1">
                                <Badge className="text-white font-medium text-xs px-1.5 py-0.5 rounded min-w-[36px] text-center" style={{backgroundColor: '#EF4444'}}>
                                  P{meal.protein || 0}
                                </Badge>
                                <Badge className="text-white font-medium text-xs px-1.5 py-0.5 rounded min-w-[36px] text-center" style={{backgroundColor: '#F59E0B'}}>
                                  F{meal.fat || 0}
                                </Badge>
                                <Badge className="text-white font-medium text-xs px-1.5 py-0.5 rounded min-w-[36px] text-center" style={{backgroundColor: '#10B981'}}>
                                  C{meal.carbs || 0}
                                </Badge>
                              </div>
                              <div className="text-sm font-bold text-blue-600">
                                {meal.calories}kcal
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
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
              {/* 手動入力用の画像追加 */}
              <div className="space-y-3">
                <Label>写真を追加</Label>
                
                {uploadedImages.length > 0 ? (
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
                          onClick={() => setUploadedImages(prev => prev.filter((_, i) => i !== index))}
                          className="absolute top-1 right-1 p-1 bg-black/50 hover:bg-black/70 text-white rounded-full"
                        >
                          <X size={12} />
                        </Button>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      onClick={() => manualCameraInputRef.current?.click()}
                      className="h-16 flex flex-col items-center justify-center space-y-1"
                      style={{borderColor: 'rgba(70, 130, 180, 0.3)'}}
                      disabled={isAnalyzing}
                    >
                      <Camera size={16} style={{color: '#4682B4'}} />
                      <span className="text-xs" style={{color: '#4682B4'}}>カメラ</span>
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => manualAlbumInputRef.current?.click()}
                      className="h-16 flex flex-col items-center justify-center space-y-1"
                      style={{borderColor: 'rgba(70, 130, 180, 0.3)'}}
                      disabled={isAnalyzing}
                    >
                      <Upload size={16} style={{color: '#4682B4'}} />
                      <span className="text-xs" style={{color: '#4682B4'}}>アルバム</span>
                    </Button>
                  </div>
                )}
                
                {/* 手動入力用の隠しinput要素 */}
                <input
                  ref={manualCameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleManualImageUpload}
                  className="hidden"
                />
                <input
                  ref={manualAlbumInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleManualImageUpload}
                  className="hidden"
                />
              </div>
              
              {/* AI解析結果がない場合のみ食事名入力を表示 */}
              {foodItems.length === 0 && (
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
              )}

              {/* AI解析結果がない場合のみ栄養素入力欄を表示 */}
              {foodItems.length === 0 && (
                <>
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
                      />
                    </div>
                  </div>
                </>
              )}
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