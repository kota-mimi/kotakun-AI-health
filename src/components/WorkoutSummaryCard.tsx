import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Activity, ChevronRight, ChevronDown, ChevronUp, Flame, Clock, Dumbbell, Zap, User, Trophy, Trash2, Edit3 } from 'lucide-react';
import { ExerciseDeleteModal } from './ExerciseDeleteModal';
import { ExerciseEditModal } from './ExerciseEditModal';

interface ExerciseSet {
  weight: number;
  reps: number;
}

interface Exercise {
  id: string;
  name: string;
  displayName?: string;
  type: 'cardio' | 'strength' | 'flexibility' | 'sports';
  duration: number;
  time: string;
  distance?: number;
  steps?: number; // 歩数
  sets?: ExerciseSet[];
  setsCount?: number;
  reps?: number;
  weight?: number;
  weightSets?: { weight: number; reps: number; sets?: number; }[];
  calories?: number;
  timestamp?: Date | string;
  notes?: string;
}

interface WorkoutSummaryCardProps {
  exerciseData: Exercise[];
  selectedDate: Date;
  onNavigateToWorkout: () => void;
  onAddExercise?: () => void;
  onEditExercise?: (exerciseId: string) => void;
  onDeleteExercise?: (exerciseId: string) => void;
  onUpdateExercise?: (exerciseId: string, updates: Partial<Exercise>) => void;
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

export function WorkoutSummaryCard({ exerciseData, selectedDate, onNavigateToWorkout, onAddExercise, onEditExercise, onDeleteExercise, onUpdateExercise }: WorkoutSummaryCardProps) {
  console.log('💪 WorkoutSummaryCard received exerciseData:', exerciseData);
  console.log('💪 exerciseData length:', exerciseData?.length || 0);
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; exercise: Exercise | null }>({ isOpen: false, exercise: null });
  const [editModal, setEditModal] = useState<{ isOpen: boolean; exercise: Exercise | null }>({ isOpen: false, exercise: null });
  
  // 緊急修正: useExerciseDataが動かないので直接フェッチ (localhost URL fix)
  const [emergencyExerciseData, setEmergencyExerciseData] = useState<Exercise[]>([]);
  
  useEffect(() => {
    console.log('💪 EMERGENCY FETCH: Starting direct exercise data fetch');
    const fetchExerciseData = async () => {
      try {
        const lineUserId = 'Uae6f58bf8b3b8267fcc5cd16b5c3e6b8'; // 開発環境テスト用ID
        const dateStr = selectedDate.toISOString().split('T')[0];
        const response = await fetch(`/api/exercises?lineUserId=${lineUserId}&date=${dateStr}`);
        console.log('💪 EMERGENCY FETCH: API response status:', response.status);
        
        if (response.ok) {
          const result = await response.json();
          console.log('💪 EMERGENCY FETCH: Data received:', result.data);
          setEmergencyExerciseData(result.data || []);
        }
      } catch (error) {
        console.error('💪 EMERGENCY FETCH: Error:', error);
      }
    };
    
    // 開発環境では常に緊急フェッチを実行してテスト
    if (process.env.NODE_ENV === 'development' || !exerciseData || exerciseData.length === 0) {
      fetchExerciseData();
    }
  }, [exerciseData, selectedDate]);
  
  // プロップスが空の場合は緊急データを使用
  let actualExerciseData = (exerciseData && exerciseData.length > 0) ? exerciseData : emergencyExerciseData;
  
