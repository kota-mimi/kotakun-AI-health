import { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { CompactHeader } from './CompactHeader';
import { AddExerciseModal } from './AddExerciseModal';
import { ExerciseDetailModal } from './ExerciseDetailModal';
import { ExerciseEditModal } from './ExerciseEditModal';

import { 
  ArrowLeft,
  Plus,
  Flame,
  Clock,
  Activity,
  MoreVertical,
  Heart,
  Zap,
  Timer,
  Trophy,
  Target,
  CheckCircle2,
  Calendar,
  Settings,
  X
} from 'lucide-react';

interface ExercisePageProps {
  onBack: () => void;
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  hideHeader?: boolean;
  exerciseData?: Exercise[];
  onAddExercise?: (exercise: Omit<Exercise, 'id'>) => void;
  onDeleteExercise?: (exerciseId: string) => void;
  onUpdateExercise?: (exerciseId: string, updates: Partial<Exercise>) => void;
  workoutPlans?: WorkoutPlan[];
  onAddPlan?: (plan: Omit<WorkoutPlan, 'id'>) => void;
  onDeletePlan?: (planId: string) => void;
  onAddExerciseToPlan?: (planId: string, exercise: Omit<WorkoutPlan['exercises'][0], 'id'>) => void;
  onDeleteExerciseFromPlan?: (planId: string, exerciseId: string) => void;
}

interface Exercise {
  id: string;
  name: string;
  displayName?: string;
  type: 'cardio' | 'strength' | 'flexibility' | 'sports';
  duration: number;
  calories: number;
  sets?: { weight: number; reps: number; }[];
  setsCount?: number;
  reps?: number;
  weight?: number;
  weightSets?: { weight: number; reps: number; sets?: number; }[];
  distance?: number;
  time: string;
  notes?: string;
  timestamp?: Date | string;
}

interface WorkoutPlan {
  id: string;
  name: string;
  targetDuration: number;
  exercises: {
    id: string;
    name: string;
    type: Exercise['type'];
    targetDuration: number;
    sets?: number;
    reps?: number;
    weight?: number;
    completed: boolean;
  }[];
  completed: boolean;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  category: string;
}

export function ExercisePage({ 
  onBack, 
  selectedDate, 
  onDateSelect, 
  hideHeader = false, 
  exerciseData = [], 
  onAddExercise,
  onDeleteExercise,
  onUpdateExercise,
  workoutPlans = [],
  onAddPlan,
  onDeletePlan,
  onAddExerciseToPlan,
  onDeleteExerciseFromPlan
}: ExercisePageProps) {
  const [isAddExerciseModalOpen, setIsAddExerciseModalOpen] = useState(false);
  const [isExerciseDetailModalOpen, setIsExerciseDetailModalOpen] = useState(false);
  const [isExerciseEditModalOpen, setIsExerciseEditModalOpen] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [activeView, setActiveView] = useState<'plans' | 'records'>('plans');
  const [showAddSet, setShowAddSet] = useState<string | null>(null);
  const [newSetWeight, setNewSetWeight] = useState('');
  const [newSetReps, setNewSetReps] = useState('');

  // デバッグ用：運動データをログ出力
  useEffect(() => {
      dataLength: exerciseData.length,
      data: exerciseData.map(ex => ({
        id: ex.id,
        name: ex.name,
        reps: ex.reps,
        weight: ex.weight,
        setsCount: ex.setsCount,
        duration: ex.duration,
        type: ex.type
      }))
    });
  }, [exerciseData]);




  // 今日の運動サマリー計算
  const calculateTodaySummary = () => {
    const totalCalories = exerciseData.reduce((sum, exercise) => sum + exercise.calories, 0);
    const totalDuration = exerciseData.reduce((sum, exercise) => sum + (exercise.duration > 0 ? exercise.duration : 0), 0);

    return {
      totalCalories,
      totalDuration
    };
  };

  const summary = calculateTodaySummary();

  // 運動詳細モーダルを開く
  const handleViewExerciseDetail = (exercise: Exercise) => {
    setSelectedExercise(exercise);
    setIsExerciseDetailModalOpen(true);
  };

  // 運動詳細モーダルから編集
  const handleEditFromDetail = () => {
    setIsExerciseDetailModalOpen(false);
    setIsExerciseEditModalOpen(true);
  };

  // 運動編集処理
  const handleUpdateExercise = (exerciseId: string, updates: Partial<Exercise>) => {
    if (onUpdateExercise) {
      onUpdateExercise(exerciseId, updates);
    }
  };

  // 運動削除処理
  const handleDeleteExercise = (exerciseId: string) => {
    if (onDeleteExercise) {
      onDeleteExercise(exerciseId);
    }
  };

  // 運動詳細モーダルから複製
  const handleCopyFromDetail = () => {
    setIsExerciseDetailModalOpen(false);
    if (selectedExercise && onAddExercise) {
      const copiedExercise = {
        ...selectedExercise,
        id: undefined, // 新しいIDが生成されるように
        time: new Date().toTimeString().slice(0, 5) // 現在時刻に設定
      };
      onAddExercise(copiedExercise);
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

  const handleAddExerciseSubmit = (exercise: Omit<Exercise, 'id'>) => {
    if (onAddExercise) {
      onAddExercise(exercise);
    }
  };

  const startPlan = (planId: string) => {
    // プラン開始ロジックをここに実装
  };

  const getDifficultyBadgeColor = (difficulty: WorkoutPlan['difficulty']) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-700';
      case 'intermediate': return 'bg-yellow-100 text-yellow-700';
      case 'advanced': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getDifficultyText = (difficulty: WorkoutPlan['difficulty']) => {
    switch (difficulty) {
      case 'beginner': return '初級';
      case 'intermediate': return '中級';
      case 'advanced': return '上級';
      default: return '不明';
    }
  };

  const getExerciseTypeIcon = (type: Exercise['type']) => {
    switch (type) {
      case 'cardio':
        return <Heart size={14} style={{color: '#EF4444'}} />;
      case 'strength':
        return <Zap size={14} style={{color: '#F59E0B'}} />;
      case 'flexibility':
        return <Activity size={14} style={{color: '#10B981'}} />;
      case 'sports':
        return <Trophy size={14} style={{color: '#8B5CF6'}} />;
      default:
        return <Activity size={14} style={{color: '#4682B4'}} />;
    }
  };

  const getExerciseTypeName = (type: Exercise['type']) => {
    switch (type) {
      case 'cardio': return '有酸素';
      case 'strength': return '筋トレ';
      case 'flexibility': return 'ストレッチ';
      case 'sports': return 'スポーツ';
      default: return '運動';
    }
  };

  // エクササイズの完了状態を切り替える関数
  const toggleExerciseCompletion = (planId: string, exerciseId: string) => {
    if (onAddExerciseToPlan && onDeleteExerciseFromPlan) {
      // 実際の実装では、プラン���状態を更新する必要があります
      // ここでは簡易的な実装として、完了状態をトグルする処理をします
    }
  };

  // プラン完了処理
  const completePlan = (planId: string) => {
    if (onDeletePlan) {
      onDeletePlan(planId);
    }
  };

  return (
    <div className="min-h-screen bg-white relative">
      
      {!hideHeader && (
        <CompactHeader
          currentDate={selectedDate}
          onDateSelect={onDateSelect}
          onCalendar={() => {}}
        />
      )}

      <div className={`relative space-y-4 ${hideHeader ? '' : 'px-4 py-4 pb-20'}`}>
        {/* 今日のサマリーカード */}
        <Card className="bg-white shadow-sm border border-gray-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-slate-800">今日の運動記録</h4>
            <div className="text-xs text-slate-600">
              {selectedDate.toLocaleDateString('ja-JP', { month: 'long', day: 'numeric' })}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 bg-white rounded-lg">
              <div className="text-xs text-slate-600 mb-1">消費カロリー</div>
              <div className="font-bold text-slate-800">
                {summary.totalCalories > 0 ? summary.totalCalories : '-'}<span className="text-sm">{summary.totalCalories > 0 ? 'kcal' : ''}</span>
              </div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg">
              <div className="text-xs text-slate-600 mb-1">運動時間</div>
              <div className="font-bold text-slate-800">
                {summary.totalDuration > 0 ? summary.totalDuration : '-'}<span className="text-sm">{summary.totalDuration > 0 ? '分' : ''}</span>
              </div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg">
              <div className="text-xs text-slate-600 mb-1">種目数</div>
              <div className="font-bold text-slate-800">
                {exerciseData.length}<span className="text-sm">種目</span>
              </div>
            </div>
          </div>
        </Card>



        {/* 運動記録リスト */}
        <Card className="bg-white shadow-sm border border-gray-200 rounded-2xl overflow-hidden">
          <div className="px-3 py-2 bg-white">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-800">運動記録</h3>
              <Button 
                size="sm"
                onClick={() => setIsAddExerciseModalOpen(true)}
                className="text-white h-8 px-3"
                style={{backgroundColor: '#4682B4'}}
              >
                <Plus size={14} className="mr-1" />
                追加
              </Button>
            </div>
          </div>

          <div className="divide-y divide-gray-200">
            {exerciseData.length > 0 ? (
              exerciseData.map((exercise) => (
                <div 
                  key={exercise.id} 
                  className="px-3 py-3 cursor-pointer hover:bg-gray-50 transition-colors duration-200"
                  onClick={() => handleViewExerciseDetail(exercise)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 flex-1">
                      <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center flex-shrink-0">
                        {getExerciseTypeIcon(exercise.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-slate-800 truncate">{exercise.name}</div>
                        <div className="flex items-center space-x-3 text-xs text-slate-500">
                          <span>{exercise.time}</span>
                          {/* 動的に情報を表示 */}
                          {exercise.duration && exercise.duration > 0 && (
                            <>
                              <span>•</span>
                              <span>{exercise.duration}分</span>
                            </>
                          )}
                          {exercise.calories && exercise.calories > 0 && (
                            <>
                              <span>•</span>
                              <span>消費カロリー {exercise.calories}kcal</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 text-right flex-shrink-0">
                      {/* 柔軟な表示：何かしらの数値があれば表示 */}
                      {(() => {
                        const parts = [];
                        if (exercise.distance && exercise.distance > 0) parts.push(`${exercise.distance}km`);
                        if (exercise.weight && exercise.weight > 0) parts.push(`${exercise.weight}kg`);
                        if (exercise.reps && exercise.reps > 0) parts.push(`${exercise.reps}回`);
                        if (exercise.setsCount && exercise.setsCount > 1) parts.push(`${exercise.setsCount}セット`);
                        if (exercise.duration && exercise.duration > 0 && !exercise.reps && !exercise.weight) parts.push(`${exercise.duration}分`);
                        
                        if (parts.length > 0) {
                          return (
                            <div className="text-right">
                              <div className="text-sm font-medium text-orange-600">
                                {parts.join(' × ')}
                              </div>
                              <div className="text-xs text-slate-500">詳細</div>
                            </div>
                          );
                        }
                        return null;
                      })()}
                      <Badge 
                        variant="secondary" 
                        className="text-xs bg-white text-slate-600 border border-gray-200"
                      >
                        {getExerciseTypeName(exercise.type)}
                      </Badge>
                    </div>
                  </div>

                  {(exercise.weightSets && Array.isArray(exercise.weightSets) && exercise.weightSets.length > 0) ? (
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <div className="flex flex-wrap gap-1">
                        {exercise.weightSets.slice(0, 3).map((set, index) => {
                          const parts = [];
                          if (set.weight > 0) parts.push(`${set.weight}kg`);
                          if (set.reps > 0) parts.push(`${set.reps}回`);
                          if (set.sets && set.sets > 1) parts.push(`${set.sets}セット`);
                          
                          return (
                            <span 
                              key={index}
                              className="inline-block bg-white rounded-md px-2 py-1 text-xs text-slate-600"
                            >
                              セット{index + 1}: {parts.join(' × ') || '記録'}
                            </span>
                          );
                        })}
                        {exercise.weightSets.length > 3 && (
                          <span className="inline-block bg-white rounded-md px-2 py-1 text-xs text-slate-500">
                            +{exercise.weightSets.length - 3}more
                          </span>
                        )}
                      </div>
                    </div>
                  ) : exercise.sets && Array.isArray(exercise.sets) && (
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <div className="flex flex-wrap gap-1">
                        {exercise.sets.slice(0, 3).map((set, index) => (
                          <span 
                            key={index}
                            className="inline-block bg-white rounded-md px-2 py-1 text-xs text-slate-600"
                          >
                            {set.weight}kg × {set.reps}回
                          </span>
                        ))}
                        {exercise.sets.length > 3 && (
                          <span className="inline-block bg-white rounded-md px-2 py-1 text-xs text-slate-500">
                            +{exercise.sets.length - 3}more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {exercise.notes && (
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <div className="text-xs text-slate-600 bg-white rounded-lg px-2 py-1">
                        {exercise.notes.length > 50 
                          ? `${exercise.notes.substring(0, 50)}...` 
                          : exercise.notes}
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="p-6 text-center">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center mx-auto mb-3">
                  <Activity size={20} className="text-slate-500" />
                </div>
                <p className="text-slate-600 mb-3 text-sm">今日の運動記録がありません</p>
                <Button 
                  onClick={() => setIsAddExerciseModalOpen(true)}
                  className="text-white text-sm h-9"
                  style={{backgroundColor: '#4682B4'}}
                >
                  <Plus size={16} className="mr-1" />
                  運動を追加
                </Button>
              </div>
            )}
          </div>
        </Card>

        {/* 今週の運動履歴 */}

      </div>

      {/* 運動追加モーダル */}
      <AddExerciseModal
        isOpen={isAddExerciseModalOpen}
        onClose={() => setIsAddExerciseModalOpen(false)}
        onAddExercise={handleAddExerciseSubmit}
      />

      {/* 運動詳細モーダル */}
      <ExerciseDetailModal
        isOpen={isExerciseDetailModalOpen}
        onClose={() => {
          setIsExerciseDetailModalOpen(false);
          setSelectedExercise(null);
        }}
        exercise={selectedExercise}
        onEdit={handleEditFromDetail}
        onCopy={handleCopyFromDetail}
      />

      {/* 運動編集モーダル */}
      <ExerciseEditModal
        isOpen={isExerciseEditModalOpen}
        onClose={() => {
          setIsExerciseEditModalOpen(false);
          setSelectedExercise(null);
        }}
        exercise={selectedExercise}
        onUpdate={handleUpdateExercise}
        onDelete={handleDeleteExercise}
      />
    </div>
  );
}