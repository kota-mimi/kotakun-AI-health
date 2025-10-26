import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Calendar,
  Award,
  Activity,
  Heart,
  Scale
} from 'lucide-react';

interface WeightStatsProps {
  data: Array<{
    date: string;
    weight: number;
    note?: string;
  }>;
  currentWeight: number;
  targetWeight: number;
  initialWeight: number;
  height: number;
}

export function WeightStats({ data, currentWeight, targetWeight, initialWeight, height }: WeightStatsProps) {
  // 統計計算
  const calculateStats = () => {
    if (data.length === 0) return null;

    // 総変化量
    const totalChange = currentWeight - initialWeight;
    
    // 目標までの残り
    const remainingToTarget = currentWeight - targetWeight;
    
    // 進捗率
    const totalTargetChange = initialWeight - targetWeight;
    const progress = totalTargetChange !== 0 ? ((initialWeight - currentWeight) / totalTargetChange) * 100 : 0;
    
    // 週平均変化（直近4週間）
    const recentData = data.slice(-28); // 約4週間
    if (recentData.length > 7) {
      const firstWeekAvg = recentData.slice(0, 7).reduce((sum, d) => sum + d.weight, 0) / 7;
      const lastWeekAvg = recentData.slice(-7).reduce((sum, d) => sum + d.weight, 0) / 7;
      const weeklyChange = lastWeekAvg - firstWeekAvg;
      
      return {
        totalChange,
        remainingToTarget,
        progress: Math.max(0, Math.min(100, progress)),
        weeklyChange,
        recordCount: data.length,
        averageWeight: data.reduce((sum, d) => sum + d.weight, 0) / data.length
      };
    }

    return {
      totalChange,
      remainingToTarget,
      progress: Math.max(0, Math.min(100, progress)),
      weeklyChange: 0,
      recordCount: data.length,
      averageWeight: data.reduce((sum, d) => sum + d.weight, 0) / data.length
    };
  };

  const calculateBMI = (weight: number) => {
    const heightInM = height / 100;
    return Number((weight / (heightInM * heightInM)).toFixed(1));
  };

  const getBMICategory = (bmi: number) => {
    if (bmi < 18.5) return { label: '低体重', color: 'bg-blue-100 text-blue-700' };
    if (bmi < 25) return { label: '標準', color: 'bg-green-100 text-green-700' };
    if (bmi < 30) return { label: '軽度肥満', color: 'bg-yellow-100 text-yellow-700' };
    return { label: '肥満', color: 'bg-red-100 text-red-700' };
  };

  const getTargetDate = () => {
    // 週平均変化から目標達成予測日を計算
    const stats = calculateStats();
    if (!stats || stats.weeklyChange >= 0 || stats.remainingToTarget <= 0) return null;
    
    const weeksToTarget = Math.abs(stats.remainingToTarget / stats.weeklyChange);
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + (weeksToTarget * 7));
    
    return targetDate.toLocaleDateString('ja-JP', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const stats = calculateStats();
  const currentBMI = calculateBMI(currentWeight);
  const targetBMI = calculateBMI(targetWeight);
  const initialBMI = calculateBMI(initialWeight);
  const bmiCategory = getBMICategory(currentBMI);
  const targetDate = getTargetDate();

  if (!stats) return null;

  return (
    <div className="space-y-4">
      {/* 主要統計 */}
      <Card className="backdrop-blur-xl bg-white/80 shadow-lg border border-white/30 rounded-xl p-4">
        <h3 className="font-semibold text-slate-800 mb-4 flex items-center space-x-2">
          <Activity size={18} style={{color: '#4682B4'}} />
          <span>統計サマリー</span>
        </h3>
        
        <div className="grid grid-cols-2 gap-4">
          {/* 総変化量 */}
          <div className="text-center p-3 bg-white/60 rounded-xl">
            <div className="flex items-center justify-center space-x-1 mb-2">
              {stats.totalChange < 0 ? (
                <TrendingDown size={16} className="text-green-500" />
              ) : (
                <TrendingUp size={16} className="text-red-500" />
              )}
              <span className="text-sm text-slate-600">総変化</span>
            </div>
            <p className={`text-lg font-bold ${
              stats.totalChange < 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {stats.totalChange > 0 ? '+' : ''}{stats.totalChange.toFixed(1)}kg
            </p>
          </div>

          {/* 週平均変化 */}
          <div className="text-center p-3 bg-white/60 rounded-xl">
            <div className="flex items-center justify-center space-x-1 mb-2">
              <Calendar size={16} style={{color: '#10B981'}} />
              <span className="text-sm text-slate-600">週平均</span>
            </div>
            <p className={`text-lg font-bold ${
              stats.weeklyChange < 0 ? 'text-green-600' : 
              stats.weeklyChange > 0 ? 'text-red-600' : 'text-slate-600'
            }`}>
              {stats.weeklyChange > 0 ? '+' : ''}{stats.weeklyChange.toFixed(1)}kg
            </p>
          </div>

          {/* 記録日数 */}
          <div className="text-center p-3 bg-white/60 rounded-xl">
            <div className="flex items-center justify-center space-x-1 mb-2">
              <Award size={16} style={{color: '#F59E0B'}} />
              <span className="text-sm text-slate-600">記録日数</span>
            </div>
            <p className="text-lg font-bold text-amber-600">{stats.recordCount}日</p>
          </div>

          {/* 平均体重 */}
          <div className="text-center p-3 bg-white/60 rounded-xl">
            <div className="flex items-center justify-center space-x-1 mb-2">
              <Scale size={16} style={{color: '#6B7280'}} />
              <span className="text-sm text-slate-600">平均体重</span>
            </div>
            <p className="text-lg font-bold text-slate-700">{stats.averageWeight.toFixed(1)}kg</p>
          </div>
        </div>
      </Card>

      {/* BMI詳細 */}
      <Card className="backdrop-blur-xl bg-white/80 shadow-lg border border-white/30 rounded-xl p-4">
        <h3 className="font-semibold text-slate-800 mb-4 flex items-center space-x-2">
          <Heart size={18} style={{color: '#EF4444'}} />
          <span>BMI分析</span>
        </h3>
        
        <div className="space-y-4">
          {/* 現在のBMI */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 mb-1">現在のBMI</p>
              <p className="text-2xl font-bold text-slate-800">{currentBMI}</p>
            </div>
            <Badge variant="secondary" className={bmiCategory.color}>
              {bmiCategory.label}
            </Badge>
          </div>

          {/* BMI変化 */}
          <div className="bg-white/60 rounded-xl p-3">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-600">BMI推移</span>
              <span className="text-slate-600">{initialBMI} → {currentBMI}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-500">
              <span>開始時</span>
              <span>現在</span>
            </div>
          </div>

          {/* 目標BMI */}
          <div className="flex items-center justify-between pt-2 border-t border-white/30">
            <div>
              <p className="text-sm text-slate-600 mb-1">目標BMI</p>
              <p className="font-semibold text-slate-700">{targetBMI}</p>
            </div>
            <Badge 
              variant="secondary" 
              className={getBMICategory(targetBMI).color}
            >
              {getBMICategory(targetBMI).label}
            </Badge>
          </div>
        </div>
      </Card>

      {/* 目標達成予測 */}
      {targetDate && (
        <Card className="backdrop-blur-xl bg-white/80 shadow-lg border border-white/30 rounded-xl p-4">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center space-x-2">
            <Target size={18} style={{color: '#4682B4'}} />
            <span>目標達成予測</span>
          </h3>
          
          <div className="space-y-4">
            {/* 進捗バー */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-600">達成進捗</span>
                <span className="font-medium text-slate-800">{Math.round(stats.progress)}%</span>
              </div>
              <Progress 
                value={stats.progress} 
                className="h-3"
                style={{'--progress-background': '#4682B4'} as any}
              />
            </div>

            {/* 残り */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-white/60 rounded-xl">
                <p className="text-xs text-slate-500 mb-1">目標まで</p>
                <p className="font-semibold" style={{color: '#4682B4'}}>
                  {Math.abs(stats.remainingToTarget).toFixed(1)}kg
                </p>
              </div>
              <div className="text-center p-3 bg-white/60 rounded-xl">
                <p className="text-xs text-slate-500 mb-1">予想達成日</p>
                <p className="font-semibold text-slate-700 text-xs">{targetDate}</p>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}