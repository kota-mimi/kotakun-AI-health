import { Card } from './ui/card';
import { Progress } from './ui/progress';
import { useState } from 'react';

interface PFCData {
  protein: number;
  fat: number;
  carbs: number;
  proteinTarget: number;
  fatTarget: number;
  carbsTarget: number;
}

interface CounselingResult {
  aiAnalysis: {
    nutritionPlan: {
      dailyCalories: number;
      macros: {
        protein: number;
        carbs: number;
        fat: number;
      };
    };
  };
}

interface CalorieCardProps {
  totalCalories: number;
  targetCalories: number;
  pfc: PFCData;
  counselingResult?: CounselingResult | null;
}

export function CalorieCard({ totalCalories, targetCalories, pfc, counselingResult }: CalorieCardProps) {
  const [currentView, setCurrentView] = useState<'intake' | 'burn'>('intake');
  
  // カウンセリング結果があればそれを優先、なければ既存データを使用
  const finalTargetCalories = counselingResult?.aiAnalysis?.nutritionPlan?.dailyCalories || targetCalories;
  const finalProteinTarget = counselingResult?.aiAnalysis?.nutritionPlan?.macros?.protein || pfc.proteinTarget;
  const finalFatTarget = counselingResult?.aiAnalysis?.nutritionPlan?.macros?.fat || pfc.fatTarget;
  const finalCarbsTarget = counselingResult?.aiAnalysis?.nutritionPlan?.macros?.carbs || pfc.carbsTarget;
  
  const intakeProgress = (totalCalories / finalTargetCalories) * 100;
  const proteinProgress = (pfc.protein / finalProteinTarget) * 100;
  const fatProgress = (pfc.fat / finalFatTarget) * 100;
  const carbsProgress = (pfc.carbs / finalCarbsTarget) * 100;

  // 消費カロリーデータ（カウンセリング結果に基づく動的計算）
  const basalMetabolismBase = counselingResult?.aiAnalysis?.nutritionPlan?.dailyCalories 
    ? Math.round(counselingResult.aiAnalysis.nutritionPlan.dailyCalories * 0.7) // 摂取カロリーの70%を基礎代謝とする
    : 0;
  const exerciseCalories = 0; // 運動による消費（実際の運動データから計算するまでは0）
  const dailyActivityCalories = Math.round(basalMetabolismBase * 0.15); // 基礎代謝の15%を日常活動とする
  const totalActivityCalories = exerciseCalories + dailyActivityCalories;
  const burnedCalories = basalMetabolismBase + totalActivityCalories;
  const targetBurnedCalories = counselingResult?.aiAnalysis?.nutritionPlan?.dailyCalories 
    ? Math.round(counselingResult.aiAnalysis.nutritionPlan.dailyCalories * 1.25) // 摂取目標の125%を消費目標とする
    : 0;
  const basalMetabolism = basalMetabolismBase;
  
  // 消費カロリーの進捗計算
  const burnProgress = (burnedCalories / targetBurnedCalories) * 100;
  const basalProgress = (basalMetabolism / burnedCalories) * 100;
  const activityProgress = (totalActivityCalories / burnedCalories) * 100;

  const colors = {
    primary: '#4682B4',
    protein: '#EF4444',
    fat: '#F59E0B', 
    carbs: '#10B981',
    basal: '#10B981',    // 緑色 - 基礎代謝
    activity: '#F59E0B'  // オレンジ色 - 活動による消費
  };

  return (
    <Card className="backdrop-blur-xl bg-white/95 border border-slate-200/50 rounded-2xl shadow-sm overflow-hidden">
      {/* セグメントコントロール - iOS風 */}
      <div className="p-4 pb-0">
        <div className="bg-slate-100/80 rounded-xl p-1 flex">
          <button
            onClick={() => setCurrentView('intake')}
            className={`flex-1 py-2.5 px-4 rounded-lg font-medium text-sm transition-all duration-200 flex items-center justify-center ${
              currentView === 'intake'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            <span>摂取カロリー</span>
          </button>
          <button
            onClick={() => setCurrentView('burn')}
            className={`flex-1 py-2.5 px-4 rounded-lg font-medium text-sm transition-all duration-200 flex items-center justify-center ${
              currentView === 'burn'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            <span>消費カロリー</span>
          </button>
        </div>
      </div>

      {/* コンテンツエリア */}
      <div className="p-4 pt-4">
        {currentView === 'intake' ? (
          <div className="space-y-5">
            {/* 摂取カロリー */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="font-medium text-slate-900">摂取カロリー</span>
                <div className="text-right">
                  <span className="font-bold text-health-primary">{totalCalories}</span>
                  <span className="text-slate-500"> / {finalTargetCalories}kcal</span>
                </div>
              </div>
              <Progress 
                value={Math.min(intakeProgress, 100)} 
                className="h-2.5" 
                color={colors.primary}
                backgroundColor="rgba(70, 130, 180, 0.1)"
              />
            </div>

            {/* PFCバランス */}
            <div className="space-y-4">
              <h4 className="font-medium text-slate-900">PFCバランス</h4>
              
              <div className="space-y-3">
                {/* タンパク質 */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full bg-nutrition-protein"></div>
                      <span className="text-sm text-slate-700">タンパク質</span>
                    </div>
                    <span className="text-sm">
                      <span className="font-bold text-nutrition-protein">{pfc.protein}g</span>
                      <span className="text-slate-500"> / {finalProteinTarget}g</span>
                    </span>
                  </div>
                  <Progress 
                    value={Math.min(proteinProgress, 100)} 
                    className="h-2" 
                    color={colors.protein}
                    backgroundColor="rgba(239, 68, 68, 0.1)"
                  />
                </div>

                {/* 脂質 */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full bg-nutrition-fat"></div>
                      <span className="text-sm text-slate-700">脂質</span>
                    </div>
                    <span className="text-sm">
                      <span className="font-bold text-nutrition-fat">{pfc.fat}g</span>
                      <span className="text-slate-500"> / {finalFatTarget}g</span>
                    </span>
                  </div>
                  <Progress 
                    value={Math.min(fatProgress, 100)} 
                    className="h-2" 
                    color={colors.fat}
                    backgroundColor="rgba(245, 158, 11, 0.1)"
                  />
                </div>

                {/* 炭水化物 */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full bg-nutrition-carbs"></div>
                      <span className="text-sm text-slate-700">炭水化物</span>
                    </div>
                    <span className="text-sm">
                      <span className="font-bold text-nutrition-carbs">{pfc.carbs}g</span>
                      <span className="text-slate-500"> / {finalCarbsTarget}g</span>
                    </span>
                  </div>
                  <Progress 
                    value={Math.min(carbsProgress, 100)} 
                    className="h-2" 
                    color={colors.carbs}
                    backgroundColor="rgba(16, 185, 129, 0.1)"
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {/* 消費カロリー */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="font-medium text-slate-900">消費カロリー</span>
                <div className="text-right">
                  <span className="font-bold text-health-primary">{burnedCalories}</span>
                  <span className="text-slate-500"> kcal</span>
                </div>
              </div>
              <Progress 
                value={Math.min(burnProgress, 100)} 
                className="h-2.5" 
                color={colors.primary}
                backgroundColor="rgba(70, 130, 180, 0.1)"
              />
            </div>

            {/* 消費内訳 */}
            <div className="space-y-4">
              <h4 className="font-medium text-slate-900">内訳</h4>
              
              <div className="space-y-3">
                {/* 基礎代謝 */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full" style={{backgroundColor: colors.basal}}></div>
                      <span className="text-sm text-slate-700">基礎代謝</span>
                    </div>
                    <span className="text-sm">
                      <span className="font-bold" style={{color: colors.basal}}>{basalMetabolism}</span>
                      <span className="text-slate-500"> kcal</span>
                    </span>
                  </div>
                  <Progress 
                    value={basalProgress} 
                    className="h-2" 
                    color={colors.basal}
                    backgroundColor="rgba(16, 185, 129, 0.1)"
                  />
                </div>

                {/* 活動による消費 */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full" style={{backgroundColor: colors.activity}}></div>
                      <span className="text-sm text-slate-700">活動による消費</span>
                    </div>
                    <span className="text-sm">
                      <span className="font-bold" style={{color: colors.activity}}>{totalActivityCalories}</span>
                      <span className="text-slate-500"> kcal</span>
                    </span>
                  </div>
                  <Progress 
                    value={activityProgress} 
                    className="h-2" 
                    color={colors.activity}
                    backgroundColor="rgba(245, 158, 11, 0.1)"
                  />
                </div>
              </div>


            </div>
          </div>
        )}
      </div>
    </Card>
  );
}