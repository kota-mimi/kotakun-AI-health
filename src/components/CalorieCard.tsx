import { Card } from './ui/card';
import { Progress } from './ui/progress';
import { Button } from './ui/button';
import { useState, useEffect } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { useProfileHistory, getTargetValuesForDate } from '@/hooks/useProfileHistory';

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
  exerciseData?: Array<{ calories: number; duration: number; type: string }>;
  selectedDate: Date;
}

export function CalorieCard({ totalCalories, targetCalories, pfc, counselingResult, exerciseData = [], selectedDate }: CalorieCardProps) {
  const [currentView, setCurrentView] = useState<'intake' | 'burn'>('intake');
  const [isMounted, setIsMounted] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  // 日付に基づくプロフィールデータを取得
  const { profileData } = useProfileHistory(selectedDate);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // ハイドレーションエラー回避のため、マウント前は0を表示
  const displayTotalCalories = isMounted ? totalCalories : 0;
  const displayPfc = isMounted ? pfc : { protein: 0, fat: 0, carbs: 0, proteinTarget: 0, fatTarget: 0, carbsTarget: 0 };
  
  // 日付に基づいて目標値を取得（プロフィール履歴を優先、なければカウンセリング結果、最後にpropsから）
  const targetValues = getTargetValuesForDate(profileData, counselingResult);
  
  const finalTargetCalories = targetValues.targetCalories;
  const finalProteinTarget = targetValues.macros.protein;
  const finalFatTarget = targetValues.macros.fat;
  const finalCarbsTarget = targetValues.macros.carbs;
  
  
  const intakeProgress = finalTargetCalories > 0 ? Number(((displayTotalCalories / finalTargetCalories) * 100).toFixed(1)) : 0;
  const proteinProgress = finalProteinTarget > 0 ? Number(((displayPfc.protein / finalProteinTarget) * 100).toFixed(1)) : 0;
  const fatProgress = finalFatTarget > 0 ? Number(((displayPfc.fat / finalFatTarget) * 100).toFixed(1)) : 0;
  const carbsProgress = finalCarbsTarget > 0 ? Number(((displayPfc.carbs / finalCarbsTarget) * 100).toFixed(1)) : 0;

  // 消費カロリーデータ（日付ベースのプロフィールデータを優先）
  const basalMetabolismBase = targetValues.bmr || 
    (counselingResult?.aiAnalysis?.nutritionPlan?.dailyCalories 
      ? Math.round(counselingResult.aiAnalysis.nutritionPlan.dailyCalories * 0.7) // フォールバック: 摂取カロリーの70%を基礎代謝とする
      : 0);
  
  // 運動による消費カロリー（実際の運動データから計算）
  const exerciseCalories = exerciseData.reduce((sum, exercise) => sum + (exercise.calories || 0), 0);
  
  const dailyActivityCalories = Math.round(basalMetabolismBase * 0.15); // 基礎代謝の15%を日常活動とする
  const totalActivityCalories = exerciseCalories + dailyActivityCalories;
  const burnedCalories = Math.round(basalMetabolismBase + totalActivityCalories);
  const targetBurnedCalories = counselingResult?.aiAnalysis?.nutritionPlan?.dailyCalories 
    ? Math.round(counselingResult.aiAnalysis.nutritionPlan.dailyCalories * 1.25) // 摂取目標の125%を消費目標とする
    : 0;
  const basalMetabolism = Math.round(basalMetabolismBase);
  
  // 消費カロリーの進捗計算（小数点第1位まで）
  const burnProgress = targetBurnedCalories > 0 ? Number(((burnedCalories / targetBurnedCalories) * 100).toFixed(1)) : 0;
  const basalProgress = burnedCalories > 0 ? Number(((basalMetabolism / burnedCalories) * 100).toFixed(1)) : 0;
  const activityProgress = burnedCalories > 0 ? Number(((totalActivityCalories / burnedCalories) * 100).toFixed(1)) : 0;

  const colors = {
    primary: '#3B82F6',  // 体重グラフと同じブルー
    protein: '#EF4444',  // 赤色（タンパク質）
    fat: '#F97316',     // 体重グラフと同じオレンジ（脂質）
    carbs: '#22C55E',   // 体重グラフと同じグリーン（炭水化物）
    basal: '#22C55E',   // 緑色 - 基礎代謝
    activity: '#F97316', // オレンジ色 - 活動による消費
    burn: '#EA580C'     // 運動記録と同じオレンジ色 - 消費カロリー
  };

  return (
    <Card className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl shadow-sky-400/30 overflow-hidden">
      <Button
        onClick={() => setIsCollapsed(!isCollapsed)}
        variant="ghost"
        className="w-full justify-start p-0 h-auto hover:bg-transparent"
      >
        <div className="flex items-center justify-between w-full px-4 py-3 border-b border-slate-200 hover:bg-slate-50 transition-colors duration-200">
          <div className="flex items-center space-x-2">
            <h3 className="font-semibold text-slate-900">カロリー</h3>
          </div>
          {isCollapsed ? (
            <ChevronDown size={16} className="text-slate-500" />
          ) : (
            <ChevronUp size={16} className="text-slate-500" />
          )}
        </div>
      </Button>

      {!isCollapsed && (
        <div className="space-y-0">
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
                      <span className="font-bold text-health-primary">{displayTotalCalories}</span>
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
                          <span className="font-bold text-nutrition-protein">{displayPfc.protein}g</span>
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
                          <span className="font-bold text-nutrition-fat">{displayPfc.fat}g</span>
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
                          <span className="font-bold text-nutrition-carbs">{displayPfc.carbs}g</span>
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
                      <span className="font-bold" style={{color: colors.burn}}>{burnedCalories}</span>
                      <span className="text-slate-500"> kcal</span>
                    </div>
                  </div>
                  <Progress 
                    value={Math.min(burnProgress, 100)} 
                    className="h-2.5" 
                    color={colors.burn}
                    backgroundColor="rgba(234, 88, 12, 0.1)"
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

                    {/* 運動による消費 */}
                    {exerciseCalories > 0 && (
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 rounded-full" style={{backgroundColor: '#3B82F6'}}></div>
                            <span className="text-sm text-slate-700">運動による消費</span>
                          </div>
                          <span className="text-sm">
                            <span className="font-bold" style={{color: '#3B82F6'}}>{exerciseCalories}</span>
                            <span className="text-slate-500"> kcal</span>
                          </span>
                        </div>
                        <Progress 
                          value={Number(((exerciseCalories / burnedCalories) * 100).toFixed(1))} 
                          className="h-2" 
                          color="#3B82F6"
                          backgroundColor="rgba(59, 130, 246, 0.1)"
                        />
                      </div>
                    )}

                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}