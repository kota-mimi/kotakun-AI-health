import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Plus, Edit2, ChevronLeft, ChevronRight, Utensils, ChevronRight as ChevronRightIcon } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { ImageViewModal } from './ImageViewModal';
import { useState } from 'react';

interface FoodItem {
  id: string;
  name: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
}

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
  foodItems?: FoodItem[];
  // 複数食事対応
  isMultipleMeals?: boolean;
  meals?: Array<{
    name: string;
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
  }>;
}

interface MealData {
  breakfast: MealItem[];
  lunch: MealItem[];
  dinner: MealItem[];
  snack: MealItem[];
}

interface MealRecordProps {
  meals: MealData;
  onAddMeal: (mealType: keyof MealData) => void;
  onEditMeal: (mealType: keyof MealData, mealId: string) => void;
  onViewMealDetail?: (mealType: keyof MealData, mealId: string) => void;
}

const mealTimeLabels = {
  breakfast: '朝食',
  lunch: '昼食', 
  dinner: '夕食',
  snack: '間食'
};



export function MealRecord({ meals, onAddMeal, onEditMeal, onViewMealDetail }: MealRecordProps) {
  const [imageModalState, setImageModalState] = useState<{
    isOpen: boolean;
    images: string[];
    initialIndex: number;
    mealName: string;
  }>({
    isOpen: false,
    images: [],
    initialIndex: 0,
    mealName: ''
  });
  const [currentImageIndexes, setCurrentImageIndexes] = useState<Record<string, number>>({});

  const handleImageClick = (images: string[], index: number, mealName: string) => {
    setImageModalState({
      isOpen: true,
      images,
      initialIndex: index,
      mealName
    });
  };

  const closeImageModal = () => {
    setImageModalState(prev => ({ ...prev, isOpen: false }));
  };

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

  const generateAIAdvice = (meal: MealItem) => {
    const proteinPercentage = meal.protein ? ((meal.protein * 4) / meal.calories) * 100 : 0;
    const adviceList = [
      proteinPercentage > 25 ? "タンパク質豊富で筋肉サポートに最適" : "タンパク質をもう少し増やしてみましょう",
      meal.calories < 300 ? "軽めの食事ですね。バランスよく栄養を摂りましょう" : "しっかりとエネルギーが摂れています",
      "食物繊維も意識して野菜を取り入れてみてください",
      "水分補給も忘れずに"
    ];
    return adviceList[Math.floor(Math.random() * adviceList.length)];
  };

  // 合計カロリー計算
  const totalDailyCalories = Object.values(meals).flat().reduce((sum, meal) => sum + meal.calories, 0);

  const renderMealSection = (mealType: keyof MealData) => {
    const mealItems = meals[mealType];
    const totalCalories = mealItems.reduce((sum, item) => sum + item.calories, 0);

    return (
      <Card className="backdrop-blur-xl bg-white/95 border border-slate-200/50 rounded-2xl shadow-sm overflow-hidden h-full">
        {/* ヘッダー */}
        <div className="p-3 pb-0">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="font-semibold text-slate-900">{mealTimeLabels[mealType]}</h3>
              {mealItems.length > 0 && (
                <div className="flex items-center space-x-2 mt-1">
                  <Badge variant="secondary" className="text-xs bg-slate-100 text-slate-600">
                    {mealItems.length}件
                  </Badge>
                  <span className="text-xs font-medium text-health-primary">{totalCalories}kcal</span>
                </div>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onAddMeal(mealType)}
              className="w-8 h-8 p-0 text-health-primary hover:text-health-primary-dark hover:bg-health-primary/10 rounded-lg"
            >
              <Plus size={16} />
            </Button>
          </div>
        </div>

        {/* コンテンツ */}
        <div className="p-3 pt-0">
          {mealItems.length === 0 ? (
            <div className="text-center py-6">
              <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-2">
                <Utensils size={18} className="text-slate-400" />
              </div>
              <p className="text-sm text-slate-500 mb-3">まだ記録がありません</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onAddMeal(mealType)}
                className="border-health-primary/30 text-health-primary hover:bg-health-primary/5"
              >
                <Plus size={14} className="mr-1" />
                記録する
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {mealItems.map((item) => {
                const images = item.images || (item.image ? [item.image] : []);
                const currentImageIndex = currentImageIndexes[item.id] || 0;

                return (
                  <div 
                    key={item.id} 
                    className="relative p-3 bg-slate-50/80 rounded-xl border border-slate-100 hover:bg-white transition-colors duration-200 group"
                  >
                    {/* ヘッダー */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-slate-500 bg-white px-2 py-1 rounded-lg">{item.time}</span>
                        <span className="font-medium text-slate-900 truncate">{item.name}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEditMeal(mealType, item.id)}
                        className="opacity-0 group-hover:opacity-100 w-7 h-7 p-0 text-slate-400 hover:text-slate-600 transition-opacity"
                      >
                        <Edit2 size={12} />
                      </Button>
                    </div>

                    {/* メインコンテンツ */}
                    <div className="flex items-start space-x-3 mb-2">
                      {/* 写真 */}
                      {images.length > 0 && (
                        <div className="relative w-16 h-16 bg-slate-200 rounded-xl overflow-hidden flex-shrink-0">
                          <ImageWithFallback
                            src={images[currentImageIndex]}
                            alt={item.name}
                            className="w-full h-full object-cover cursor-pointer"
                            onClick={() => onViewMealDetail && onViewMealDetail(mealType, item.id)}
                          />
                          
                          {/* 複数画像ナビゲーション */}
                          {images.length > 1 && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="absolute left-1 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-sm p-0"
                                onClick={() => prevImage(item.id, images.length)}
                              >
                                <ChevronLeft size={8} className="text-white" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="absolute right-1 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-sm p-0"
                                onClick={() => nextImage(item.id, images.length)}
                              >
                                <ChevronRight size={8} className="text-white" />
                              </Button>
                              
                              {/* インジケーター */}
                              <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex space-x-1">
                                {images.map((_, index) => (
                                  <div
                                    key={index}
                                    className={`w-1 h-1 rounded-full ${
                                      index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                                    }`}
                                  />
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      )}

                      {/* 栄養情報 */}
                      <div className="flex-1 space-y-2">
                        {/* 複数食事の場合は個別表示 */}
                        {(() => {
                          console.log('🔍 MealRecord rendering item:', item.id, 'isMultipleMeals:', item.isMultipleMeals, 'meals:', item.meals);
                          return null;
                        })()}
                        {item.isMultipleMeals && item.meals ? (
                          <div className="space-y-2">
                            {item.meals.map((meal, index) => (
                              <div key={index} className="border-l-2 border-slate-200 pl-2">
                                <div className="flex justify-between items-center">
                                  <span className="text-xs font-medium text-slate-700">{meal.name}</span>
                                  <span className="text-xs font-bold text-health-primary">{meal.calories}kcal</span>
                                </div>
                                <div className="flex gap-1 mt-1">
                                  <Badge className="bg-nutrition-protein/10 text-nutrition-protein border-0 text-xs px-1 py-0">
                                    P: {meal.protein}g
                                  </Badge>
                                  <Badge className="bg-nutrition-fat/10 text-nutrition-fat border-0 text-xs px-1 py-0">
                                    F: {meal.fat}g
                                  </Badge>
                                  <Badge className="bg-nutrition-carbs/10 text-nutrition-carbs border-0 text-xs px-1 py-0">
                                    C: {meal.carbs}g
                                  </Badge>
                                </div>
                              </div>
                            ))}
                            {/* 合計表示 */}
                            <div className="pt-2 border-t border-slate-200">
                              <div className="flex justify-between items-center">
                                <span className="text-sm font-bold text-slate-800">合計</span>
                                <span className="font-bold text-health-primary">{item.calories}kcal</span>
                              </div>
                              <div className="flex gap-1 mt-1">
                                <Badge className="bg-nutrition-protein/20 text-nutrition-protein border-0 text-xs px-2 py-0.5 font-bold">
                                  P: {item.protein}g
                                </Badge>
                                <Badge className="bg-nutrition-fat/20 text-nutrition-fat border-0 text-xs px-2 py-0.5 font-bold">
                                  F: {item.fat}g
                                </Badge>
                                <Badge className="bg-nutrition-carbs/20 text-nutrition-carbs border-0 text-xs px-2 py-0.5 font-bold">
                                  C: {item.carbs}g
                                </Badge>
                              </div>
                            </div>
                          </div>
                        ) : (
                          /* 単一食事の場合（既存のロジック） */
                          <>
                            <div className="font-bold text-health-primary">{item.calories}kcal</div>
                            <div className="flex items-center flex-wrap gap-1">
                              {item.protein !== undefined && (
                                <Badge className="bg-nutrition-protein/10 text-nutrition-protein border-0 text-xs px-2 py-0.5">
                                  P: {item.protein}g
                                </Badge>
                              )}
                              {item.fat !== undefined && (
                                <Badge className="bg-nutrition-fat/10 text-nutrition-fat border-0 text-xs px-2 py-0.5">
                                  F: {item.fat}g
                                </Badge>
                              )}
                              {item.carbs !== undefined && (
                                <Badge className="bg-nutrition-carbs/10 text-nutrition-carbs border-0 text-xs px-2 py-0.5">
                                  C: {item.carbs}g
                                </Badge>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* AIアドバイス */}
                    <div className="p-2.5 bg-white/80 rounded-lg border border-slate-100">
                      <p className="text-xs text-slate-600 leading-relaxed">
                        <span className="font-medium text-health-primary">AI：</span>
                        {generateAIAdvice(item)}
                      </p>
                    </div>

                    {/* タップエリア */}
                    <button 
                      className="absolute inset-0 w-full h-full"
                      onClick={() => onViewMealDetail && onViewMealDetail(mealType, item.id)}
                    >
                      <span className="sr-only">食事詳細を表示</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Card>
    );
  };

  return (
    <Card className="backdrop-blur-xl bg-white/95 border border-slate-200/50 rounded-2xl shadow-sm overflow-hidden">
      {/* ヘッダー */}
      <div className="p-3 pb-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">

            <div>
              <h3 className="font-semibold text-slate-900">食事記録</h3>

            </div>
          </div>
          <div className="text-right">
            <div className="font-bold text-health-primary">{totalDailyCalories}</div>
            <div className="text-xs text-slate-500 uppercase tracking-wide">kcal</div>
          </div>
        </div>
      </div>

      {/* 食事タイムライン - 横スクロール */}
      <div className="px-3 pb-3">
        <div className="flex space-x-3 overflow-x-auto scrollbar-hide pb-2">
          {(Object.keys(mealTimeLabels) as Array<keyof MealData>).map(mealType => (
            <div key={mealType} className="flex-shrink-0 w-72">
              {renderMealSection(mealType)}
            </div>
          ))}
        </div>
      </div>
      
      {/* 画像拡大モーダル */}
      <ImageViewModal
        isOpen={imageModalState.isOpen}
        onClose={closeImageModal}
        images={imageModalState.images}
        initialIndex={imageModalState.initialIndex}
        mealName={imageModalState.mealName}
      />
    </Card>
  );
}