import React from 'react';
import { Card } from './ui/card';

interface WeightData {
  current: number;
  previous: number;
  target: number;
}

interface CounselingResult {
  answers: {
    weight: number;
    targetWeight: number;
  };
  firstCompletedAt?: any;
  completedAt?: any;
  createdAt?: any;
}

interface WeightCardProps {
  data: WeightData;
  onNavigateToWeight?: () => void;
  counselingResult?: CounselingResult | null;
  selectedDate?: Date;
}

export function WeightCard({ data, onNavigateToWeight, counselingResult, selectedDate }: WeightCardProps) {
  // データが記録されているかチェック
  const hasData = data.current > 0;
  
  // アプリ開始日を取得
  const getAppStartDate = () => {
    if (!counselingResult) return null;
    const counselingDateRaw = counselingResult.firstCompletedAt || 
                             counselingResult.createdAt || 
                             counselingResult.completedAt;
    return counselingDateRaw ? new Date(counselingDateRaw) : null;
  };
  
  // 選択日がアプリ開始日かチェック
  const isAppStartDay = (checkDate?: Date) => {
    const appStartDate = getAppStartDate();
    if (!appStartDate) return false;
    const targetDate = checkDate || new Date();
    return targetDate.toDateString() === appStartDate.toDateString();
  };
  
  // 今日またはカウンセリング日のみフォールバックを使用
  const isToday = selectedDate ? selectedDate.toDateString() === new Date().toDateString() : true;
  const isAppStartDaySelected = isAppStartDay(selectedDate);
  const shouldUseFallback = isToday || isAppStartDaySelected;
  
  // 実際の記録データを優先、条件付きでカウンセリング結果をフォールバック
  const currentWeight = hasData ? data.current : (shouldUseFallback && counselingResult?.answers?.weight ? counselingResult.answers.weight : 0);
  const difference = hasData ? (currentWeight - data.previous) : 0;
  // ユーザーが変更した最新の目標体重を優先、未設定ならカウンセリング結果を使用
  const targetWeight = data.target || counselingResult?.answers?.targetWeight;
  // 目標体重が設定されているかチェック（0より大きい値、かつ健康維持モードでない）
  const isMaintenanceMode = counselingResult?.answers?.primaryGoal === 'maintenance';
  const hasTargetWeight = targetWeight && targetWeight > 0 && !isMaintenanceMode;
  const remaining = hasData && hasTargetWeight ? Math.abs(currentWeight - targetWeight) : (shouldUseFallback && counselingResult?.answers?.weight && counselingResult?.answers?.targetWeight && !isMaintenanceMode ? Math.abs(counselingResult.answers.weight - counselingResult.answers.targetWeight) : 0);
  
  // 記録があるか、条件付きでカウンセリング結果がある場合は表示
  const shouldShowWeight = hasData || (shouldUseFallback && counselingResult?.answers?.weight && counselingResult.answers.weight > 0);
  
  // 前日比を表示するかチェック（アプリ開始日や未記録日は「--」）
  const shouldShowDifference = hasData && data.previous > 0 && !isAppStartDay(selectedDate);
  const isDecrease = difference < 0;

  return (
    <Card className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl shadow-sky-400/30 overflow-hidden">
      <div className="p-3">
        <div className="grid grid-cols-3 gap-2">
          {/* 現在の体重 */}
          <div 
            className="text-center p-3 bg-gradient-to-br from-slate-50 to-slate-100/80 rounded-xl border border-slate-200/50 cursor-pointer hover:shadow-sm transition-shadow"
            onClick={onNavigateToWeight}
          >
            <div className="text-xs font-medium text-slate-500 mb-1 uppercase tracking-wide">現在</div>
            <div className="text-lg font-bold text-slate-900">
              {shouldShowWeight ? (currentWeight % 1 === 0 ? currentWeight.toString() : currentWeight.toFixed(1)) : '--'}
              {shouldShowWeight && <span className="text-sm font-medium text-slate-600 ml-1">kg</span>}
            </div>
          </div>
          
          {/* 前日比 */}
          <div 
            className="text-center p-3 bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl border border-blue-200/50 cursor-pointer hover:shadow-sm transition-shadow"
            onClick={onNavigateToWeight}
          >
            <div className="text-xs font-medium text-slate-600 mb-1 uppercase tracking-wide">
              前日比
            </div>
            <div className={`text-lg font-bold ${
              shouldShowDifference && isDecrease ? 'text-green-600' : shouldShowDifference ? 'text-orange-600' : 'text-slate-900'
            }`}>
              {shouldShowDifference ? (
                <>
                  {isDecrease ? '' : '+'}{difference.toFixed(1)}
                  <span className="text-sm font-medium text-slate-600 ml-1">kg</span>
                </>
              ) : (
                '--'
              )}
            </div>
          </div>
          
          {/* 目標まで */}
          <div 
            className="text-center p-3 bg-green-50 rounded-xl border border-green-200 cursor-pointer hover:shadow-sm transition-shadow"
            onClick={onNavigateToWeight}
          >
            <div className="text-xs font-medium text-slate-600 mb-1 uppercase tracking-wide">目標まで</div>
            <div className="text-lg font-bold">
              {shouldShowWeight && hasTargetWeight ? (
                currentWeight === targetWeight ? (
                  <span className="text-green-600">🎉 達成</span>
                ) : currentWeight > targetWeight ? (
                  <span className="text-red-600">
                    -{remaining.toFixed(1)}
                    <span className="text-sm font-medium text-slate-600 ml-1">kg</span>
                  </span>
                ) : (
                  <span className="text-green-600">
                    +{remaining.toFixed(1)}
                    <span className="text-sm font-medium text-slate-600 ml-1">kg</span>
                  </span>
                )
              ) : (
                <span className="text-slate-900">--</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}