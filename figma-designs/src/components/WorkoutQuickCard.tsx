import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Activity, Plus, ChevronRight, Flame, Clock, Target, CheckCircle2, Calendar, X, Edit2, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface WorkoutQuickCardProps {
  onNavigateToWorkout?: () => void;
  onAddWorkout?: () => void;
  exerciseData?: Exercise[];
  onAddExercise?: (exercise: Omit<Exercise, 'id' | 'time'>) => void;
  onDeleteExercise?: (exerciseId: string) => void;
  onUpdateExercise?: (exerciseId: string, updates: Partial<Exercise>) => void;
  workoutPlans?: WorkoutPlan[];
  onAddPlan?: (plan: Omit<WorkoutPlan, 'id'>) => void;
  onDeletePlan?: (planId: string) => void;
  onAddExerciseToPlan?: (planId: string, exercise: Omit<WorkoutPlan['exercises'][0], 'id'>) => void;
  onDeleteExerciseFromPlan?: (planId: string, exerciseId: string) => void;
}

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

interface WorkoutPlan {
  id: string;
  name: string;
  targetDuration: number;
  exercises: {
    name: string;
    type: Exercise['type'];
    duration: number;
    sets?: number;
    reps?: number;
    weight?: number;
  }[];
  completed: boolean;
}

