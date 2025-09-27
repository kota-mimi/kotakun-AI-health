import { Card } from './ui/card';
import { Button } from './ui/button';
import { Scale, ChevronRight, TrendingDown, TrendingUp } from 'lucide-react';

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
  // カウンセリング結果があれば現在体重も優先
  const currentWeight = counselingResult?.answers?.weight || data.current;
  const difference = currentWeight - data.previous;
  // カウンセリング結果の目標体重があれば優先、なければデータの目標体重を使用
  const targetWeight = counselingResult?.answers?.targetWeight || data.target;
  const remaining = Math.abs(currentWeight - targetWeight);
  const isDecrease = difference < 0;
  const isTargetReached = Math.abs(difference) < 0.1;

  return (
    <Button
      variant="ghost" 
      onClick={onNavigateToWeight}
      className="w-full p-0 h-auto hover:bg-transparent"
    >
      <Card className="w-full backdrop-blur-xl bg-white/95 border border-slate-200/50 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 p-3 relative">
        {/* 右上の矢印 */}
        <ChevronRight size={16} className="absolute top-3 right-3 text-slate-400" />
        
        {/* メインデータ */}
        <div className="grid grid-cols-3 gap-2">
          {/* 現在の体重 */}
          <div className="text-center p-2 bg-slate-50/80 rounded-xl border border-slate-100">
            <div className="text-xs font-medium text-slate-500 mb-1 uppercase tracking-wide">現在</div>
            <div className="text-base font-bold text-slate-900">{currentWeight}<span className="text-sm font-medium text-slate-600 ml-1">kg</span></div>
          </div>
          
          {/* 前日比 */}
          <div className="text-center p-2 bg-slate-50/80 rounded-xl border border-slate-100">
            <div className="text-xs font-medium text-slate-500 mb-1 uppercase tracking-wide">前日比</div>
            <div className="flex items-center justify-center space-x-1">
              {isDecrease ? (
                <TrendingDown size={12} className="text-success" />
              ) : (
                <TrendingUp size={12} className="text-warning" />
              )}
              <span className={`text-sm font-bold ${
                isDecrease ? 'text-success' : 'text-warning'
              }`}>
                {isDecrease ? '' : '+'}{difference.toFixed(1)}kg
              </span>
            </div>
          </div>
          
          {/* 目標まで */}
          <div className="text-center p-2 bg-slate-50/80 rounded-xl border border-slate-100">
            <div className="text-xs font-medium text-slate-500 mb-1 uppercase tracking-wide">目標まで</div>
            <div className="text-sm font-bold text-[rgba(244,0,0,1)]">
              {remaining.toFixed(1)}<span className="text-xs font-medium text-slate-600 ml-1">kg</span>
            </div>
          </div>
        </div>
      </Card>
    </Button>
  );
}