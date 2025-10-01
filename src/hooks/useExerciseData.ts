import { useState, useEffect } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { useAuth } from './useAuth';
import { generateId } from '@/lib/utils';

interface Exercise {
  id: string;
  name: string;
  type: 'cardio' | 'strength' | 'flexibility' | 'sports';
  duration: number;
  calories: number;
  sets?: { weight: number; reps: number; }[];
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

export function useExerciseData(selectedDate: Date, dateBasedData: any, updateDateData: (updates: any) => void) {
  try {
    console.log('🏃 useExerciseData hook called with selectedDate:', selectedDate.toISOString().split('T')[0]);
    
    // 運動プランデータをlocalStorageで永続化
    const workoutPlansStorage = useLocalStorage<WorkoutPlan[]>('healthApp_workoutPlans', []);

    // useAuth からLINE User IDを取得（体重データと同じ方法）
    const { liffUser } = useAuth();
    const lineUserId = liffUser?.userId || 'U7fd12476d6263912e0d9c99fc3a6bef9';
    
    console.log('🏃 useExerciseData initialized with lineUserId:', lineUserId);
  
  // クライアントサイドマウント状態（useWeightDataと同じパターン）
  const [isClient, setIsClient] = useState(false);
  
  // Firestoreから運動データを取得するstate
  const [firestoreExerciseData, setFirestoreExerciseData] = useState<Exercise[]>([]);

  // クライアントサイドでのマウントを確認（useWeightDataと同じパターン）
  useEffect(() => {
    setIsClient(true);
  }, []);

  // useEffect でのデータ取得（緊急フェッチはWorkoutSummaryCardで処理）
  useEffect(() => {
    if (!isClient) return;
    
    const fetchExerciseData = async () => {
      const currentDate = selectedDate.toISOString().split('T')[0];
      
      try {
        const response = await fetch(`/api/exercises?lineUserId=${lineUserId}&date=${currentDate}`);
        
        if (response.ok) {
          const result = await response.json();
          setFirestoreExerciseData(result.data || []);
        }
      } catch (error) {
        console.error('🏃 useExerciseData fetch error:', error);
      }
    };
    
    fetchExerciseData();
  }, [selectedDate, lineUserId, isClient]);

  // 現在選択されている日付のデータを取得
  const getCurrentDateData = () => {
    const dateKey = selectedDate.toISOString().split('T')[0];
    return dateBasedData[dateKey] || { exerciseData: [] };
  };

  const currentDateData = getCurrentDateData();
  const localExerciseData = currentDateData.exerciseData || [];

  // ローカルストレージとFirestoreのデータを統合し、時系列順（新しい順）にソート
  const exerciseData = [...localExerciseData, ...firestoreExerciseData].sort((a, b) => {
    // timestampが存在する場合はそれを使用、ない場合はtimeを基準にする
    const getTimestamp = (exercise: Exercise) => {
      if (exercise.timestamp) {
        return exercise.timestamp instanceof Date ? exercise.timestamp.getTime() : new Date(exercise.timestamp).getTime();
      }
      // timeから今日の日付でDateオブジェクトを作成
      const today = selectedDate.toISOString().split('T')[0];
      return new Date(`${today} ${exercise.time}`).getTime();
    };
    
    const timeA = getTimestamp(a);
    const timeB = getTimestamp(b);
    
    // 新しい順（降順）でソート
    return timeB - timeA;
  });
  
  console.log('🏋️ EXERCISE DATA INTEGRATION:', {
    localCount: localExerciseData.length,
    firestoreCount: firestoreExerciseData.length,
    totalCount: exerciseData.length,
    selectedDate: selectedDate.toISOString().split('T')[0],
    firestoreData: firestoreExerciseData,
    localData: localExerciseData
  });

  // 運動記録を追加する関数
  const handleAddExercise = (exercise: Omit<Exercise, 'id' | 'time'>) => {
    const newExercise = {
      id: generateId(),
      time: new Date().toTimeString().slice(0, 5),
      calories: exercise.calories || 0,
      timestamp: new Date(), // timestampを追加
      ...exercise
    };
    
    const currentData = getCurrentDateData();
    updateDateData({
      exerciseData: [...(currentData.exerciseData || []), newExercise]
    });
  };

  // 簡単な運動記録を追加する関数（新しいモーダル用）
  const handleAddSimpleExercise = (data: any) => {
    // 新しい形式のデータを処理
    if (data.name && data.type) {
      const newExercise: Omit<Exercise, 'id' | 'time'> = {
        name: data.name,
        type: data.type,
        duration: data.duration,
        calories: data.calories,
        sets: data.sets,
        distance: data.distance,
        notes: data.note
      };
      handleAddExercise(newExercise);
      return;
    }

    // 古い形式のデータ（後方互換性のため）
    const exerciseTypeMap: Record<string, Exercise['type']> = {
      'ウォーキング': 'cardio',
      'ランニング': 'cardio',
      '筋トレ': 'strength',
      'その他': 'cardio'
    };

    const newExercise: Omit<Exercise, 'id' | 'time'> = {
      name: data.type,
      type: exerciseTypeMap[data.type] || 'cardio',
      duration: data.duration,
      calories: data.calories,
      notes: data.note
    };

    handleAddExercise(newExercise);
  };

  // 運動記録を削除する関数
  const handleDeleteExercise = async (exerciseId: string) => {
    try {
      // まずローカルデータから削除を試行
      const currentData = getCurrentDateData();
      const localExercise = currentData.exerciseData.find((ex: Exercise) => ex.id === exerciseId);
      
      if (localExercise) {
        // ローカルデータの場合
        updateDateData({
          exerciseData: currentData.exerciseData.filter((exercise: Exercise) => exercise.id !== exerciseId)
        });
        console.log('ローカル運動データ削除:', exerciseId);
      } else {
        // Firestoreデータの場合、APIで削除
        const dateStr = selectedDate.toISOString().split('T')[0];
        const response = await fetch('/api/exercises', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            lineUserId,
            date: dateStr,
            exerciseId
          })
        });
        
        if (response.ok) {
          console.log('Firestore運動データ削除成功:', exerciseId);
          // Firestoreデータを再取得して更新
          setFirestoreExerciseData(prev => prev.filter(ex => ex.id !== exerciseId));
        } else {
          console.error('Firestore運動データ削除失敗:', response.status);
        }
      }
    } catch (error) {
      console.error('運動データ削除エラー:', error);
    }
  };

  // 運動記録を更新する関数
  const handleUpdateExercise = async (exerciseId: string, updates: Partial<Exercise>) => {
    try {
      // まずローカルデータから更新を試行
      const currentData = getCurrentDateData();
      const localExercise = currentData.exerciseData.find((ex: Exercise) => ex.id === exerciseId);
      
      if (localExercise) {
        // ローカルデータの場合
        updateDateData({
          exerciseData: currentData.exerciseData.map((exercise: Exercise) => 
            exercise.id === exerciseId ? { ...exercise, ...updates } : exercise
          )
        });
        console.log('ローカル運動データ更新:', exerciseId);
      } else {
        // Firestoreデータの場合、APIで更新
        const dateStr = selectedDate.toISOString().split('T')[0];
        const response = await fetch('/api/exercises', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            lineUserId,
            date: dateStr,
            exerciseId,
            updates
          })
        });
        
        if (response.ok) {
          console.log('Firestore運動データ更新成功:', exerciseId);
          // Firestoreデータを更新
          setFirestoreExerciseData(prev => 
            prev.map(ex => ex.id === exerciseId ? { ...ex, ...updates } : ex)
          );
        } else {
          console.error('Firestore運動データ更新失敗:', response.status);
        }
      }
    } catch (error) {
      console.error('運動データ更新エラー:', error);
    }
  };

  // 運動プランを追加する関数（localStorage自動保存）
  const handleAddPlan = (plan: Omit<WorkoutPlan, 'id'>) => {
    const newPlan = {
      id: generateId(),
      ...plan
    };
    workoutPlansStorage.setValue(prev => [...prev, newPlan]);
  };

  // 運動プランを削除する関数（localStorage自動保存）
  const handleDeletePlan = (planId: string) => {
    workoutPlansStorage.setValue(prev => prev.filter(plan => plan.id !== planId));
  };

  // プランのエクササイズを追加する関数（localStorage自動保存）
  const handleAddExerciseToPlan = (planId: string, exercise: Omit<WorkoutPlan['exercises'][0], 'id'>) => {
    const newExercise = {
      id: generateId(),
      ...exercise
    };
    workoutPlansStorage.setValue(prev => 
      prev.map(plan => 
        plan.id === planId 
          ? { ...plan, exercises: [...plan.exercises, newExercise] }
          : plan
      )
    );
  };

  // プランからエクササイズを削除する関数（localStorage自動保存）
  const handleDeleteExerciseFromPlan = (planId: string, exerciseId: string) => {
    workoutPlansStorage.setValue(prev => 
      prev.map(plan => 
        plan.id === planId 
          ? { ...plan, exercises: plan.exercises.filter(ex => ex.id !== exerciseId) }
          : plan
      )
    );
  };

  return {
    // データ
    exerciseData,
    workoutPlans: workoutPlansStorage.value,
    
    // アクション
    handleAddExercise,
    handleAddSimpleExercise,
    handleDeleteExercise,
    handleUpdateExercise,
    handleAddPlan,
    handleDeletePlan,
    handleAddExerciseToPlan,
    handleDeleteExerciseFromPlan,
    
    // セッター（必要に応じて）
    setWorkoutPlans: workoutPlansStorage.setValue
  };

  } catch (error) {
    console.error('🏃 CRITICAL ERROR in useExerciseData:', error);
    return {
      exerciseData: [],
      workoutPlans: [],
      handleAddExercise: () => {},
      handleAddSimpleExercise: () => {},
      handleDeleteExercise: async () => {},
      handleUpdateExercise: async () => {},
      handleAddPlan: () => {},
      handleDeletePlan: () => {},
      handleAddExerciseToPlan: () => {},
      handleDeleteExerciseFromPlan: () => {},
      setWorkoutPlans: () => {}
    };
  }
}