export function WorkoutQuickCard({ 
  onNavigateToWorkout, 
  onAddWorkout, 
  exerciseData = [], 
  onAddExercise,
  onDeleteExercise,
  onUpdateExercise,
  workoutPlans = [],
  onAddPlan,
  onDeletePlan,
  onAddExerciseToPlan,
  onDeleteExerciseFromPlan
}: WorkoutQuickCardProps) {
  const [activeView, setActiveView] = useState<'plan' | 'record'>('plan');
  const [planProgress, setPlanProgress] = useState<Record<string, boolean>>({});
  const [showAddPlan, setShowAddPlan] = useState(false);
  const [newPlanName, setNewPlanName] = useState('');
  const [showAddExercise, setShowAddExercise] = useState<string | null>(null);
  const [newExerciseName, setNewExerciseName] = useState('');
  const [showAddSet, setShowAddSet] = useState<string | null>(null);
  const [newSetWeight, setNewSetWeight] = useState('');
  const [newSetReps, setNewSetReps] = useState('');

  // 今日のプラン（最初のプランを使用）
  const todayPlan = workoutPlans.length > 0 ? workoutPlans[0] : null;

  // エクササイズ完了処理
  const handleExerciseComplete = (exercise: WorkoutPlan['exercises'][0]) => {
    if (!todayPlan) return;
    
    const exerciseKey = `${todayPlan.id}-${exercise.name}`;
    const isCompleted = planProgress[exerciseKey];
    
    if (!isCompleted && onAddExercise) {
      // 運動記録に追加
      const newExercise = {
        name: exercise.name,
        type: exercise.type,
        duration: exercise.targetDuration,
        calories: calculateCalories(exercise),
        ...(exercise.sets && exercise.reps && {
          sets: [{ weight: exercise.weight || 0, reps: exercise.reps }]
        })
      };
      onAddExercise(newExercise);
    }
    
    // プラン進捗を更新
    setPlanProgress(prev => ({
      ...prev,
      [exerciseKey]: !isCompleted
    }));
  };

  // カロリー計算（簡易版）
  const calculateCalories = (exercise: WorkoutPlan['exercises'][0]) => {
    const baseCalories = {
      cardio: 8,      // 1分あたり8kcal
      strength: 6,    // 1分あたり6kcal
      flexibility: 3, // 1分あたり3kcal
      sports: 10      // 1分あたり10kcal
    };
    return Math.round((baseCalories[exercise.type] || 5) * exercise.targetDuration);
  };

  // プラン追加処理
  const handleAddPlan = () => {
    if (newPlanName.trim() && onAddPlan) {
      onAddPlan({
        name: newPlanName,
        exercises: []
      });
      setNewPlanName('');
      setShowAddPlan(false);
    }
  };

  // プランにエクササイズ追加処理
  const handleAddExerciseToPlan = (planId: string) => {
    if (newExerciseName.trim() && onAddExerciseToPlan) {
      onAddExerciseToPlan(planId, {
        name: newExerciseName,
        type: 'strength',
        targetDuration: 10
      });
      setNewExerciseName('');
      setShowAddExercise(null);
    }
  };

  // セット追加処理
  const handleAddSet = (exerciseId: string) => {
    const weight = parseFloat(newSetWeight);
    const reps = parseInt(newSetReps);
    
    if (!isNaN(weight) && !isNaN(reps) && weight > 0 && reps > 0 && onUpdateExercise) {
      const exercise = exerciseData.find(ex => ex.id === exerciseId);
      if (exercise) {
        const newSet = { weight, reps };
        const updatedSets = [...(exercise.sets || []), newSet];
        onUpdateExercise(exerciseId, { sets: updatedSets });
      }
      setNewSetWeight('');
      setNewSetReps('');
      setShowAddSet(null);
    }
  };

  // セット削除処理
  const handleDeleteSet = (exerciseId: string, setIndex: number) => {
    if (onUpdateExercise) {
      const exercise = exerciseData.find(ex => ex.id === exerciseId);
      if (exercise && exercise.sets) {
        const updatedSets = exercise.sets.filter((_, index) => index !== setIndex);
        onUpdateExercise(exerciseId, { sets: updatedSets });
      }
    }
  };

  const totalRecordCalories = exerciseData.reduce((sum, ex) => sum + (ex.calories || 0), 0);
  const totalRecordDuration = exerciseData.reduce((sum, ex) => sum + ex.duration, 0);
  const hasWorkout = exerciseData.length > 0;

  return (
    <Card className="backdrop-blur-xl bg-white/95 border border-slate-200/50 rounded-2xl shadow-sm overflow-hidden">
      {/* ヘッダー */}
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-slate-900">運動記録</h3>

          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onNavigateToWorkout}
            className="text-slate-400 hover:text-slate-600 p-2"
          >
            <ChevronRight size={18} />
          </Button>
        </div>
      </div>

      {/* コンテンツエリア */}
      <div className="px-4 pb-4">
        {hasWorkout ? (
          <div className="space-y-4">
            {/* 統計サマリー */}
            <div className="grid grid-cols-2 gap-2">
              <div className="text-center p-2 bg-slate-50/80 rounded-lg border border-slate-100">
                <div className="flex items-center justify-center mb-1">
                  <Flame size={14} className="text-warning" />
                </div>
                <div className="font-bold text-slate-900 text-sm">{totalRecordCalories}</div>
                <div className="text-xs text-slate-500">kcal</div>
              </div>
              <div className="text-center p-2 bg-slate-50/80 rounded-lg border border-slate-100">
                <div className="flex items-center justify-center mb-1">
                  <Clock size={14} className="text-health-primary" />
                </div>
                <div className="font-bold text-slate-900 text-sm">{totalRecordDuration}</div>
                <div className="text-xs text-slate-500">分</div>
              </div>
            </div>
            
            {/* 運動記録リスト */}
            <div className="space-y-3">
              {exerciseData.slice(0, 2).map((exercise) => (
                <div key={exercise.id} className="p-3 bg-slate-50/80 rounded-xl border border-slate-100 group">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-slate-500 bg-white px-2 py-0.5 rounded">{exercise.time}</span>
                      <span className="font-medium text-slate-900 text-sm">{exercise.name}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary" className="text-xs">{exercise.duration}分</Badge>
                      {exercise.type === 'strength' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowAddSet(exercise.id)}
                          className="w-6 h-6 p-0 text-slate-500 hover:text-health-primary"
                        >
                          <Plus size={12} />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDeleteExercise && onDeleteExercise(exercise.id)}
                        className="opacity-0 group-hover:opacity-100 w-6 h-6 p-0 text-slate-400 hover:text-red-500 transition-opacity"
                      >
                        <X size={12} />
                      </Button>
                    </div>
                  </div>
                  
                  {/* セット追加フォーム */}
                  {showAddSet === exercise.id && (
                    <div className="mt-2 p-2 bg-white/80 rounded-lg border border-slate-200">
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          placeholder="重量(kg)"
                          value={newSetWeight}
                          onChange={(e) => setNewSetWeight(e.target.value)}
                          className="w-16 px-2 py-1 text-xs bg-white rounded border border-slate-200"
                          step="0.5"
                          min="0"
                        />
                        <span className="text-xs text-slate-500">×</span>
                        <input
                          type="number"
                          placeholder="回数"
                          value={newSetReps}
                          onChange={(e) => setNewSetReps(e.target.value)}
                          className="w-12 px-2 py-1 text-xs bg-white rounded border border-slate-200"
                          min="1"
                        />
                        <Button
                          size="sm"
                          onClick={() => handleAddSet(exercise.id)}
                          className="bg-health-primary hover:bg-health-primary-dark text-white px-2 text-xs h-7"
                        >
                          追加
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowAddSet(null)}
                          className="w-6 h-6 p-0 text-slate-500"
                        >
                          <X size={12} />
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* 詳細情報 */}
                  <div className="mt-2 space-y-1">
                    {exercise.type === 'cardio' && exercise.distance && (
                      <div className="text-xs text-slate-600">
                        距離: {exercise.distance}km
                      </div>
                    )}
                    
                    {exercise.type === 'strength' && exercise.sets && exercise.sets.length > 0 && (
                      <div className="space-y-1">
                        {exercise.sets.slice(0, 2).map((set, index) => (
                          <div key={index} className="flex items-center justify-between text-xs text-slate-600 py-1 px-2 bg-white/60 rounded group/set">
                            <span>
                              セット{index + 1}: {set.weight}kg × {set.reps}回
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteSet(exercise.id, index)}
                              className="opacity-0 group-hover/set:opacity-100 w-5 h-5 p-0 text-slate-400 hover:text-red-500 transition-opacity"
                            >
                              <X size={8} />
                            </Button>
                          </div>
                        ))}
                        {exercise.sets.length > 2 && (
                          <div className="text-xs text-slate-500 text-center py-1">
                            +{exercise.sets.length - 2}セット
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {exerciseData.length > 2 && (
                <div className="text-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onNavigateToWorkout}
                    className="text-slate-500 hover:text-slate-700 text-xs"
                  >
                    +{exerciseData.length - 2}件の記録を見る
                  </Button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-6">
            <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Activity size={20} className="text-slate-400" />
            </div>
            <h4 className="font-medium text-slate-900 mb-2">今日の運動記録がありません</h4>
            <p className="text-sm text-slate-500 mb-3">運動を記録して健康管理を始めましょう</p>
            <Button 
              onClick={onAddWorkout}
              className="bg-health-primary hover:bg-health-primary-dark text-white"
            >
              <Plus size={16} className="mr-1" />
              運動を追加
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}