import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { 
  Clock,
  Coffee,
  Sun,
  Sunset,
  Cookie,
  Camera,
  Zap
} from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface MealTimelineProps {
  mealData: {
    breakfast: any[];
    lunch: any[];
    dinner: any[];
    snack: any[];
  };
  selectedDate: Date;
  onMealClick?: (mealType: string, mealId: string) => void;
}

export function MealTimeline({ mealData, selectedDate, onMealClick }: MealTimelineProps) {
  const getMealIcon = (mealType: string) => {
    switch (mealType) {
      case 'breakfast':
        return <Coffee size={16} className="text-orange-500" />;
      case 'lunch':
        return <Sun size={16} className="text-yellow-500" />;
      case 'dinner':
        return <Sunset size={16} className="text-purple-500" />;
      case 'snack':
        return <Cookie size={16} className="text-pink-500" />;
      default:
        return <Clock size={16} className="text-slate-500" />;
    }
  };

  const getMealLabel = (mealType: string) => {
    switch (mealType) {
      case 'breakfast':
        return '朝食';
      case 'lunch':
        return '昼食';
      case 'dinner':
        return '夕食';
      case 'snack':
        return '間食';
      default:
        return '';
    }
  };

  const getMealTime = (mealType: string) => {
    switch (mealType) {
      case 'breakfast':
        return '7:00 - 9:00';
      case 'lunch':
        return '11:30 - 13:30';
      case 'dinner':
        return '18:00 - 20:00';
      case 'snack':
        return '随時';
      default:
        return '';
    }
  };

  // すべての食事を時系列でソート
  const allMeals = [
    ...mealData.breakfast.map(meal => ({ ...meal, type: 'breakfast' })),
    ...mealData.lunch.map(meal => ({ ...meal, type: 'lunch' })),
    ...mealData.dinner.map(meal => ({ ...meal, type: 'dinner' })),
    ...mealData.snack.map(meal => ({ ...meal, type: 'snack' }))
  ].sort((a, b) => {
    // 時間でソート（簡易的な実装）
    const timeA = a.time ? parseInt(a.time.replace(':', '')) : 0;
    const timeB = b.time ? parseInt(b.time.replace(':', '')) : 0;
    return timeA - timeB;
  });

  const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];

  return (
    <div className="space-y-4">
      {/* サマリー情報 */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm font-medium text-slate-800">
          {selectedDate.toLocaleDateString('ja-JP', { month: 'long', day: 'numeric' })}
        </div>
        <div className="text-xs text-slate-600">
          {allMeals.length}回の食事
        </div>
      </div>

      {/* 食事時間帯別表示 */}
      {mealTypes.map((mealType) => {
        const meals = mealData[mealType as keyof typeof mealData];
        
        return (
          <div key={mealType} className="p-4 bg-white/50 rounded-lg border border-white/30">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                {getMealIcon(mealType)}
                <div>
                  <h4 className="font-medium text-slate-800">{getMealLabel(mealType)}</h4>
                  <p className="text-xs text-slate-500">{getMealTime(mealType)}</p>
                </div>
              </div>
              
              {meals.length > 0 && (
                <Badge 
                  variant="secondary" 
                  className="text-xs"
                  style={{backgroundColor: 'rgba(70, 130, 180, 0.1)', color: '#4682B4'}}
                >
                  {meals.length}品
                </Badge>
              )}
            </div>

            {meals.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3">
                  <Camera size={20} className="text-slate-400" />
                </div>
                <p className="text-sm">食事が記録されていません</p>
              </div>
            ) : (
              <div className="space-y-2">
                {meals.map((meal, index) => (
                  <div key={meal.id} className="w-full">
                    <div 
                      className="flex items-center space-x-3 p-4 bg-white/60 rounded-xl border border-white/40 cursor-pointer hover:bg-white/80 transition-colors"
                      onClick={() => onMealClick?.(mealType, meal.id)}
                    >
                      {/* 食事画像 */}
                      <div className="flex-shrink-0">
                        {meal.images && meal.images.length > 0 ? (
                          <ImageWithFallback
                            src={meal.images[0]}
                            alt={meal.name}
                            className="w-12 h-12 object-cover rounded-full border-2 border-white/60"
                          />
                        ) : meal.image ? (
                          <ImageWithFallback
                            src={meal.image}
                            alt={meal.name}
                            className="w-12 h-12 object-cover rounded-full border-2 border-white/60"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gradient-to-br from-slate-200 to-slate-300 rounded-full border-2 border-white/60 flex items-center justify-center">
                            <Camera size={16} className="text-slate-500" />
                          </div>
                        )}
                      </div>

                      {/* 食事名と件数 */}
                      <div className="flex-1 min-w-0">
                        <h5 className="font-medium text-slate-800 truncate">{meal.name}</h5>
                        <p className="text-xs text-slate-500">1件</p>
                      </div>

                      {/* カロリー表示 */}
                      <div className="text-right">
                        <div className="text-xl font-bold" style={{color: '#4A90E2'}}>
                          {meal.calories}kcal
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* サマリー */}
      <div className="p-4 bg-white/50 rounded-lg border border-white/30">
        <h4 className="font-medium text-slate-800 mb-3">今日のサマリー</h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-lg font-semibold text-slate-800">
              {allMeals.reduce((sum, meal) => sum + meal.calories, 0)}
            </div>
            <div className="text-xs text-slate-600">総カロリー</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-slate-800">
              {allMeals.length}
            </div>
            <div className="text-xs text-slate-600">食事回数</div>
          </div>
        </div>
        
        {allMeals.length > 0 && (
          <div className="mt-4 p-3 bg-white/30 rounded-lg">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600">最初の食事</span>
              <span className="font-medium text-slate-800">{allMeals[0]?.time}</span>
            </div>
            <div className="flex items-center justify-between text-xs mt-1">
              <span className="text-slate-600">最後の食事</span>
              <span className="font-medium text-slate-800">{allMeals[allMeals.length - 1]?.time}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}