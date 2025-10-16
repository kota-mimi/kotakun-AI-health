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

  // 複数食事を個別表示用に展開する関数
  const expandMultipleMeals = (mealItems: MealItem[]) => {
    const expandedMeals: MealItem[] = [];
    
    mealItems.forEach(meal => {
      if (meal.isMultipleMeals && meal.meals && meal.meals.length > 0) {
        // 複数食事を個別の食事として展開
        meal.meals.forEach((individualMeal: any, index: number) => {
          expandedMeals.push({
            ...meal,
            id: `${meal.id}_${index}`,
            name: individualMeal.name || `食事${index + 1}`,
            calories: individualMeal.calories || 0,
            protein: individualMeal.protein || 0,
            fat: individualMeal.fat || 0,
            carbs: individualMeal.carbs || 0,
            foodItems: [individualMeal.name] || [],
            isMultipleMeals: false, // 個別表示なのでfalse
            originalMealId: meal.id, // 元の食事IDを保持
            individualMealIndex: index // 何番目の食事かを保持
          });
        });
      } else {
        // 単一食事はそのまま追加
        expandedMeals.push(meal);
      }
    });
    
    // 時間順（古い順）でソート
    return expandedMeals.sort((a, b) => {
      const timeA = a.time.padStart(5, '0'); // "9:30" -> "09:30"
      const timeB = b.time.padStart(5, '0');
      return timeA.localeCompare(timeB);
    });
  };

  // 食事タイプごとに展開した食事データを作成 - ハイドレーションエラー回避
  const expandedMealData = isMounted ? {
    breakfast: expandMultipleMeals(meals.breakfast),
    lunch: expandMultipleMeals(meals.lunch),
    dinner: expandMultipleMeals(meals.dinner),
    snack: expandMultipleMeals(meals.snack)
  } : {
    breakfast: [],
    lunch: [],
    dinner: [],
    snack: []
  };

  // 各食事の合計カロリー計算（展開後）
  const getMealCalories = (mealType: keyof MealData) => {
    return expandedMealData[mealType].reduce((sum, item) => sum + item.calories, 0);
  };

  // 総カロリー計算（展開後） - ハイドレーションエラー回避
  const totalCalories = isMounted ? Object.values(expandedMealData).flat().reduce((sum, meal) => sum + meal.calories, 0) : 0;

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
          const mealItems = expandedMealData[mealType];
          const totalCaloriesForType = getMealCalories(mealType);
          const totalProtein = mealItems.reduce((sum, meal) => sum + (meal.protein || 0), 0);
          const totalFat = mealItems.reduce((sum, meal) => sum + (meal.fat || 0), 0);
          const totalCarbs = mealItems.reduce((sum, meal) => sum + (meal.carbs || 0), 0);

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
                          // 複数食事の個別食事の場合は個別編集
                          if (meal.originalMealId && meal.mealIndex !== undefined) {
                            onEditIndividualMeal(meal.originalMealId, meal.mealIndex);
                          } else {
                            // 単一食事の場合は通常編集
                            onEditMeal(mealType, meal.id);
                          }
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