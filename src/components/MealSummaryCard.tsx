import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ChevronRight, Utensils } from 'lucide-react';

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
  mealIndex?: number;
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
  onViewMealDetail: (mealType: keyof MealData, mealId: string) => void;
  onNavigateToMeal: () => void;
}

const mealTimeLabels = {
  breakfast: '朝食',
  lunch: '昼食', 
  dinner: '夕食',
  snack: '間食'
};

const mealTimeIcons = {
  breakfast: '🌅',
  lunch: '☀️', 
  dinner: '🌙',
  snack: '🍪'
};

export function MealSummaryCard({ meals, onAddMeal, onViewMealDetail, onNavigateToMeal }: MealSummaryCardProps) {
  // 各食事の合計カロリー計算
  const getMealCalories = (mealType: keyof MealData) => {
    return meals[mealType].reduce((sum, item) => sum + item.calories, 0);
  };

  // 総カロリー計算
  const totalCalories = Object.values(meals).flat().reduce((sum, meal) => sum + meal.calories, 0);

  return (
    <Card className="backdrop-blur-xl bg-white/95 border border-slate-200/50 rounded-2xl shadow-sm overflow-hidden">
      {/* ヘッダー */}
      <div className="p-3 pb-0">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="font-semibold text-slate-900">今日の食事</h3>
          </div>
          <div className="text-right">
            <div className="font-bold text-health-primary">合計 {totalCalories}</div>
            <div className="text-xs text-slate-500 tracking-wide">kcal</div>
          </div>
        </div>
      </div>

      {/* 食事概要 */}
      <div className="p-3 pt-0">
        <div className="space-y-2">
          {(Object.keys(mealTimeLabels) as Array<keyof MealData>).map(mealType => {
            const mealItems = meals[mealType];
            const calories = getMealCalories(mealType);
            const hasRecords = mealItems.length > 0;

            // 画像がある食事を優先的に取得（表示用）
            const getDisplayMeal = () => {
              if (!hasRecords) return null;
              // 画像がある食事を探す
              const mealWithImage = mealItems.find(meal => meal.images?.[0] || meal.image);
              // 画像がある食事があればそれを、なければ最初の食事を返す
              return mealWithImage || mealItems[0];
            };

            const displayMeal = getDisplayMeal();

            return (
              <button
                key={mealType}
                onClick={() => {
                  console.log('🔥 朝食クリック!', {
                    mealType,
                    hasRecords,
                    mealItems,
                    firstMealId: mealItems[0]?.id,
                    firstMealData: mealItems[0]
                  });
                  
                  if (hasRecords) {
                    // 記録がある場合は最初の食事の詳細を表示（MealDetailModalで全記録を表示）
                    onViewMealDetail(mealType, mealItems[0].id);
                  } else {
                    // 記録がない場合は食事追加モーダルを開く
                    onAddMeal(mealType);
                  }
                }}
                className="w-full p-2.5 bg-white rounded-xl border border-slate-200 hover:bg-blue-50/30 transition-colors duration-200 text-left shadow-sm"
              >
                <div className="flex items-center justify-between">
                  {/* 左側：食事情報 */}
                  <div className="flex-1 min-w-0">
                    {/* 食事名 */}
                    <div className="font-medium text-slate-900 mb-1">{mealTimeLabels[mealType]}</div>
                    
                    {hasRecords ? (
                      <div className="flex items-center space-x-3">
                        {/* 画像を大きく表示 */}
                        {displayMeal && (displayMeal.images?.[0] || displayMeal.image) && (
                          <div className="w-12 h-12 bg-slate-200 rounded-lg overflow-hidden flex-shrink-0">
                            <img
                              src={displayMeal.images?.[0] || displayMeal.image}
                              alt={displayMeal.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        
                        {/* 食べ物名と件数 */}
                        <div className="flex-1 min-w-0">
                          {/* 食べ物名（1つだけ表示） */}
                          <div className="text-sm text-slate-600 truncate">
                            {displayMeal?.name || mealItems[0]?.name}
                          </div>
                          
                          {/* 件数表示 */}
                          {mealItems.length > 1 && (
                            <div className="text-xs text-slate-500 mt-0.5">
                              ({mealItems.length}件)
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-slate-500">未記録</div>
                    )}
                  </div>
                  
                  {/* 右側：カロリー */}
                  <div className="text-right ml-3">
                    {hasRecords ? (
                      <div className="font-bold text-health-primary">{calories}kcal</div>
                    ) : (
                      <div className="text-sm text-slate-400">--kcal</div>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* 詳細ボタン */}
        <Button
          variant="ghost"
          onClick={onNavigateToMeal}
          className="w-full mt-3 text-health-primary hover:bg-health-primary/5 justify-between"
        >
          <span>詳細記録・分析</span>
          <ChevronRight size={16} />
        </Button>
      </div>
    </Card>
  );
}