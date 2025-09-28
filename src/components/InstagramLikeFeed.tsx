import { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  ChevronLeft,
  ChevronRight,
  Camera
} from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface MealPost {
  id: string;
  name: string;
  mealTime: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  time: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  images?: string[];
  image?: string;
  foodItems?: any[];
  isMultipleMeals?: boolean;
  meals?: any[];
  originalMealId?: string;
  mealIndex?: number;
}

interface InstagramLikeFeedProps {
  mealData: {
    breakfast: MealPost[];
    lunch: MealPost[];
    dinner: MealPost[];
    snack: MealPost[];
  };
  selectedDate: Date;
  onMealClick?: (mealType: keyof typeof mealData, mealId: string) => void;
}

const mealTimeLabels = {
  breakfast: '朝食',
  lunch: '昼食', 
  dinner: '夕食',
  snack: '間食'
};

const mealTimeEmojis = {
  breakfast: '🌅',
  lunch: '☀️',
  dinner: '🌙',
  snack: '🍪'
};

export function InstagramLikeFeed({ mealData, selectedDate, onMealClick }: InstagramLikeFeedProps) {
  const [currentImageIndexes, setCurrentImageIndexes] = useState<Record<string, number>>({});

  // 複数食事を個別表示用に展開する関数
  const expandMultipleMeals = (meals: MealPost[]) => {
    const expandedMeals: MealPost[] = [];
    
    meals.forEach(meal => {
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
            mealIndex: index // 何番目の食事かを保持
          });
        });
      } else {
        // 単一食事はそのまま追加
        expandedMeals.push(meal);
      }
    });
    
    return expandedMeals;
  };

  // 食事タイプごとに展開した食事データを作成
  const expandedMealData = {
    breakfast: expandMultipleMeals(mealData.breakfast),
    lunch: expandMultipleMeals(mealData.lunch),
    dinner: expandMultipleMeals(mealData.dinner),
    snack: expandMultipleMeals(mealData.snack)
  };

  // 全ての食事を時系列順に並べる（複数食事を展開）
  const allMeals = [
    ...expandedMealData.breakfast.map(meal => ({ ...meal, mealType: 'breakfast' as const })),
    ...expandedMealData.lunch.map(meal => ({ ...meal, mealType: 'lunch' as const })),
    ...expandedMealData.dinner.map(meal => ({ ...meal, mealType: 'dinner' as const })),
    ...expandedMealData.snack.map(meal => ({ ...meal, mealType: 'snack' as const }))
  ].sort((a, b) => a.time.localeCompare(b.time));



  const nextImage = (postId: string, totalImages: number) => {
    setCurrentImageIndexes(prev => ({
      ...prev,
      [postId]: ((prev[postId] || 0) + 1) % totalImages
    }));
  };

  const prevImage = (postId: string, totalImages: number) => {
    setCurrentImageIndexes(prev => ({
      ...prev,
      [postId]: ((prev[postId] || 0) - 1 + totalImages) % totalImages
    }));
  };

  const generateAIAdvice = (meal: MealPost) => {
    const proteinPercentage = ((meal.protein * 4) / meal.calories) * 100;
    const adviceList = [
      proteinPercentage > 25 ? "タンパク質豊富で筋肉サポートに最適！💪" : "タンパク質をもう少し増やしてみましょう",
      meal.calories < 300 ? "軽めの食事ですね。バランスよく栄養を摂りましょう✨" : "しっかりとエネルギーが摂れています！",
      "食物繊維も意識して野菜を取り入れてみてください🥗",
      "水分補給も忘れずに！💧"
    ];
    return adviceList[Math.floor(Math.random() * adviceList.length)];
  };

  if (allMeals.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-slate-500">本日の食事記録はまだありません</p>
        <p className="text-sm text-slate-400 mt-1">食事を記録してみましょう！</p>
      </div>
    );
  }

  // 食事タイプ順に並び替え（朝食→昼食→夕食→間食）
  const mealTypeOrder: Array<keyof typeof mealData> = ['breakfast', 'lunch', 'dinner', 'snack'];
  
  return (
    <div className="space-y-4">
      {mealTypeOrder.map((mealType) => {
        const mealsOfType = expandedMealData[mealType]; // 展開したデータを使用
        if (mealsOfType.length === 0) return null;

        const totalCalories = mealsOfType.reduce((sum, meal) => sum + meal.calories, 0);

        return (
          <div key={mealType} className="p-4 bg-slate-50/50 rounded-lg border border-slate-200">
            {/* 食事タイプヘッダー */}
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-bold text-slate-800">{mealTimeLabels[mealType]}</h4>
            </div>

            {/* 区切り線 */}
            <div className="border-t border-slate-200 mb-4"></div>

            {/* 食事リスト - 個別フレーム */}
            <div className="space-y-3">
              {mealsOfType.map((meal) => {
                const images = meal.images || (meal.image ? [meal.image] : []);
                
                return (
                  <div key={meal.id} className="bg-white rounded-lg border border-slate-200 p-3 shadow-sm">
                    <div 
                      className={`flex items-center cursor-pointer hover:opacity-80 transition-opacity ${images.length > 0 ? 'space-x-3' : ''}`}
                      onClick={() => onMealClick?.(meal.mealTime, meal.id)}
                    >
                      {/* 食事画像 - 画像がある場合のみ表示 */}
                      {images.length > 0 && (
                        <div className="flex-shrink-0">
                          <ImageWithFallback
                            src={images[0]}
                            alt={meal.name}
                            className="w-12 h-12 object-cover rounded-lg border-2 border-white/60"
                          />
                        </div>
                      )}

                      {/* 食事名と件数 */}
                      <div className="flex-1 min-w-0">
                        <h5 className="font-medium text-slate-800 truncate">{meal.name}</h5>
                        <p className="text-xs text-slate-500">1件</p>
                      </div>

                      {/* カロリー・PFC表示 */}
                      <div className="text-right">
                        <div className="text-xl font-bold mb-1" style={{color: '#4A90E2'}}>
                          {meal.calories}kcal
                        </div>
                        <div className="flex space-x-1 justify-end" style={{width: '156px'}}>
                          <Badge className="text-white font-medium text-xs w-10 text-center" style={{backgroundColor: '#EF4444'}}>
                            P {meal.protein || 0}g
                          </Badge>
                          <Badge className="text-white font-medium text-xs w-10 text-center" style={{backgroundColor: '#F59E0B'}}>
                            F {meal.fat || 0}g
                          </Badge>
                          <Badge className="text-white font-medium text-xs w-10 text-center" style={{backgroundColor: '#10B981'}}>
                            C {meal.carbs || 0}g
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 合計表示 */}
            {mealsOfType.length > 0 && (
              <div className="mt-4 pt-3 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <div className="flex space-x-2">
                    <Badge className="text-white font-medium text-xs" style={{backgroundColor: '#EF4444'}}>
                      P {mealsOfType.reduce((sum, meal) => sum + (meal.protein || 0), 0)}g
                    </Badge>
                    <Badge className="text-white font-medium text-xs" style={{backgroundColor: '#F59E0B'}}>
                      F {mealsOfType.reduce((sum, meal) => sum + (meal.fat || 0), 0)}g
                    </Badge>
                    <Badge className="text-white font-medium text-xs" style={{backgroundColor: '#10B981'}}>
                      C {mealsOfType.reduce((sum, meal) => sum + (meal.carbs || 0), 0)}g
                    </Badge>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-bold text-blue-600">
                      {totalCalories}
                    </span>
                    <span className="text-sm text-slate-600 ml-1">kcal</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}