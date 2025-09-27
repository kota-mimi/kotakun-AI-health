import { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

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
    <div className="space-y-3">
      {mealTypeOrder.map((mealType) => {
        const mealsOfType = mealData[mealType];
        if (mealsOfType.length === 0) return null;

        const totalCalories = mealsOfType.reduce((sum, meal) => sum + meal.calories, 0);

        return (
          <div key={mealType} className="space-y-2">
            {mealsOfType.map((meal, index) => {
              const images = meal.images || (meal.image ? [meal.image] : []);
              const currentImageIndex = currentImageIndexes[meal.id] || 0;

              return (
                <Card key={meal.id} className="backdrop-blur-xl bg-white/90 shadow-lg border-0 rounded-xl overflow-hidden">
                  <div className="p-3">
                    {/* 食事タイプごとのヘッダー（最初の食事のみ） */}
                    {index === 0 && (
                      <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
                        <h3 className="font-semibold text-slate-800">{mealTimeLabels[mealType]}</h3>
                        <span className="font-semibold" style={{color: '#4682B4'}}>
                          {totalCalories}kcal
                        </span>
                      </div>
                    )}
                {/* 上部: 食事名と時間のみ */}
                <div className="flex items-center justify-between mb-3">
                  <span className="font-semibold text-slate-800 truncate flex-1 min-w-0">{meal.name}</span>
                  <span className="text-xs text-slate-500 flex-shrink-0">{meal.time}</span>
                </div>

              {/* 中央: 写真と栄養情報を横並び */}
              <div className="flex items-start space-x-3 mb-3">
                {/* 写真エリア - 正方形でもう少し大きく */}
                {images.length > 0 && (
                  <div className="relative w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg overflow-hidden flex-shrink-0">
                    <img
                      src={images[currentImageIndex]}
                      alt={meal.name}
                      className="w-full h-full object-cover cursor-pointer"
                      onClick={() => onMealClick && onMealClick(meal.mealType, meal.id)}
                    />
                    
                    {/* 複数画像の場合のナビゲーション */}
                    {images.length > 1 && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute left-1 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-black/30 hover:bg-black/50 backdrop-blur-sm p-0"
                          onClick={() => prevImage(meal.id, images.length)}
                        >
                          <ChevronLeft size={10} className="text-white" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute right-1 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-black/30 hover:bg-black/50 backdrop-blur-sm p-0"
                          onClick={() => nextImage(meal.id, images.length)}
                        >
                          <ChevronRight size={10} className="text-white" />
                        </Button>
                        
                        {/* 画像インジケーター */}
                        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex space-x-0.5">
                          {images.map((_, index) => (
                            <div
                              key={index}
                              className={`w-1.5 h-1.5 rounded-full ${
                                index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                              }`}
                            />
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* 栄養情報 - 写真の横（カロリー除く） */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center flex-wrap gap-1.5">
                    <Badge variant="secondary" className="bg-red-100 text-red-700 border-0 text-xs px-1.5 py-0.5">
                      P: {meal.protein}g
                    </Badge>
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 border-0 text-xs px-1.5 py-0.5">
                      F: {meal.fat}g
                    </Badge>
                    <Badge variant="secondary" className="bg-green-100 text-green-700 border-0 text-xs px-1.5 py-0.5">
                      C: {meal.carbs}g
                    </Badge>
                  </div>
                </div>
              </div>

              {/* 下部: AIアドバイス */}
              <p className="text-xs text-slate-600 leading-relaxed mb-2">
                <span className="font-medium text-blue-600">AI：</span>
                {generateAIAdvice(meal)}
              </p>

              {/* フード項目 - コンパクト */}
              {meal.foodItems && meal.foodItems.length > 0 && (
                <div className="border-t border-slate-100 pt-2 mt-3">
                  <div className="space-y-0.5">
                    {meal.foodItems.slice(0, 2).map((item, index) => (
                      <p key={index} className="text-xs text-slate-600">
                        • {item.name} ({item.calories}kcal)
                      </p>
                    ))}
                    {meal.foodItems.length > 2 && (
                      <Button 
                        variant="ghost" 
                        className="h-auto p-0 text-xs text-blue-600 hover:bg-transparent"
                        onClick={() => onMealClick && onMealClick(meal.mealType, meal.id)}
                      >
                        他{meal.foodItems.length - 2}件を見る...
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </Card>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}