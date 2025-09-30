import { Card } from './ui/card';

interface WeightStats {
  totalEntries: number;
  averageWeight: number;
  weightLoss: number;
  daysTracked: number;
  streak: number;
}

interface WeightData {
  current: number;
  previous: number;
  target: number;
}

interface WeightStatsCardProps {
  weightStats: WeightStats;
  weightData: WeightData;
  className?: string;
}

export function WeightStatsCard({ weightStats, weightData, className = "" }: WeightStatsCardProps) {
  const weeklyChange = weightData.current - weightData.previous;
  const remainingToGoal = weightData.current - weightData.target;
  
  const getChangeColor = (change: number) => {
    if (change === 0) return 'text-slate-600';
    return change > 0 ? 'text-orange-500' : 'text-green-500';
  };

  const getGoalColor = (remaining: number) => {
    if (remaining <= 0) return 'text-green-500'; // 目標達成
    return 'text-blue-500';
  };

  return (
    <Card className={`bg-white/90 border border-slate-200/50 rounded-xl p-4 ${className}`}>
      <div className="grid grid-cols-2 gap-4">
        {/* 今週の変化 */}
        <div className="text-center">
          <div className="text-xs text-slate-500 mb-1">今週の変化</div>
          <div className={`font-bold text-sm ${getChangeColor(weeklyChange)}`}>
            {weeklyChange > 0 ? '+' : ''}{weeklyChange.toFixed(1)}kg
          </div>
        </div>

        {/* 目標まで */}
        <div className="text-center">
          <div className="text-xs text-slate-500 mb-1">目標まで</div>
          <div className={`font-bold text-sm ${getGoalColor(remainingToGoal)}`}>
            {remainingToGoal <= 0 ? '達成！' : `あと${remainingToGoal.toFixed(1)}kg`}
          </div>
        </div>

        {/* 連続記録 */}
        <div className="text-center">
          <div className="text-xs text-slate-500 mb-1">連続記録</div>
          <div className="font-bold text-sm text-purple-500">
            {weightStats.streak}日
          </div>
        </div>

        {/* 今月平均 */}
        <div className="text-center">
          <div className="text-xs text-slate-500 mb-1">今月平均</div>
          <div className="font-bold text-sm text-slate-700">
            {weightStats.averageWeight.toFixed(1)}kg
          </div>
        </div>
      </div>
    </Card>
  );
}