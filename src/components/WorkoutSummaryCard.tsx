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
  
  // 開発環境では強制的にテストデータを使用
  let actualExerciseData;
  if (process.env.NODE_ENV === 'development') {
    actualExerciseData = [
      {
        id: 'dev-test-1',
        name: '腕立て伏せ',
        displayName: '腕立て伏せ 10回',
        type: 'strength' as const,
        duration: 0,
        time: '21:10',
        calories: 140,
        reps: 10,
        setsCount: null,
        weight: 0,
        weightSets: [],
        timestamp: new Date().toISOString(),
        notes: 'テストデータ'
      },
      {
        id: 'dev-test-2', 
        name: 'ベンチプレス',
        displayName: 'ベンチプレス 120kg 10回 3セット',
        type: 'strength' as const,
        duration: 0,
        time: '20:30',
        calories: 280,
        reps: 10,
        setsCount: 3,
        weight: 120,
        weightSets: [{ weight: 120, reps: 10, sets: 3 }],
        sets: [{ weight: 120, reps: 10 }],
        timestamp: new Date(Date.now() - 60000).toISOString(),
        notes: 'テストデータ'
      }
    ];
    console.log('🧪 開発環境：強制テストデータを使用', actualExerciseData);
  } else {
    // プロップスが空の場合は緊急データを使用し、時系列順にソート  
    actualExerciseData = (exerciseData && exerciseData.length > 0) ? exerciseData : emergencyExerciseData;
  }
  
  // 時系列順（古い順）にソート
  actualExerciseData = [...actualExerciseData].sort((a, b) => {
    const getTimestamp = (exercise: Exercise) => {
      if (exercise.timestamp) {
        let timestamp: number;
        
        // FirestoreのTimestampオブジェクトかチェック
        if (exercise.timestamp && typeof exercise.timestamp === 'object' && 'toDate' in exercise.timestamp) {
          timestamp = (exercise.timestamp as any).toDate().getTime();
          console.log(`💪 WSC ${exercise.name} - Firestore timestamp: ${exercise.timestamp} -> ${timestamp}`);
        } 
        // 通常のDateオブジェクト
        else if (exercise.timestamp instanceof Date) {
          timestamp = exercise.timestamp.getTime();
          console.log(`💪 WSC ${exercise.name} - Date timestamp: ${exercise.timestamp} -> ${timestamp}`);
        }
        // 文字列の場合
        else {
          timestamp = new Date(exercise.timestamp).getTime();
          console.log(`💪 WSC ${exercise.name} - String timestamp: ${exercise.timestamp} -> ${timestamp}`);
        }
        
        return timestamp;
      }
      // timeから今日の日付でDateオブジェクトを作成
      const today = new Date().toISOString().split('T')[0];
      const fallbackTime = new Date(`${today} ${exercise.time}`).getTime();
      console.log(`💪 WSC ${exercise.name} - time fallback: ${today} ${exercise.time} -> ${fallbackTime}`);
      return fallbackTime;
    };
    
    const timeA = getTimestamp(a);
    const timeB = getTimestamp(b);
    
    console.log(`💪 WSC SORT: ${a.name}(${timeA}) vs ${b.name}(${timeB}) = ${timeA - timeB}`);
    
    // 古い順（昇順）でソート
    return timeA - timeB;
  });
  const totalCalories = actualExerciseData.reduce((sum, ex) => sum + (ex.calories || 0), 0);
  const totalDuration = actualExerciseData.reduce((sum, ex) => sum + ex.duration, 0);
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
                <div className="text-lg font-bold text-orange-700">{totalCalories}</div>
                <div className="text-xs text-orange-600">消費カロリー</div>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-3 text-center">
                <div className="text-lg font-bold text-blue-700">{totalDuration}</div>
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
                          <div className="font-bold text-slate-800">{exercise.duration}<span className="text-xs text-slate-600 ml-1">分</span></div>
                          {exercise.calories && (
                            <div className="text-xs text-orange-600 font-medium">{exercise.calories}kcal</div>
                          )}
                        </div>
                      </div>
                      
                      {/* 運動詳細情報 - 柔軟な表示 */}
                      {(() => {
                        const parts = [];
                        if (exercise.distance && exercise.distance > 0) parts.push(`${exercise.distance}km`);
                        if (exercise.weight && exercise.weight > 0) parts.push(`${exercise.weight}kg`);
                        if (exercise.reps && exercise.reps > 0) parts.push(`${exercise.reps}回`);
                        if (exercise.setsCount && exercise.setsCount > 1) parts.push(`${exercise.setsCount}セット`);
                        if (exercise.duration && exercise.duration > 0 && !exercise.reps && !exercise.weight) parts.push(`${exercise.duration}分`);
                        
                        // WeightSets表示
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
                                  セット{setIndex + 1}: {set.weight}kg × {set.reps}回
                                </div>
                              ))}
                            </div>
                          );
                        }
                        
                        // シンプルな詳細表示
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