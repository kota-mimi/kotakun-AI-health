import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  Plus,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface MealItem {
  id: string;
  name: string;
  calories: number;
  protein?: number;
  fat?: number;
  carbs?: number;
  time: string;
  image?: string;
  images?: string[];
  mealTime?: string;
  foodItems?: any[];
  isMultipleMeals?: boolean;
  meals?: any[];
  originalMealId?: string;
  individualMealIndex?: number;
}

interface MealData {
  breakfast: MealItem[];
  lunch: MealItem[];
  dinner: MealItem[];
  snack: MealItem[];
}

interface MealSummaryCardProps {
  meals: MealData;
  onAddMeal: (mealType: keyof MealData) => void;
  onCameraRecord: (mealType: keyof MealData) => void;
  onTextRecord: (mealType: keyof MealData) => void;
  onPastRecord: (mealType: keyof MealData) => void;
  onManualRecord: (mealType: keyof MealData) => void;
  onViewMealDetail: (mealType: keyof MealData, mealId: string) => void;
  onEditMeal: (mealType: keyof MealData, mealId: string) => void;
  onEditIndividualMeal: (mealId: string, individualMealIndex: number) => void;
  onNavigateToMeal: () => void;
  onMenuOpenChange?: (isOpen: boolean) => void;
}

const mealTimeLabels = {
  breakfast: '朝食',
  lunch: '昼食', 
  dinner: '夕食',
  snack: '間食'
};


