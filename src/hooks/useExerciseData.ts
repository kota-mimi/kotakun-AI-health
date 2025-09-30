import { useState } from 'react';
import { useLocalStorage } from './useLocalStorage';
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
  // 運動プランデータをlocalStorageで永続化
  const workoutPlansStorage = useLocalStorage<WorkoutPlan[]>('healthApp_workoutPlans', []);

  // 現在選択されている日付のデータを取得
  const getCurrentDateData = () => {
    const dateKey = selectedDate.toISOString().split('T')[0];
    return dateBasedData[dateKey] || { exerciseData: [] };
  };

  const currentDateData = getCurrentDateData();
  const exerciseData = currentDateData.exerciseData || [];

  // 運動記録を追加する関数
  const handleAddExercise = (exercise: Omit<Exercise, 'id' | 'time'>) => {
    const newExercise = {
      id: generateId(),
      time: new Date().toTimeString().slice(0, 5),
      calories: exercise.calories || 0,
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
  const handleDeleteExercise = (exerciseId: string) => {
    const currentData = getCurrentDateData();
    updateDateData({
      exerciseData: currentData.exerciseData.filter((exercise: Exercise) => exercise.id !== exerciseId)
    });
  };

  // 運動記録を更新する関数
  const handleUpdateExercise = (exerciseId: string, updates: Partial<Exercise>) => {
    const currentData = getCurrentDateData();
    updateDateData({
      exerciseData: currentData.exerciseData.map((exercise: Exercise) => 
        exercise.id === exerciseId ? { ...exercise, ...updates } : exercise
      )
    });
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
}