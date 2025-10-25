import { useState, useEffect } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { useAuth } from './useAuth';
import { generateId } from '@/lib/utils';
import { apiCache, createCacheKey } from '@/lib/cache';

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

export function useExerciseData(selectedDate: Date, dateBasedData: any, updateDateData: (updates: any) => void) {
  try {
    
    // 運動プランデータをlocalStorageで永続化
    const workoutPlansStorage = useLocalStorage<WorkoutPlan[]>('healthApp_workoutPlans', []);

    // useAuth からLINE User IDを取得（体重データと同じ方法）
    const { liffUser } = useAuth();
    const lineUserId = liffUser?.userId;
    
  
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
      if (!selectedDate || isNaN(selectedDate.getTime())) {
        console.warn('⚠️ Invalid selectedDate in fetchExerciseData:', selectedDate);
        return;
      }
      // 日本時間ベースの日付でAPI取得（重要：UTCではなく日本時間）
      const currentDate = selectedDate.toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' }); // YYYY-MM-DD format
      
      // キャッシュキー生成
      const cacheKey = createCacheKey('exercises', lineUserId, currentDate);
      
      // キャッシュチェック（ただし5秒以内のデータは強制的に再取得）
      const cachedData = apiCache.get(cacheKey);
      const lastFetch = localStorage.getItem(`lastExerciseFetch_${lineUserId}_${currentDate}`);
      const now = Date.now();
      const shouldRefresh = !lastFetch || (now - parseInt(lastFetch)) < 5000; // 5秒以内は再取得
      
      if (cachedData && !shouldRefresh) {
        setFirestoreExerciseData(cachedData);
        return;
      }
      
      if (shouldRefresh) {
      }
      
      try {
        const response = await fetch(`/api/exercises?lineUserId=${lineUserId}&date=${currentDate}`);
        
        if (response.ok) {
          const result = await response.json();
          let exerciseData = result.data || [];
          
          // 開発環境でデータが空の場合、テストデータを追加
          if (exerciseData.length === 0 && process.env.NODE_ENV === 'development') {
            exerciseData = [
              {
                id: 'test-1',
                name: '腕立て伏せ',
                displayName: '腕立て伏せ 10回',
                type: 'strength',
                duration: 0,
                calories: 140,
                reps: 10,
                setsCount: null,
                weight: 0,
                weightSets: [],
                time: '21:10',
                timestamp: new Date().toISOString(),
                notes: 'テストデータ'
              },
              {
                id: 'test-2',
                name: 'ベンチプレス',
                displayName: 'ベンチプレス 120kg 10回 3セット',
                type: 'strength',
                duration: 0,
                calories: 280,
                reps: 10,
                setsCount: 3,
                weight: 120,
                weightSets: [{ weight: 120, reps: 10, sets: 3 }],
                time: '20:30',
                timestamp: new Date(Date.now() - 60000).toISOString(),
                notes: 'テストデータ'
              }
            ];
          }
          
          // デバッグ：取得したデータをログ出力
          
          // キャッシュに保存（5分間有効）
          apiCache.set(cacheKey, exerciseData, 5 * 60 * 1000);
          setFirestoreExerciseData(exerciseData);
          
          // 最終取得時刻を記録
          localStorage.setItem(`lastExerciseFetch_${lineUserId}_${currentDate}`, now.toString());
        }
      } catch (error) {
        console.error('🏃 useExerciseData fetch error:', error);
      }
    };
    
    fetchExerciseData();
  }, [selectedDate, lineUserId, isClient]);

  // 現在選択されている日付のデータを取得
  const getCurrentDateData = () => {
    if (!selectedDate || isNaN(selectedDate.getTime())) {
      console.warn('⚠️ Invalid selectedDate in useExerciseData getCurrentDateData:', selectedDate);
      return { exerciseData: [] };
    }
    // ローカルデータキー取得も日本時間ベース
    const dateKey = selectedDate.toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' }); // YYYY-MM-DD format
    return dateBasedData[dateKey] || { exerciseData: [] };
  };

  const currentDateData = getCurrentDateData();
  const localExerciseData = currentDateData.exerciseData || [];

  // 🚨 CRITICAL FIX: 食事データと同じパターンでFirestoreデータのみ使用（統合を無効化）
  const exerciseData = firestoreExerciseData;
  
  // 本番環境でも詳細ログを出力して問題を特定

  // 運動記録を追加する関数（Firestoreに保存）
  const handleAddExercise = async (exercise: Omit<Exercise, 'id' | 'time'>) => {
    const newExercise = {
      id: generateId(),
      time: new Date().toTimeString().slice(0, 5),
      calories: exercise.calories || 0,
      timestamp: new Date().toISOString(),
      notes: `APP記録 ${new Date().toLocaleTimeString('ja-JP', { timeZone: 'Asia/Tokyo' })}`,
      ...exercise
    };
    
    try {
      
      // 楽観的UI更新：即座にUIに追加
      setFirestoreExerciseData(prev => [...prev, newExercise]);
      
      // Firestoreに保存
      const dateStr = selectedDate.toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' });
      const response = await fetch('/api/exercises', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lineUserId,
          date: dateStr,
          exercise: newExercise
        })
      });
      
      if (response.ok) {
        // 最新データを取得して同期
        const fetchResponse = await fetch(`/api/exercises?lineUserId=${lineUserId}&date=${dateStr}`);
        if (fetchResponse.ok) {
          const data = await fetchResponse.json();
          if (data.success && data.data) {
            setFirestoreExerciseData(data.data);
          }
        }
      } else {
        console.error('❌ アプリからの運動記録保存失敗');
        // 失敗時はロールバック
        setFirestoreExerciseData(prev => prev.filter(ex => ex.id !== newExercise.id));
      }
    } catch (error) {
      console.error('❌ 運動記録保存エラー:', error);
      // エラー時もロールバック
      setFirestoreExerciseData(prev => prev.filter(ex => ex.id !== newExercise.id));
    }
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

  // 運動記録を削除する関数（本番環境向け）
  const handleDeleteExercise = async (exerciseId: string) => {
    try {
      
      // 楽観的UI更新：即座にUIから削除
      const currentData = getCurrentDateData();
      const optimisticUpdate = () => {
        // ローカルデータから削除
        updateDateData({
          exerciseData: currentData.exerciseData.filter((exercise: Exercise) => exercise.id !== exerciseId)
        });
        // Firestoreデータからも削除
        setFirestoreExerciseData(prev => prev.filter(ex => ex.id !== exerciseId));
      };
      
      optimisticUpdate();
      
      // Firestoreから削除（日本時間ベース）
      const dateStr = selectedDate.toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' }); // YYYY-MM-DD format
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
        // 削除成功：Firestoreから最新データを取得して同期
        const fetchResponse = await fetch(`/api/exercises?lineUserId=${lineUserId}&date=${dateStr}`);
        
        if (fetchResponse.ok) {
          const data = await fetchResponse.json();
          if (data.success && data.data) {
            setFirestoreExerciseData(data.data);
          }
        }
      } else {
        console.error('🚨 Production: Firestore exercise delete failed, rolling back:', response.status);
        // 削除失敗：ロールバック - 最新データを再取得してUI復元
        const fetchResponse = await fetch(`/api/exercises?lineUserId=${lineUserId}&date=${dateStr}`);
        
        if (fetchResponse.ok) {
          const data = await fetchResponse.json();
          if (data.success && data.data) {
            setFirestoreExerciseData(data.data);
          }
        }
        throw new Error('Firestore exercise delete failed');
      }
    } catch (error) {
      console.error('🚨 Production: Exercise deletion error, ensuring data consistency:', error);
      // エラー時：Firestoreから最新データを取得してデータ整合性を保証
      try {
        const dateStr = selectedDate.toISOString().split('T')[0];
        const fetchResponse = await fetch(`/api/exercises?lineUserId=${lineUserId}&date=${dateStr}`);
        
        if (fetchResponse.ok) {
          const data = await fetchResponse.json();
          if (data.success && data.data) {
            setFirestoreExerciseData(data.data);
          }
        }
      } catch (syncError) {
        console.error('🚨 Production: Failed to restore exercise data consistency:', syncError);
      }
    }
  };

  // 運動記録を更新する関数（本番環境向け）
  const handleUpdateExercise = async (exerciseId: string, updates: Partial<Exercise>) => {
    try {
      
      // 楽観的UI更新：即座にUIを更新
      const currentData = getCurrentDateData();
      const optimisticUpdate = () => {
        // ローカルデータを更新
        updateDateData({
          exerciseData: currentData.exerciseData.map((exercise: Exercise) => 
            exercise.id === exerciseId ? { ...exercise, ...updates } : exercise
          )
        });
        // Firestoreデータも更新
        setFirestoreExerciseData(prev => 
          prev.map(ex => ex.id === exerciseId ? { ...ex, ...updates } : ex)
        );
      };
      
      optimisticUpdate();
      
      // Firestoreで更新（日本時間ベース）
      const dateStr = selectedDate.toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' }); // YYYY-MM-DD format
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
        // 更新成功：Firestoreから最新データを取得して同期
        const fetchResponse = await fetch(`/api/exercises?lineUserId=${lineUserId}&date=${dateStr}`);
        
        if (fetchResponse.ok) {
          const data = await fetchResponse.json();
          if (data.success && data.data) {
            setFirestoreExerciseData(data.data);
          }
        }
      } else {
        console.error('🚨 Production: Firestore exercise update failed, rolling back:', response.status);
        // 更新失敗：ロールバック - 最新データを再取得してUI復元
        const fetchResponse = await fetch(`/api/exercises?lineUserId=${lineUserId}&date=${dateStr}`);
        
        if (fetchResponse.ok) {
          const data = await fetchResponse.json();
          if (data.success && data.data) {
            setFirestoreExerciseData(data.data);
          }
        }
        throw new Error('Firestore exercise update failed');
      }
    } catch (error) {
      console.error('🚨 Production: Exercise update error, ensuring data consistency:', error);
      // エラー時：Firestoreから最新データを取得してデータ整合性を保証
      try {
        const dateStr = selectedDate.toISOString().split('T')[0];
        const fetchResponse = await fetch(`/api/exercises?lineUserId=${lineUserId}&date=${dateStr}`);
        
        if (fetchResponse.ok) {
          const data = await fetchResponse.json();
          if (data.success && data.data) {
            setFirestoreExerciseData(data.data);
          }
        }
      } catch (syncError) {
        console.error('🚨 Production: Failed to restore exercise update data consistency:', syncError);
      }
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