export function MealSummaryCard({ meals, onAddMeal, onCameraRecord, onTextRecord, onPastRecord, onManualRecord, onViewMealDetail, onEditMeal, onEditIndividualMeal, onNavigateToMeal, onMenuOpenChange }: MealSummaryCardProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 食事を時間順にソートする関数（展開しない）
  const sortMealsByTime = (mealItems: MealItem[]) => {
    return mealItems.sort((a, b) => {
      const timeA = a.time.padStart(5, '0'); // "9:30" -> "09:30"
      const timeB = b.time.padStart(5, '0');
      return timeA.localeCompare(timeB);
    });
  };

  // 食事タイプごとに時間順ソートした食事データを作成 - ハイドレーションエラー回避
  const sortedMealData = isMounted ? {
    breakfast: sortMealsByTime([...meals.breakfast]),
    lunch: sortMealsByTime([...meals.lunch]),
    dinner: sortMealsByTime([...meals.dinner]),
    snack: sortMealsByTime([...meals.snack])
  } : {
    breakfast: [],
    lunch: [],
    dinner: [],
    snack: []
  };

  // 各食事の合計カロリー計算（複数食事対応）
  const getMealCalories = (mealType: keyof MealData) => {
    return sortedMealData[mealType].reduce((sum, item) => {
      if (item.isMultipleMeals && item.meals) {
        // 複数食事の場合は個別の食事のカロリーの合計
        return sum + item.meals.reduce((mealSum: number, meal: any) => mealSum + (meal.calories || 0), 0);
      } else {
        // 単一食事の場合はそのままのカロリー
        return sum + item.calories;
      }
    }, 0);
  };

  // 総カロリー計算（複数食事対応） - ハイドレーションエラー回避
  const totalCalories = isMounted ? Object.values(sortedMealData).flat().reduce((sum, meal) => {
    if (meal.isMultipleMeals && meal.meals) {
      return sum + meal.meals.reduce((mealSum: number, individualMeal: any) => mealSum + (individualMeal.calories || 0), 0);
    } else {
      return sum + meal.calories;
    }
  }, 0) : 0;

  // 食事タイプ順に並び替え（朝食→昼食→夕食→間食）
  const mealTypeOrder: Array<keyof MealData> = ['breakfast', 'lunch', 'dinner', 'snack'];

  return (
    <Card className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      <Button
        onClick={() => setIsExpanded(!isExpanded)}
        variant="ghost"
        className="w-full justify-start p-0 h-auto hover:bg-transparent"
      >
        <div className="flex items-center justify-between w-full px-4 py-3 border-b border-slate-200 hover:bg-slate-50 transition-colors duration-200">
          <div className="flex items-center space-x-2">
            <h3 className="font-semibold text-slate-900">今日の食事記録</h3>
          </div>
          {isExpanded ? (
            <ChevronUp size={16} className="text-slate-500" />
          ) : (
            <ChevronDown size={16} className="text-slate-500" />
          )}
        </div>
      </Button>
      
      {/* 食事フレーム - 開閉可能 */}
      {isExpanded && (
        <div className="p-4 space-y-3">
        {mealTypeOrder.map((mealType) => {
          const mealItems = sortedMealData[mealType];
          const totalCaloriesForType = getMealCalories(mealType);
          const totalProtein = mealItems.reduce((sum, meal) => {
            if (meal.isMultipleMeals && meal.meals) {
              return sum + meal.meals.reduce((mealSum: number, m: any) => mealSum + (m.protein || 0), 0);
            } else {
              return sum + (meal.protein || 0);
            }
          }, 0);
          const totalFat = mealItems.reduce((sum, meal) => {
            if (meal.isMultipleMeals && meal.meals) {
              return sum + meal.meals.reduce((mealSum: number, m: any) => mealSum + (m.fat || 0), 0);
            } else {
              return sum + (meal.fat || 0);
            }
          }, 0);
          const totalCarbs = mealItems.reduce((sum, meal) => {
            if (meal.isMultipleMeals && meal.meals) {
              return sum + meal.meals.reduce((mealSum: number, m: any) => mealSum + (m.carbs || 0), 0);
            } else {
              return sum + (meal.carbs || 0);
            }
          }, 0);

          return (
            <div key={mealType} className="space-y-2">
              {/* 食事タイプヘッダー - クリック可能 */}
              <Button
                onClick={() => onAddMeal(mealType)}
                variant="ghost"
                className="w-full justify-start p-0 h-auto hover:bg-transparent"
              >
                <div className="flex items-center justify-between w-full bg-slate-50 rounded-lg p-3 hover:bg-slate-100 transition-colors duration-200">
                  <div className="flex items-center justify-between w-full">
                    <h4 className="text-base font-semibold text-slate-800">{mealTimeLabels[mealType]}</h4>
                  </div>
                </div>
              </Button>

              {/* 食事リスト */}
              {mealItems.length > 0 && (
                <div className="space-y-2">
                  {mealItems.map((meal) => {
                    const images = meal.images || (meal.image ? [meal.image] : []);
                    
                    return (
                      <div 
                        key={meal.id} 
                        className="bg-white rounded-lg border border-slate-200 p-3 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group"
                        onClick={() => {
                          // 詳細表示
                          onViewMealDetail(mealType, meal.id);
                        }}
                      >
                        <div className="flex items-center space-x-3">
                          {/* 食事画像 */}
                          <div className="flex-shrink-0 w-12 h-12">
                            {images.length > 0 && (
                              <img
                                src={images[0]}
                                alt={meal.name}
                                className="w-full h-full object-cover rounded-lg border border-slate-200 transition-colors duration-200"
                              />
                            )}
                          </div>

                          {/* 食事情報 */}
                          <div className="flex-1 min-w-0">
                            <h5 className="font-semibold text-base text-slate-800 break-words leading-tight mb-1.5">
                              {meal.name}
                            </h5>
                            
                            {/* 複数食事の場合は個別食事を表示 */}
                            {meal.isMultipleMeals && meal.meals && meal.meals.length > 0 ? (
                              <div className="mb-2">
                                <div className="text-xs text-slate-500 mb-1">{meal.meals.length}品目</div>
                                <div className="space-y-1">
                                  {meal.meals.map((individualMeal: any, index: number) => (
                                    <div key={index} className="text-xs text-slate-600">
                                      • {individualMeal.name} ({individualMeal.calories}kcal)
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ) : null}
                            
                            {/* PFC・カロリー */}
                            <div className="flex items-center justify-between">
                              <div className="flex space-x-1">
                                <Badge className="text-white font-medium text-xs px-1.5 py-0.5 rounded min-w-[36px] text-center" style={{backgroundColor: '#EF4444'}}>
                                  P{meal.isMultipleMeals && meal.meals ? 
                                    meal.meals.reduce((sum: number, m: any) => sum + (m.protein || 0), 0) : 
                                    meal.protein || 0}
                                </Badge>
                                <Badge className="text-white font-medium text-xs px-1.5 py-0.5 rounded min-w-[36px] text-center" style={{backgroundColor: '#F59E0B'}}>
                                  F{meal.isMultipleMeals && meal.meals ? 
                                    meal.meals.reduce((sum: number, m: any) => sum + (m.fat || 0), 0) : 
                                    meal.fat || 0}
                                </Badge>
                                <Badge className="text-white font-medium text-xs px-1.5 py-0.5 rounded min-w-[36px] text-center" style={{backgroundColor: '#10B981'}}>
                                  C{meal.isMultipleMeals && meal.meals ? 
                                    meal.meals.reduce((sum: number, m: any) => sum + (m.carbs || 0), 0) : 
                                    meal.carbs || 0}
                                </Badge>
                              </div>
                              <div className="text-sm font-bold text-blue-600">
                                {meal.isMultipleMeals && meal.meals ? 
                                  meal.meals.reduce((sum: number, m: any) => sum + (m.calories || 0), 0) : 
                                  meal.calories}kcal
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                </div>
              )}
            </div>
          );
        })}
        </div>
      )}
    </Card>
  );
}