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

            return (
              <button
                key={mealType}
                onClick={() => {
                  if (hasRecords) {
                    // 記録がある場合は最初の食事の詳細を表示
                    onViewMealDetail(mealType, mealItems[0].id);
                  } else {
                    // 記録がない場合は食事追加モーダルを開く
                    onAddMeal(mealType);
                  }
                }}
                className="w-full p-2.5 bg-slate-50/80 rounded-xl border border-slate-100 hover:bg-white transition-colors duration-200 text-left"
              >
                <div className="flex items-center justify-between">
                  {/* 左側：食事情報 */}
                  <div className="flex-1 min-w-0">
                    {/* 食事名 */}
                    <div className="font-medium text-slate-900 mb-1">{mealTimeLabels[mealType]}</div>
                    
                    {hasRecords ? (
                      <div className="flex items-center space-x-2">
                        {/* 食べ物名と画像 */}
                        <div className="flex items-center space-x-2 flex-1 min-w-0">
                          {/* 最初の食事に画像がある場合は表示 */}
                          {mealItems[0] && (() => {
                            const imageUrl = mealItems[0].images?.[0] || mealItems[0].image || 'https://images.unsplash.com/photo-1546554137-f86b9593a222?w=400&h=400&fit=crop';
                            return (
                              <div className="w-6 h-6 bg-slate-200 rounded-lg overflow-hidden flex-shrink-0">
                                <img
                                  src={imageUrl}
                                  alt={mealItems[0].name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            );
                          })()}
                          
                          {/* 食べ物名（最大2つまで表示） */}
                          <div className="text-sm text-slate-600 truncate">
                            {mealItems.slice(0, 2).map(item => item.name).join(', ')}
                            {mealItems.length > 2 && ` 他${mealItems.length - 2}件`}
                          </div>
                        </div>
                        
                        {/* 件数バッジ */}
                        <Badge variant="secondary" className="text-xs bg-slate-100 text-slate-600 flex-shrink-0">
                          {mealItems.length}件
                        </Badge>
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