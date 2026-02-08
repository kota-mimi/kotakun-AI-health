import { Progress } from './ui/progress';
import { useState, useEffect } from 'react';
import { getTargetValuesForDate } from '@/hooks/useProfileHistory';

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
  selectedDate: Date;
  profileData?: any; // 🔄 統合プロフィールから受け取り
}

export function CalorieCard({ totalCalories, targetCalories, pfc, counselingResult, selectedDate, profileData }: CalorieCardProps) {
  const [isMounted, setIsMounted] = useState(false);
  
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


  const colors = {
    primary: '#3B82F6',  // 体重グラフと同じブルー
    protein: '#EF4444',  // 赤色（タンパク質）
    fat: '#F97316',     // 体重グラフと同じオレンジ（脂質）
    carbs: '#22C55E',   // 体重グラフと同じグリーン（炭水化物）
    basal: '#22C55E',   // 緑色 - 基礎代謝
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 space-y-0">
      {/* タイトル */}
      <div className="p-3 pb-0">
        <h3 className="text-lg font-medium text-slate-900">摂取カロリー</h3>
      </div>

      {/* コンテンツエリア */}
      <div className="p-3 pt-3">
        
        <div className="space-y-4">
                {/* 摂取カロリー */}
                <div>
                  <div className="flex items-center justify-end mb-2">
                    <div className="text-right">
                      <span className="font-bold text-health-primary text-xl">{displayTotalCalories}</span>
                      <span className="text-sm text-slate-400"> / {finalTargetCalories}kcal</span>
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
                  
                  {/* 3列グリッドレイアウト */}
                  <div className="grid grid-cols-3 gap-3">
                    {/* タンパク質 */}
                    <div className="text-center">
                      <div className="text-xs text-slate-600 mb-1">タンパク質</div>
                      <div className="text-lg font-bold mb-2">
                        <span className="text-nutrition-protein">{displayPfc.protein}</span>
                        <span className="text-xs text-slate-400">/{finalProteinTarget}g</span>
                      </div>
                      <Progress 
                        value={Math.min(proteinProgress, 100)} 
                        className="h-2.5" 
                        color={colors.protein}
                        backgroundColor="rgba(239, 68, 68, 0.1)"
                      />
                    </div>

                    {/* 炭水化物 */}
                    <div className="text-center">
                      <div className="text-xs text-slate-600 mb-1">炭水化物</div>
                      <div className="text-lg font-bold mb-2">
                        <span className="text-nutrition-carbs">{displayPfc.carbs}</span>
                        <span className="text-xs text-slate-400">/{finalCarbsTarget}g</span>
                      </div>
                      <Progress 
                        value={Math.min(carbsProgress, 100)} 
                        className="h-2.5" 
                        color={colors.carbs}
                        backgroundColor="rgba(16, 185, 129, 0.1)"
                      />
                    </div>

                    {/* 脂質 */}
                    <div className="text-center">
                      <div className="text-xs text-slate-600 mb-1">脂質</div>
                      <div className="text-lg font-bold mb-2">
                        <span className="text-nutrition-fat">{displayPfc.fat}</span>
                        <span className="text-xs text-slate-400">/{finalFatTarget}g</span>
                      </div>
                      <Progress 
                        value={Math.min(fatProgress, 100)} 
                        className="h-2.5" 
                        color={colors.fat}
                        backgroundColor="rgba(245, 158, 11, 0.1)"
                      />
                    </div>
                  </div>
                </div>
        </div>
      </div>
    </div>
  );
}