  // 緊急フェッチデータの場合はここで確実にソートが必要
  if (actualExerciseData === emergencyExerciseData && actualExerciseData.length > 0) {
    console.log('🚨 緊急フェッチデータを使用中 - 安定ソートを実行');
    
    // インデックス付きで安定ソート
    const indexedData = actualExerciseData.map((exercise, index) => ({ exercise, originalIndex: index }));
    
    const sortedData = indexedData.sort((a, b) => {
      const getTime = (ex: Exercise) => {
        if (ex.timestamp) {
          if (typeof ex.timestamp === 'string') return new Date(ex.timestamp).getTime();
          if (ex.timestamp instanceof Date) return ex.timestamp.getTime();
          if (typeof ex.timestamp === 'object' && 'toDate' in ex.timestamp) {
            return (ex.timestamp as any).toDate().getTime();
          }
        }
        return new Date(`${selectedDate.toISOString().split('T')[0]} ${ex.time}:00`).getTime();
      };
      
      const timeA = getTime(a.exercise);
      const timeB = getTime(b.exercise);
      const comparison = timeA - timeB;
      
      console.log(`🔄 WSC EMERGENCY SORT: ${a.exercise.name}(${timeA}) vs ${b.exercise.name}(${timeB}) = ${comparison}`);
      
      // 時間が近い場合は記録源で判定
      if (Math.abs(comparison) < 1000) {
        const sourceA = a.exercise.notes?.includes('LINE') ? 'LINE' : 'APP';
        const sourceB = b.exercise.notes?.includes('LINE') ? 'LINE' : 'APP';
        if (sourceA !== sourceB) {
          return sourceA === 'LINE' ? -1 : 1; // LINEを先に
        }
        return a.originalIndex - b.originalIndex;
      }
      
      return comparison; // 古い順
    });
    
    actualExerciseData = sortedData.map(item => item.exercise);
  }
  
  console.log('💪 WSC RECEIVED DATA ORDER:', actualExerciseData.map((ex, index) => ({
    index,
    name: ex.name,
    time: ex.time,
    timestamp: ex.timestamp,
    source: ex.notes?.includes('LINE') ? 'LINE' : 'APP'
  })));
  const totalCalories = actualExerciseData.reduce((sum, ex) => sum + (ex.calories || 0), 0);
  const totalDuration = actualExerciseData.reduce((sum, ex) => sum + (ex.duration > 0 ? ex.duration : 0), 0);
  const hasWorkout = actualExerciseData.length > 0;

  const handleDeleteClick = (e: React.MouseEvent, exercise: Exercise) => {
    e.stopPropagation(); // 親要素のクリックイベントを阻止
    setDeleteModal({ isOpen: true, exercise });
  };

  const handleDeleteConfirm = () => {
    if (deleteModal.exercise && onDeleteExercise) {
      onDeleteExercise(deleteModal.exercise.id);
    }
    setDeleteModal({ isOpen: false, exercise: null });
  };

  const handleEditClick = (e: React.MouseEvent, exercise: Exercise) => {
    e.stopPropagation(); // 親要素のクリックイベントを阻止
    setEditModal({ isOpen: true, exercise });
  };

  const handleUpdateExercise = (exerciseId: string, updates: Partial<Exercise>) => {
    if (onUpdateExercise) {
      onUpdateExercise(exerciseId, updates);
    }
    setEditModal({ isOpen: false, exercise: null });
  };

  const handleDeleteFromEdit = (exerciseId: string) => {
    if (onDeleteExercise) {
      onDeleteExercise(exerciseId);
    }
    setEditModal({ isOpen: false, exercise: null });
  };

