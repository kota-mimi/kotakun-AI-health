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
}

interface WeightCardProps {
  data: WeightData;
  onNavigateToWeight?: () => void;
  counselingResult?: CounselingResult | null;
}

export function WeightCard({ data, onNavigateToWeight, counselingResult }: WeightCardProps) {
  // デバッグ用ログ
  console.log('WeightCard - data:', data);
  console.log('WeightCard - counselingResult:', counselingResult);
  
  // データが記録されているかチェック
  const hasData = data.current > 0;
  
  // 実際の記録データを優先、カウンセリング結果はフォールバックとして使用
  const currentWeight = hasData ? data.current : (counselingResult?.answers?.weight || 0);
  const difference = hasData ? (currentWeight - data.previous) : 0;
  // カウンセリング結果の目標体重があれば優先、なければデータの目標体重を使用
  const targetWeight = counselingResult?.answers?.targetWeight || data.target;
  const remaining = hasData ? Math.abs(currentWeight - targetWeight) : 0;
  const isDecrease = difference < 0;
  const isTargetReached = Math.abs(difference) < 0.1;
  
  console.log('WeightCard - currentWeight:', currentWeight, 'previous:', data.previous, 'target:', targetWeight);

  return (
    <Card className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      <div className="p-3">
        <div className="grid grid-cols-3 gap-2">
          {/* 現在の体重 */}
          <div 
            className="text-center p-3 bg-gradient-to-br from-slate-50 to-slate-100/80 rounded-xl border border-slate-200/50 cursor-pointer hover:shadow-sm transition-shadow"
            onClick={onNavigateToWeight}
          >
            <div className="text-xs font-medium text-slate-500 mb-1 uppercase tracking-wide">現在</div>
            <div className="text-lg font-bold text-slate-900">
              {hasData ? currentWeight : '--'}
              {hasData && <span className="text-sm font-medium text-slate-600 ml-1">kg</span>}
            </div>
          </div>
          
          {/* 前日比 */}
          <div 
            className="text-center p-3 bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-xl border border-blue-200/50 cursor-pointer hover:shadow-sm transition-shadow"
            onClick={onNavigateToWeight}
          >
            <div className="text-xs font-medium text-slate-600 mb-1 uppercase tracking-wide">前日比</div>
            <div className={`text-lg font-bold ${
              hasData && isDecrease ? 'text-green-600' : hasData ? 'text-orange-600' : 'text-slate-900'
            }`}>
              {hasData ? (
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
            className="text-center p-3 bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-xl border border-purple-200/50 cursor-pointer hover:shadow-sm transition-shadow"
            onClick={onNavigateToWeight}
          >
            <div className="text-xs font-medium text-slate-600 mb-1 uppercase tracking-wide">目標まで</div>
            <div className="text-lg font-bold">
              {hasData ? (
                currentWeight <= targetWeight ? (
                  <span className="text-green-600">🎉 達成</span>
                ) : (
                  <span className="text-purple-600">
                    -{remaining.toFixed(1)}
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