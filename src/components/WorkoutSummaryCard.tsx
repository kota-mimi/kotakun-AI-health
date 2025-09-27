import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Activity, ChevronRight, Flame, Clock, Dumbbell, Zap, User, Trophy } from 'lucide-react';

interface ExerciseSet {
  weight: number;
  reps: number;
}

interface Exercise {
  id: string;
  name: string;
  type: 'cardio' | 'strength' | 'flexibility' | 'sports';
  duration: number;
  time: string;
  distance?: number;
  sets?: ExerciseSet[];
  calories?: number;
}

interface WorkoutSummaryCardProps {
  exerciseData: Exercise[];
  onNavigateToWorkout: () => void;
}

const getExerciseTypeLabel = (type: Exercise['type']) => {
  const labels = {
    cardio: '有酸素',
    strength: '筋トレ',
    flexibility: 'ストレッチ',
    sports: 'スポーツ'
  };
  return labels[type];
};

const getExerciseTypeColor = (type: Exercise['type']) => {
  const colors = {
    cardio: 'text-exercise-cardio',
    strength: 'text-exercise-strength',
    flexibility: 'text-exercise-flexibility',
    sports: 'text-exercise-sports'
  };
  return colors[type];
};

const getExerciseTypeIcon = (type: Exercise['type']) => {
  const icons = {
    cardio: Zap,
    strength: Dumbbell,
    flexibility: User,
    sports: Trophy
  };
  return icons[type];
};

export function WorkoutSummaryCard({ exerciseData, onNavigateToWorkout }: WorkoutSummaryCardProps) {
  const totalCalories = exerciseData.reduce((sum, ex) => sum + (ex.calories || 0), 0);
  const totalDuration = exerciseData.reduce((sum, ex) => sum + ex.duration, 0);
  const hasWorkout = exerciseData.length > 0;

  return (
    <Card className="backdrop-blur-xl bg-white/95 border border-slate-200/50 rounded-2xl shadow-sm overflow-hidden">
      {/* ヘッダー */}
      <div className="p-3 pb-0">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="font-semibold text-slate-900">今日の運動</h3>
          </div>
          <div className="text-right">
            <div className="font-bold text-health-primary">{totalCalories}</div>
            <div className="text-xs text-slate-500 tracking-wide">kcal</div>
          </div>
        </div>
      </div>

      {/* コンテンツ */}
      <div className="p-3 pt-0">
        {hasWorkout ? (
          <div className="space-y-3">
            {/* 統計サマリー */}
            <div className="grid grid-cols-2 gap-2">
              <div className="text-center p-2.5 bg-slate-50/80 rounded-xl border border-slate-100">
                <div className="font-bold text-slate-900">{totalCalories}</div>
                <div className="text-xs text-slate-500">消費カロリー</div>
              </div>
              <div className="text-center p-2.5 bg-slate-50/80 rounded-xl border border-slate-100">
                <div className="font-bold text-slate-900">{totalDuration}</div>
                <div className="text-xs text-slate-500">運動時間（分）</div>
              </div>
            </div>
            
            {/* 運動記録リスト */}
            <div className="space-y-2">
              {exerciseData.slice(0, 3).map((exercise) => (
                <div key={exercise.id} className="flex items-center justify-between p-2.5 bg-slate-50/80 rounded-xl border border-slate-100">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                      {(() => {
                        const IconComponent = getExerciseTypeIcon(exercise.type);
                        return <IconComponent size={14} className={getExerciseTypeColor(exercise.type)} />;
                      })()}
                    </div>
                    <div>
                      <div className="font-medium text-slate-900">{exercise.name}</div>
                      <div className="flex items-center space-x-1 mt-0.5">
                        <Badge variant="secondary" className="text-xs bg-slate-100 text-slate-600">
                          {getExerciseTypeLabel(exercise.type)}
                        </Badge>
                        <span className="text-xs text-slate-500">{exercise.time}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="font-bold text-health-primary">{exercise.duration}分</div>
                    {exercise.calories && (
                      <div className="text-xs text-slate-500">{exercise.calories}kcal</div>
                    )}
                  </div>
                </div>
              ))}
              
              {exerciseData.length > 3 && (
                <div className="text-center py-1">
                  <span className="text-xs text-slate-500">他 {exerciseData.length - 3}件</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-6">
            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-2">
              <Activity size={18} className="text-slate-400" />
            </div>
            <p className="text-sm text-slate-500 mb-3">まだ記録がありません</p>
            <Button
              variant="outline"
              size="sm"
              onClick={onNavigateToWorkout}
              className="border-health-primary/30 text-health-primary hover:bg-health-primary/5"
            >
              <Activity size={14} className="mr-1" />
              記録する
            </Button>
          </div>
        )}

        {/* 詳細ボタン */}
        <Button
          variant="ghost"
          onClick={onNavigateToWorkout}
          className="w-full mt-3 text-health-primary hover:bg-health-primary/5 justify-between"
        >
          <span>詳細記録・プラン管理</span>
          <ChevronRight size={16} />
        </Button>
      </div>
    </Card>
  );
}