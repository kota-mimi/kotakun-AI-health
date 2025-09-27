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

  // 全ての食事を�����系列順に並べる
  const allMeals = [
    ...mealData.breakfast.map(meal => ({ ...meal, mealType: 'breakfast' as const })),
    ...mealData.lunch.map(meal => ({ ...meal, mealType: 'lunch' as const })),
    ...mealData.dinner.map(meal => ({ ...meal, mealType: 'dinner' as const })),
    ...mealData.snack.map(meal => ({ ...meal, mealType: 'snack' as const }))
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
        const mealsOfType = mealData[mealType];
        if (mealsOfType.length === 0) return null;

        const totalCalories = mealsOfType.reduce((sum, meal) => sum + meal.calories, 0);

        return (
          <div key={mealType} className="p-4 bg-white/50 rounded-lg border border-white/30">
            {/* 食事タイプヘッダー */}
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium text-slate-800">{mealTimeLabels[mealType]}</h4>
              {mealsOfType.length > 0 && (
                <Badge 
                  variant="secondary" 
                  className="text-xs"
                  style={{backgroundColor: 'rgba(70, 130, 180, 0.1)', color: '#4682B4'}}
                >
                  {totalCalories}kcal
                </Badge>
              )}
            </div>

            {/* 食事リスト - スクリーンショット風レイアウト */}
            <div className="space-y-2">
              {mealsOfType.map((meal) => {
                const images = meal.images || (meal.image ? [meal.image] : []);
                
                return (
                  <div key={meal.id} className="w-full">
                    <div 
                      className="flex items-center space-x-3 p-4 bg-white/60 rounded-xl border border-white/40 cursor-pointer hover:bg-white/80 transition-colors"
                      onClick={() => onMealClick?.(meal.mealTime, meal.id)}
                    >
                      {/* 食事画像 */}
                      <div className="flex-shrink-0">
                        {images.length > 0 ? (
                          <ImageWithFallback
                            src={images[0]}
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
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}