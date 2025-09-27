import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { 
  Footprints, 
  Target, 
  TrendingUp,
  ChevronRight,
  MapPin,
  Clock
} from 'lucide-react';

interface StepsCardProps {
  onNavigateToSteps: () => void;
}

export function StepsCard({ onNavigateToSteps }: StepsCardProps) {
  // モックデータ - 実際のアプリでは状態管理から取得
  const stepsData = {
    current: 8420,
    target: 10000,
    distance: 6.1, // km
    calories: 312,
    activeTime: 92 // 分
  };

  const progressPercentage = Math.round((stepsData.current / stepsData.target) * 100);
  const remainingSteps = stepsData.target - stepsData.current;

  const getProgressColor = () => {
    if (progressPercentage >= 100) return '#10B981'; // green
    if (progressPercentage >= 80) return '#F59E0B'; // amber  
    if (progressPercentage >= 50) return '#3B82F6'; // blue
    return '#EF4444'; // red
  };

  const getStatusMessage = () => {
    if (progressPercentage >= 100) return '目標達成！';
    if (progressPercentage >= 80) return 'もう少し！';
    if (progressPercentage >= 50) return '順調です';
    return 'がんばろう！';
  };

  return (
    <Card className="backdrop-blur-xl bg-gradient-to-br from-white/90 to-white/70 shadow-lg border border-white/40 rounded-xl overflow-hidden">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{backgroundColor: 'rgba(34, 197, 94, 0.1)'}}
            >
              <Footprints size={20} style={{color: '#22C55E'}} />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800">今日の歩数</h3>
              <p className="text-xs text-slate-600">目標に向けて歩こう</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onNavigateToSteps}
            className="p-2 rounded-xl hover:bg-white/60 transition-all duration-200"
          >
            <ChevronRight size={16} className="text-slate-600" />
          </Button>
        </div>

        {/* メイン歩数表示 */}
        <div className="text-center mb-4">
          <div className="text-3xl font-bold text-slate-800 mb-1">
            {stepsData.current.toLocaleString()}
            <span className="text-sm font-normal text-slate-600 ml-1">歩</span>
          </div>
          <div className="flex items-center justify-center space-x-2">
            <span className="text-sm text-slate-600">
              目標 {stepsData.target.toLocaleString()}歩
            </span>
            <Badge 
              variant="secondary" 
              className="text-xs"
              style={{
                backgroundColor: `${getProgressColor()}15`,
                color: getProgressColor()
              }}
            >
              {getStatusMessage()}
            </Badge>
          </div>
        </div>

        {/* プログレスバー */}
        <div className="mb-4">
          <Progress 
            value={Math.min(progressPercentage, 100)} 
            className="h-2 mb-2"
            style={{
              '--progress-background': getProgressColor()
            } as React.CSSProperties}
          />
          <div className="flex justify-between text-xs text-slate-600">
            <span>{progressPercentage}% 達成</span>
            <span>
              {remainingSteps > 0 ? `あと ${remainingSteps.toLocaleString()}歩` : '目標達成！'}
            </span>
          </div>
        </div>

        {/* 詳細データ */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 bg-white/50 rounded-lg">
            <div className="flex items-center justify-center space-x-1 mb-1">
              <MapPin size={12} style={{color: '#3B82F6'}} />
              <span className="text-xs text-slate-600">距離</span>
            </div>
            <div className="text-sm font-semibold text-slate-800">
              {stepsData.distance}km
            </div>
          </div>

          <div className="text-center p-3 bg-white/50 rounded-lg">
            <div className="flex items-center justify-center space-x-1 mb-1">
              <TrendingUp size={12} style={{color: '#EF4444'}} />
              <span className="text-xs text-slate-600">消費</span>
            </div>
            <div className="text-sm font-semibold text-slate-800">
              {stepsData.calories}kcal
            </div>
          </div>

          <div className="text-center p-3 bg-white/50 rounded-lg">
            <div className="flex items-center justify-center space-x-1 mb-1">
              <Clock size={12} style={{color: '#F59E0B'}} />
              <span className="text-xs text-slate-600">時間</span>
            </div>
            <div className="text-sm font-semibold text-slate-800">
              {stepsData.activeTime}分
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}