  return (
    <Card className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      <Button
        onClick={() => setIsCollapsed(!isCollapsed)}
        variant="ghost"
        className="w-full justify-start p-0 h-auto hover:bg-transparent"
      >
        <div className="flex items-center justify-between w-full px-4 py-3 border-b border-slate-200 hover:bg-slate-50 transition-colors duration-200">
          <div className="flex items-center space-x-2">
            <h3 className="font-semibold text-slate-900">今日の運動</h3>
          </div>
          {isCollapsed ? (
            <ChevronDown size={16} className="text-slate-500" />
          ) : (
            <ChevronUp size={16} className="text-slate-500" />
          )}
        </div>
      </Button>

      {/* コンテンツ */}
      {!isCollapsed && (
        <div className="px-4 -mt-4 pb-4">
          {hasWorkout ? (
            <div className="space-y-4">
            {/* 統計サマリー */}
            <div className="grid grid-cols-2 gap-3">
              <div 
                className="rounded-xl p-3 text-center"
                style={{ 
                  background: 'linear-gradient(to bottom right, #fefaf8, #fef0e6)'
                }}
              >
                <div className="text-lg font-bold text-orange-700">{totalCalories > 0 ? totalCalories : '-'}</div>
                <div className="text-xs text-orange-600">消費カロリー</div>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-3 text-center">
                <div className="text-lg font-bold text-blue-700">{totalDuration > 0 ? totalDuration : '-'}</div>
                <div className="text-xs text-blue-600">運動時間（分）</div>
              </div>
            </div>
            
            {/* 運動記録リスト */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-slate-700 mb-2">運動記録</h4>
              {(isExpanded ? actualExerciseData : actualExerciseData.slice(0, 3)).map((exercise, index) => (
                <div 
                  key={exercise.id} 
                  className="bg-white rounded-lg p-3 border border-slate-100 shadow-sm cursor-pointer hover:bg-slate-50 transition-colors"
                  onClick={() => onEditExercise?.(exercise.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="font-medium text-slate-900 text-sm">{exercise.name}</div>
                          <span 
                            className="text-xs px-2 py-0.5 rounded font-medium"
                            style={{
                              background: exercise.type === 'cardio' ? '#e0f2fe' :
                                         exercise.type === 'strength' ? '#fed7aa' :
                                         exercise.type === 'flexibility' ? '#dcfce7' :
                                         '#fef3c7',
                              color: exercise.type === 'cardio' ? '#0369a1' :
                                     exercise.type === 'strength' ? '#c2410c' :
                                     exercise.type === 'flexibility' ? '#166534' :
                                     '#a16207'
                            }}
                          >
                            {getExerciseTypeLabel(exercise.type)}
                          </span>
                          <span className="text-xs text-slate-500">{exercise.time}</span>
                        </div>
                        <div className="text-right">
                          {/* 回数表示を優先、時間表示、その他の順 */}
                          {(() => {
                            // repsフィールドから回数取得
                            let totalReps = exercise.reps || 0;
                            
                            // repsが0の場合、setsから合計回数を計算
                            if (totalReps === 0 && exercise.sets && exercise.sets.length > 0) {
                              totalReps = exercise.sets.reduce((sum, set) => sum + (set.reps || 0), 0);
                            }
                            
                            if (totalReps > 0) {
                              return <div className="font-bold text-slate-800">{totalReps}<span className="text-xs text-slate-600 ml-1">回</span></div>;
                            } else if (exercise.duration && exercise.duration > 0) {
                              return <div className="font-bold text-slate-800">{exercise.duration}<span className="text-xs text-slate-600 ml-1">分</span></div>;
                            } else {
                              return <div className="font-bold text-slate-800">-</div>;
                            }
                          })()}
                          {exercise.calories && (
                            <div className="text-xs text-orange-600 font-medium">{exercise.calories}kcal</div>
                          )}
                        </div>
                      </div>
                      
                      {/* 運動詳細情報 - 重量・回数・セット数優先表示 */}
                      {(() => {
                        // WeightSets表示（最優先）
                        if (exercise.weightSets && exercise.weightSets.length > 0) {
                          return (
                            <div className="mt-2 text-xs space-y-1">
                              {exercise.weightSets.map((weightSet, index) => (
                                <div key={index} className="text-orange-600 font-medium">
                                  {weightSet.weight && weightSet.weight > 0 ? `${weightSet.weight}kg × ` : ''}{weightSet.reps}回{weightSet.sets && weightSet.sets > 1 ? ` × ${weightSet.sets}セット` : ''}
                                </div>
                              ))}
                            </div>
                          );
                        }
                        
                        // 古いSets表示（後方互換性）
                        if (exercise.sets && exercise.sets.length > 0) {
                          return (
                            <div className="mt-2 text-xs space-y-1">
                              {exercise.sets.map((set, setIndex) => (
                                <div key={setIndex} className="text-orange-600 font-medium">
                                  セット{setIndex + 1}: {
                                    // 重量が記入されている運動（ベンチプレス等）は0kgでも表示
                                    // 重量が記入されていない運動（腹筋等）は回数のみ
                                    (exercise.weight && exercise.weight > 0) || exercise.sets?.some(s => s.weight > 0) 
                                      ? `${set.weight}kg × ${set.reps}回`
                                      : `${set.reps}回`
                                  }
                                </div>
                              ))}
                            </div>
                          );
                        }
                        
                        // 基本的な重量・回数・セット数がある場合
                        if ((exercise.weight && exercise.weight > 0) || (exercise.reps && exercise.reps > 0) || (exercise.setsCount && exercise.setsCount > 1)) {
                          const parts = [];
                          if (exercise.weight && exercise.weight > 0) parts.push(`${exercise.weight}kg`);
                          if (exercise.reps && exercise.reps > 0) parts.push(`${exercise.reps}回`);
                          if (exercise.setsCount && exercise.setsCount > 1) parts.push(`${exercise.setsCount}セット`);
                          
                          return (
                            <div className="mt-2 text-xs">
                              <span className="text-orange-600 font-medium">
                                {parts.join(' × ')}
                              </span>
                            </div>
                          );
                        }
                        
                        // その他の詳細情報（距離、歩数、時間など）
                        const parts = [];
                        if (exercise.steps && exercise.steps > 0) parts.push(`${exercise.steps.toLocaleString()}歩`);
                        if (exercise.distance && exercise.distance > 0) parts.push(`${exercise.distance}km`);
                        if (exercise.duration && exercise.duration > 0 && (!exercise.reps || exercise.reps === 0) && (!exercise.weight || exercise.weight === 0)) parts.push(`${exercise.duration}分`);
                        
                        // 回数のみの記録で重量・セット数がない場合は「自重運動」
                        const isRepsOnly = exercise.reps && exercise.reps > 0 && exercise.duration === 0 && (!exercise.weight || exercise.weight === 0) && (!exercise.setsCount || exercise.setsCount <= 1);
                        if (isRepsOnly && parts.length === 0) {
                          parts.push('自重運動');
                        }
                        
                        if (parts.length > 0) {
                          return (
                            <div className="mt-2 text-xs">
                              <span className="text-orange-600 font-medium">
                                {parts.join(' × ')}
                              </span>
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  </div>
                </div>
              ))}
              
              {actualExerciseData.length > 3 && (
                <div className="text-center py-2">
                  <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="text-xs text-blue-600 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-full transition-colors font-medium"
                  >
                    {isExpanded ? '閉じる' : `もっと見る (${actualExerciseData.length - 3}件)`}
                  </button>
                </div>
              )}
            </div>
            
            {/* 運動追加ボタン */}
            {onAddExercise && (
              <Button
                variant="outline"
                onClick={onAddExercise}
                className="w-full py-3 border-2 border-dashed rounded-xl"
                style={{borderColor: 'rgba(70, 130, 180, 0.3)', color: '#4682B4'}}
              >
                運動を追加
              </Button>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <h4 className="font-medium text-slate-900 mb-2">運動を記録しよう</h4>
            <p className="text-sm text-slate-500 mb-4">今日の運動を記録して<br />健康管理を始めましょう</p>
            <Button
              onClick={onAddExercise || onNavigateToWorkout}
              className="text-white px-6 py-3 rounded-xl"
              style={{backgroundColor: '#4682B4'}}
            >
              運動を記録する
            </Button>
          </div>
          )}
        </div>
      )}

      {/* 削除確認モーダル */}
      <ExerciseDeleteModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, exercise: null })}
        onConfirm={handleDeleteConfirm}
        exercise={deleteModal.exercise}
      />

      {/* 編集モーダル */}
      <ExerciseEditModal
        isOpen={editModal.isOpen}
        onClose={() => setEditModal({ isOpen: false, exercise: null })}
        onUpdate={handleUpdateExercise}
        onDelete={handleDeleteFromEdit}
        exercise={editModal.exercise}
        userWeight={70}
      />
    </Card>
  );
}