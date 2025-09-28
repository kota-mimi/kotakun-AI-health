import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Edit2, Plus, X, Sparkles, Clock, Utensils } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { ImageViewModal } from './ImageViewModal';

interface MealDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  meal: any;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  onEditMeal: () => void;
  onAddSimilarMeal: () => void;
}

export function MealDetailModal({ 
  isOpen, 
  onClose, 
  meal, 
  mealType,
  onEditMeal,
  onAddSimilarMeal
}: MealDetailModalProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isImageViewOpen, setIsImageViewOpen] = useState(false);

  if (!meal) return null;

  const mealTypeNames = {
    breakfast: '朝食',
    lunch: '昼食', 
    dinner: '夕食',
    snack: '間食'
  };

  const handleImageClick = (images: string[], index: number) => {
    setSelectedImageIndex(index);
    setIsImageViewOpen(true);
  };


  // 複数食事の場合と単一食事の場合を判定
  const isMultipleMeals = meal.isMultipleMeals && meal.meals && meal.meals.length > 0;
  
  // デバッグ用ログ - 完全なmealオブジェクトを出力
  console.log('🔍 MealDetailModal 完全デバッグ:');
  console.log('meal全体:', meal);
  console.log('meal.isMultipleMeals:', meal.isMultipleMeals);
  console.log('meal.meals:', meal.meals);
  console.log('判定結果:', meal.isMultipleMeals && meal.meals && meal.meals.length > 0);

  // 合計値を計算（複数食事の場合）
  const calculateTotals = () => {
    if (!isMultipleMeals) return { calories: meal.calories, protein: meal.protein, fat: meal.fat, carbs: meal.carbs };
    
    return meal.meals.reduce((total: any, individualMeal: any) => ({
      calories: total.calories + (individualMeal.calories || 0),
      protein: total.protein + (individualMeal.protein || 0),
      fat: total.fat + (individualMeal.fat || 0),
      carbs: total.carbs + (individualMeal.carbs || 0)
    }), { calories: 0, protein: 0, fat: 0, carbs: 0 });
  };

  const totals = calculateTotals();

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-sm mx-auto max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg">
              <div className="flex items-center space-x-2">
                <span>{mealTypeNames[mealType]}の詳細</span>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* 上部：食事画像 */}
            {(meal.images && meal.images.length > 0) ? (
              <div className="grid grid-cols-2 gap-2">
                {meal.images.slice(0, 2).map((img, index) => (
                  <button
                    key={index}
                    onClick={() => handleImageClick(meal.images, index)}
                    className="relative group"
                  >
                    <ImageWithFallback
                      src={img}
                      alt={meal.name}
                      className="w-full h-32 object-cover rounded-lg shadow-md group-hover:opacity-90 transition-opacity"
                    />
                  </button>
                ))}
              </div>
            ) : meal.image && (
              <button
                onClick={() => handleImageClick([meal.image], 0)}
                className="w-full"
              >
                <ImageWithFallback
                  src={meal.image}
                  alt={meal.name}
                  className="w-full h-48 object-cover rounded-lg shadow-md"
                />
              </button>
            )}

            {/* 個別食事カード - 常に表示、複数食事なら展開 */}
            <div className="space-y-2">
              {/* 複数食事の場合は個別表示、単一食事の場合はそのまま表示 */}
              {(meal.isMultipleMeals && meal.meals && meal.meals.length > 0) ? 
                // 複数食事：個別カード表示
                meal.meals.map((individualMeal: any, index: number) => (
                  <Card key={index} className="p-3 bg-white border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-slate-800">{individualMeal.name}</h3>
                          <div className="flex items-center space-x-1">
                            <Clock size={12} className="text-slate-500" />
                            <span className="text-xs text-slate-600">{meal.time}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex space-x-1">
                        <Badge className="text-white font-medium text-xs" style={{backgroundColor: '#EF4444'}}>
                          P {individualMeal.protein || 0}g
                        </Badge>
                        <Badge className="text-white font-medium text-xs" style={{backgroundColor: '#F59E0B'}}>
                          F {individualMeal.fat || 0}g
                        </Badge>
                        <Badge className="text-white font-medium text-xs" style={{backgroundColor: '#10B981'}}>
                          C {individualMeal.carbs || 0}g
                        </Badge>
                      </div>
                      <div className="text-right">
                        <span className="text-xl font-bold text-blue-600">
                          {individualMeal.calories || 0}
                        </span>
                        <span className="text-sm text-slate-600 ml-1">kcal</span>
                      </div>
                    </div>
                  </Card>
                )) 
                :
                // 単一食事：通常表示
                <Card className="p-4 bg-white border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-slate-800">{meal.name}</h3>
                    <div className="flex items-center space-x-1">
                      <Clock size={14} className="text-slate-500" />
                      <span className="text-sm text-slate-600">{meal.time}</span>
                    </div>
                  </div>
                  
                  <div className="text-center mb-3">
                    <span className="text-2xl font-bold text-blue-600">
                      {meal.calories}
                    </span>
                    <span className="text-sm text-slate-600 ml-1">kcal</span>
                  </div>

                  <div className="flex justify-center space-x-2">
                    <Badge className="text-white font-medium" style={{backgroundColor: '#EF4444'}}>
                      P {meal.protein}g
                    </Badge>
                    <Badge className="text-white font-medium" style={{backgroundColor: '#F59E0B'}}>
                      F {meal.fat}g
                    </Badge>
                    <Badge className="text-white font-medium" style={{backgroundColor: '#10B981'}}>
                      C {meal.carbs}g
                    </Badge>
                  </div>
                </Card>
              }
            </div>

            {/* 合計表示（複数食事の場合のみ） */}
            {(meal.isMultipleMeals && meal.meals && meal.meals.length > 0) && (
              <Card className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-slate-800">合計</h3>
                      <div className="flex items-center space-x-1">
                        <Clock size={12} className="text-slate-500" />
                        <span className="text-xs text-slate-600">{mealTypeNames[mealType]}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between mt-2">
                  <div className="flex space-x-1">
                    <Badge className="text-white font-medium text-xs" style={{backgroundColor: '#EF4444'}}>
                      P {totals.protein}g
                    </Badge>
                    <Badge className="text-white font-medium text-xs" style={{backgroundColor: '#F59E0B'}}>
                      F {totals.fat}g
                    </Badge>
                    <Badge className="text-white font-medium text-xs" style={{backgroundColor: '#10B981'}}>
                      C {totals.carbs}g
                    </Badge>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-bold text-blue-600">
                      {totals.calories}
                    </span>
                    <span className="text-sm text-slate-600 ml-1">kcal</span>
                  </div>
                </div>
              </Card>
            )}

            {/* アクションボタン */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <Button
                variant="outline"
                onClick={onEditMeal}
                className="flex items-center justify-center space-x-2"
                style={{borderColor: 'rgba(70, 130, 180, 0.3)', color: '#4682B4'}}
              >
                <Edit2 size={16} />
                <span>編集</span>
              </Button>
              <Button
                onClick={onAddSimilarMeal}
                className="flex items-center justify-center space-x-2"
                style={{backgroundColor: '#4682B4'}}
              >
                <Plus size={16} />
                <span>これを追加</span>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 画像ビューモーダル */}
      <ImageViewModal
        isOpen={isImageViewOpen}
        onClose={() => setIsImageViewOpen(false)}
        images={meal.images || (meal.image ? [meal.image] : [])}
        initialIndex={selectedImageIndex}
        title={meal.name}
      />
    </>
  );
}