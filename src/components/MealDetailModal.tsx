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
  allMealsOfType?: any[]; // 同じ食事タイプの全記録
}

export function MealDetailModal({ 
  isOpen, 
  onClose, 
  meal, 
  mealType,
  onEditMeal,
  onAddSimilarMeal,
  allMealsOfType = []
}: MealDetailModalProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isImageViewOpen, setIsImageViewOpen] = useState(false);

  if (!meal) return null;

  // 全ての食事を表示用にまとめる
  const allMeals = allMealsOfType.length > 1 
    ? [...allMealsOfType].sort((a, b) => a.time.localeCompare(b.time))
    : [meal];

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


  // 全体の合計を計算
  const calculateGrandTotals = () => {
    return allMeals.reduce((grandTotal, mealRecord) => {
      if (mealRecord.isMultipleMeals && mealRecord.meals && mealRecord.meals.length > 0) {
        const mealTotals = mealRecord.meals.reduce((total: any, individualMeal: any) => ({
          calories: total.calories + (individualMeal.calories || 0),
          protein: total.protein + (individualMeal.protein || 0),
          fat: total.fat + (individualMeal.fat || 0),
          carbs: total.carbs + (individualMeal.carbs || 0)
        }), { calories: 0, protein: 0, fat: 0, carbs: 0 });
        
        return {
          calories: grandTotal.calories + mealTotals.calories,
          protein: grandTotal.protein + mealTotals.protein,
          fat: grandTotal.fat + mealTotals.fat,
          carbs: grandTotal.carbs + mealTotals.carbs
        };
      } else {
        return {
          calories: grandTotal.calories + (mealRecord.calories || 0),
          protein: grandTotal.protein + (mealRecord.protein || 0),
          fat: grandTotal.fat + (mealRecord.fat || 0),
          carbs: grandTotal.carbs + (mealRecord.carbs || 0)
        };
      }
    }, { calories: 0, protein: 0, fat: 0, carbs: 0 });
  };

  const grandTotals = calculateGrandTotals();

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-sm mx-auto max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg mb-4">
              <div className="flex items-center justify-between">
                <span>{mealTypeNames[mealType]}の詳細</span>
                {allMeals.length > 1 && (
                  <div className="text-xs text-slate-500">
                    {allMeals.length}件の記録
                  </div>
                )}
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
              {/* 全ての食事記録を表示 */}
              {allMeals.map((mealRecord, recordIndex) => (
                <div key={recordIndex} className="border border-slate-200 rounded-lg p-3 bg-slate-50/50">
                  {/* ヘッダー部分：画像 + 時刻・カロリー情報 */}
                  <div className="flex gap-3 mb-3">
                    {/* 左側：時刻とカロリー情報 */}
                    <div className="flex-1">
                      <div className="text-sm font-medium text-slate-700 mb-1">
                        {mealRecord.time} の記録
                      </div>
                      <div className="text-lg font-bold text-blue-600">
                        {mealRecord.isMultipleMeals && mealRecord.meals ? 
                          mealRecord.meals.reduce((total: number, meal: any) => total + (meal.calories || 0), 0) :
                          mealRecord.calories
                        } kcal
                      </div>
                    </div>

                    {/* 右側：画像（ある場合） */}
                    {((mealRecord.images && mealRecord.images.length > 0) || mealRecord.image) && (
                      <div className="w-20 h-20 flex-shrink-0">
                        {mealRecord.images && mealRecord.images.length > 0 ? (
                          <button
                            onClick={() => handleImageClick(mealRecord.images, 0)}
                            className="w-full h-full"
                          >
                            <ImageWithFallback
                              src={mealRecord.images[0]}
                              alt={mealRecord.name}
                              className="w-full h-full object-cover rounded-lg shadow-md hover:opacity-90 transition-opacity"
                            />
                          </button>
                        ) : mealRecord.image && (
                          <button
                            onClick={() => handleImageClick([mealRecord.image], 0)}
                            className="w-full h-full"
                          >
                            <ImageWithFallback
                              src={mealRecord.image}
                              alt={mealRecord.name}
                              className="w-full h-full object-cover rounded-lg shadow-md hover:opacity-90 transition-opacity"
                            />
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* 食事カード */}
                  <div className="space-y-2">
                    {(mealRecord.isMultipleMeals && mealRecord.meals && mealRecord.meals.length > 0) ? 
                      // 複数食事：個別カード表示
                      mealRecord.meals.map((individualMeal: any, index: number) => (
                        <Card key={index} className="p-3 bg-white border border-gray-200 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h3 className="font-semibold text-slate-800">{individualMeal.name}</h3>
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
                      // 単一食事
                      <Card className="p-3 bg-white border border-gray-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-slate-800">{mealRecord.name}</h3>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex space-x-1">
                            <Badge className="text-white font-medium text-xs" style={{backgroundColor: '#EF4444'}}>
                              P {mealRecord.protein}g
                            </Badge>
                            <Badge className="text-white font-medium text-xs" style={{backgroundColor: '#F59E0B'}}>
                              F {mealRecord.fat}g
                            </Badge>
                            <Badge className="text-white font-medium text-xs" style={{backgroundColor: '#10B981'}}>
                              C {mealRecord.carbs}g
                            </Badge>
                          </div>
                          <div className="text-right">
                            <span className="text-xl font-bold text-blue-600">
                              {mealRecord.calories}
                            </span>
                            <span className="text-sm text-slate-600 ml-1">kcal</span>
                          </div>
                        </div>
                      </Card>
                    }
                  </div>
                </div>
              ))}

              {/* 全体の合計表示（複数記録がある場合のみ） */}
              {allMeals.length > 1 && (
                <Card className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-800">{mealTypeNames[mealType]}の合計</h3>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex space-x-1">
                      <Badge className="text-white font-medium text-xs" style={{backgroundColor: '#EF4444'}}>
                        P {grandTotals.protein}g
                      </Badge>
                      <Badge className="text-white font-medium text-xs" style={{backgroundColor: '#F59E0B'}}>
                        F {grandTotals.fat}g
                      </Badge>
                      <Badge className="text-white font-medium text-xs" style={{backgroundColor: '#10B981'}}>
                        C {grandTotals.carbs}g
                      </Badge>
                    </div>
                    <div className="text-right">
                      <span className="text-xl font-bold text-blue-600">
                        {grandTotals.calories}
                      </span>
                      <span className="text-sm text-slate-600 ml-1">kcal</span>
                    </div>
                  </div>
                </Card>
              )}

              {/* アクションボタン */}
              <div className="grid grid-cols-2 gap-3 pt-4">
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