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
}

export function MealDetailModal({ 
  isOpen, 
  onClose, 
  meal, 
  mealType,
  onEditMeal,
  onAddSimilarMeal
}: MealDetailModalProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isImageViewOpen, setIsImageViewOpen] = useState(false);

  if (!meal) return null;

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

  // AIアドバイスの生成（モック）
  const generateAIAdvice = () => {
    const totalCalories = meal.calories || 0;
    const protein = meal.protein || 0;
    const fat = meal.fat || 0;
    const carbs = meal.carbs || 0;

    const advices = [];

    // カロリーに基づくアドバイス
    if (totalCalories > 800) {
      advices.push("カロリーが高めです。野菜を多めに取り入れてバランスを整えましょう。");
    } else if (totalCalories < 300) {
      advices.push("カロリーが少し低めです。栄養不足にならないよう注意しましょう。");
    }

    // PFCバランスのアドバイス
    const proteinRatio = (protein * 4) / totalCalories;
    const fatRatio = (fat * 9) / totalCalories;
    const carbsRatio = (carbs * 4) / totalCalories;

    if (proteinRatio < 0.15) {
      advices.push("タンパク質をもう少し増やすと良いでしょう。");
    }
    if (fatRatio > 0.35) {
      advices.push("脂質が多めです。調理法を工夫してみましょう。");
    }
    if (carbsRatio < 0.45) {
      advices.push("炭水化物が少なめです。エネルギー源として適量摂取しましょう。");
    }

    // 時間帯に基づくアドバイス
    if (mealType === 'breakfast' && protein < 20) {
      advices.push("朝食では良質なタンパク質を摂取すると一日の代謝が向上します。");
    }
    if (mealType === 'dinner' && carbs > 50) {
      advices.push("夕食の炭水化物は控えめにすると良い睡眠につながります。");
    }

    if (advices.length === 0) {
      advices.push("バランスの良い食事です！このまま継続していきましょう。");
    }

    return advices[0]; // 最初のアドバイスを返す
  };

  const aiAdvice = generateAIAdvice();

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-sm mx-auto max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg">
              <div className="flex items-center space-x-2">
                <Utensils size={20} style={{color: '#4682B4'}} />
                <span>{mealTypeNames[mealType]} の詳細</span>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* 画像表示 */}
            {(meal.images && meal.images.length > 0) ? (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  {meal.images.slice(0, 4).map((img, index) => (
                    <button
                      key={index}
                      onClick={() => handleImageClick(meal.images, index)}
                      className="relative group"
                    >
                      <ImageWithFallback
                        src={img}
                        alt={meal.name}
                        className="w-full h-32 object-cover rounded-lg shadow-md group-hover:opacity-90 transition-opacity"
                      />
                      {meal.images.length > 4 && index === 3 && (
                        <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                          <span className="text-white">+{meal.images.length - 4}</span>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ) : meal.image && (
              <button
                onClick={() => handleImageClick([meal.image], 0)}
                className="w-full"
              >
                <ImageWithFallback
                  src={meal.image}
                  alt={meal.name}
                  className="w-full h-48 object-cover rounded-lg shadow-md"
                />
              </button>
            )}

            {/* 基本情報 */}
            <Card className="p-4 bg-gradient-to-r from-blue-50 to-slate-50 border border-white/30">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-slate-800">{meal.name}</h3>
                  <div className="flex items-center space-x-1">
                    <Clock size={14} className="text-slate-500" />
                    <span className="text-sm text-slate-600">{meal.time}</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-center">
                  <div className="text-center">
                    <span className="text-2xl font-bold" style={{color: '#4682B4'}}>
                      {meal.calories}
                    </span>
                    <span className="text-sm text-slate-600 ml-1">kcal</span>
                  </div>
                </div>

                {/* PFC表示 */}
                {(meal.protein !== undefined || meal.fat !== undefined || meal.carbs !== undefined) && (
                  <div className="flex justify-center space-x-2">
                    {meal.protein !== undefined && (
                      <Badge 
                        className="text-white font-medium"
                        style={{backgroundColor: '#EF4444'}}
                      >
                        P {meal.protein}g
                      </Badge>
                    )}
                    {meal.fat !== undefined && (
                      <Badge 
                        className="text-white font-medium"
                        style={{backgroundColor: '#F59E0B'}}
                      >
                        F {meal.fat}g
                      </Badge>
                    )}
                    {meal.carbs !== undefined && (
                      <Badge 
                        className="text-white font-medium"
                        style={{backgroundColor: '#10B981'}}
                      >
                        C {meal.carbs}g
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </Card>

            {/* 食品詳細 */}
            {meal.foodItems && meal.foodItems.length > 0 && (
              <Card className="p-4">
                <h4 className="font-semibold text-slate-800 mb-3 flex items-center">
                  <Utensils size={16} className="mr-2" style={{color: '#4682B4'}} />
                  含まれる食品
                </h4>
                <div className="space-y-2">
                  {meal.foodItems.map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-slate-50 rounded-lg">
                      <span className="text-sm font-medium">{item.name}</span>
                      <div className="text-xs text-slate-600">
                        {item.calories}kcal • P{item.protein}g F{item.fat}g C{item.carbs}g
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* AIアドバイス */}
            <Card className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200/50">
              <div className="flex items-start space-x-2">
                <div className="flex-shrink-0 mt-0.5">
                  <Sparkles size={18} style={{color: '#8B5CF6'}} className="animate-pulse" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-slate-800 mb-2">AIアドバイス</h4>
                  <p className="text-sm text-slate-700 leading-relaxed">
                    {aiAdvice}
                  </p>
                </div>
              </div>
            </Card>

            {/* メモ */}
            {meal.notes && (
              <Card className="p-4">
                <h4 className="font-semibold text-slate-800 mb-2">メモ</h4>
                <p className="text-sm text-slate-600">{meal.notes}</p>
              </Card>
            )}

            {/* アクションボタン */}
            <div className="grid grid-cols-2 gap-3 pt-2">
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