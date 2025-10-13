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
    console.log('🏃 useExerciseData hook called with selectedDate:', selectedDate ? (isNaN(selectedDate.getTime()) ? 'Invalid Date' : selectedDate.toISOString().split('T')[0]) : 'undefined');
    
    // 運動プランデータをlocalStorageで永続化
    const workoutPlansStorage = useLocalStorage<WorkoutPlan[]>('healthApp_workoutPlans', []);

    // useAuth からLINE User IDを取得（体重データと同じ方法）
    const { liffUser } = useAuth();
    const lineUserId = liffUser?.userId;
    
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
      if (!selectedDate || isNaN(selectedDate.getTime())) {
        console.warn('⚠️ Invalid selectedDate in fetchExerciseData:', selectedDate);
        return;
      }
      // 日本時間ベースの日付でAPI取得（重要：UTCではなく日本時間）
      const currentDate = selectedDate.toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' }); // YYYY-MM-DD format
      console.log('🔍 PRODUCTION DEBUG: Exercise fetch date conversion:', { 
        selectedDate: selectedDate.toString(),
        utcDate: selectedDate.toISOString().split('T')[0],
        japanDate: currentDate
      });
      
      // キャッシュキー生成
      const cacheKey = createCacheKey('exercises', lineUserId, currentDate);
      
      // キャッシュチェック（ただし5秒以内のデータは強制的に再取得）
      const cachedData = apiCache.get(cacheKey);
      const lastFetch = localStorage.getItem(`lastExerciseFetch_${lineUserId}_${currentDate}`);
      const now = Date.now();
      const shouldRefresh = !lastFetch || (now - parseInt(lastFetch)) < 5000; // 5秒以内は再取得
      
      if (cachedData && !shouldRefresh) {
        console.log('🎯 運動データをキャッシュから取得:', currentDate);
        setFirestoreExerciseData(cachedData);
        return;
      }
      
      if (shouldRefresh) {
        console.log('🔄 最近更新があったため強制的にAPIから取得:', currentDate);
      }
      
      try {
        console.log('🔄 運動データをAPIから取得:', currentDate);
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
            console.log('🧪 開発環境：テストデータを追加');
          }
          
          // デバッグ：取得したデータをログ出力
          console.log('🏃 APIから取得した運動データ:', exerciseData.map(ex => ({
            name: ex.name,
            reps: ex.reps,
            weight: ex.weight,
            setsCount: ex.setsCount,
            weightSets: ex.weightSets
          })));
          
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

  // 🚨 CRITICAL FIX: データを統合する前に両方のデータセットをタイムスタンプでソートして混合
  // ローカルとFirestoreデータを分離してソート実行前に統合
  const allSourceData = [
    ...localExerciseData.map(ex => ({ ...ex, dataSource: 'LOCAL' })), 
    ...firestoreExerciseData.map(ex => ({ ...ex, dataSource: 'FIRESTORE' }))
  ];
  
  console.log('🔍 RAW UNSORTED DATA:', allSourceData.map((ex, index) => ({
    index,
    name: ex.name,
    time: ex.time,
    timestamp: ex.timestamp,
    dataSource: ex.dataSource,
    source: ex.notes?.includes('LINE') ? 'LINE' : 'APP'
  })));
  
  // 安定ソートを実装: インデックス付きでソートして元の順序を考慮
  const indexedData = allSourceData.map((exercise, index) => ({ exercise, originalIndex: index }));
  
  const sortedIndexedData = indexedData.sort((a, b) => {
    // timestampが存在する場合はそれを使用、ない場合はtimeを基準にする
    const getTimestamp = (exercise: Exercise) => {
      if (exercise.timestamp) {
        let timestamp: number;
        
        // FirestoreのTimestampオブジェクトかチェック
        if (exercise.timestamp && typeof exercise.timestamp === 'object' && 'toDate' in exercise.timestamp) {
          timestamp = (exercise.timestamp as any).toDate().getTime();
        } 
        // 通常のDateオブジェクト
        else if (exercise.timestamp instanceof Date) {
          timestamp = exercise.timestamp.getTime();
        }
        // 文字列の場合
        else {
          timestamp = new Date(exercise.timestamp).getTime();
        }
        
        return timestamp;
      }
      // timeから今日の日付でDateオブジェクトを作成（日本時間ベース）
      const today = selectedDate.toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' }); // YYYY-MM-DD format
      const dateTimeString = `${today} ${exercise.time}:00`; // 秒を追加して完全な時間形式にする
      const fallbackTime = new Date(dateTimeString).getTime();
      return fallbackTime;
    };
    
    const timeA = getTimestamp(a.exercise);
    const timeB = getTimestamp(b.exercise);
    
    const comparison = timeA - timeB;
    const sourceA = a.exercise.notes?.includes('LINE') ? 'LINE' : 'APP';
    const sourceB = b.exercise.notes?.includes('LINE') ? 'LINE' : 'APP';
    
    console.log(`🔄 STABLE SORT:`, {
      exerciseA: { name: a.exercise.name, time: a.exercise.time, calculatedTime: timeA, source: sourceA, originalIndex: a.originalIndex },
      exerciseB: { name: b.exercise.name, time: b.exercise.time, calculatedTime: timeB, source: sourceB, originalIndex: b.originalIndex },
      comparison,
      result: comparison < 0 ? 'A comes first' : comparison > 0 ? 'B comes first' : 'equal (will use originalIndex)'
    });
    
    // 時間が同じ場合は、記録された順番で安定ソート（LINEの方が新しいとして後に配置）
    if (Math.abs(comparison) < 1000) { // 1秒以内は同じ時間として扱う
      console.log(`⚖️ 時間が近いので記録源で判定: ${sourceA} vs ${sourceB}`);
      // LINEの方を後に配置する（アプリが先、LINEが後の記録順序を時間順に変換）
      if (sourceA !== sourceB) {
        return sourceA === 'LINE' ? -1 : 1; // LINEを先に、APPを後に
      }
      return a.originalIndex - b.originalIndex; // 同じ記録源なら元の順序
    }
    
    // 古い順（昇順）でソート - 記録源に関係なく時間順
    return comparison;
  });
  
  const exerciseData = sortedIndexedData.map(item => item.exercise);
  
  // 本番環境でも詳細ログを出力して問題を特定
  console.log('🏋️ EXERCISE DATA INTEGRATION (PRODUCTION DEBUG):', {
    localCount: localExerciseData.length,
    firestoreCount: firestoreExerciseData.length,
    totalCount: exerciseData.length,
    selectedDate: selectedDate.toISOString().split('T')[0],
    localData: localExerciseData.map(ex => ({ name: ex.name, time: ex.time, timestamp: ex.timestamp, notes: ex.notes })),
    firestoreData: firestoreExerciseData.map(ex => ({ name: ex.name, time: ex.time, timestamp: ex.timestamp, notes: ex.notes })),
    finalSortedOrder: exerciseData.map((ex, index) => ({
      index,
      name: ex.name,
      time: ex.time,
      timestamp: ex.timestamp,
      source: ex.notes?.includes('LINE') ? 'LINE' : 'APP'
    }))
  });

  // 運動記録を追加する関数
  const handleAddExercise = (exercise: Omit<Exercise, 'id' | 'time'>) => {
    const newExercise = {
      id: generateId(),
      time: new Date().toTimeString().slice(0, 5),
      calories: exercise.calories || 0,
      timestamp: new Date(), // timestampを追加
      notes: `APP記録 ${new Date().toLocaleTimeString('ja-JP', { timeZone: 'Asia/Tokyo' })}`, // アプリ記録として識別
      ...exercise
    };
    
    const currentData = getCurrentDateData();
    updateDateData({
      exerciseData: [...(currentData.exerciseData || []), newExercise]
    });
    
    // 追加後に強制的にデータを再取得してソートを確実に実行
    setTimeout(() => {
      console.log('🔄 運動追加後の強制リフレッシュ');
      window.location.reload();
    }, 100);
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
      console.log('🚨 Production: Deleting exercise from Firestore:', exerciseId);
      
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
      console.log('🔍 PRODUCTION DEBUG: Exercise delete date conversion:', { 
        selectedDate: selectedDate.toString(),
        utcDate: selectedDate.toISOString().split('T')[0],
        japanDate: dateStr
      });
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
        console.log('🚨 Production: Firestore exercise delete successful, fetching latest data');
        // 削除成功：Firestoreから最新データを取得して同期
        const fetchResponse = await fetch(`/api/exercises?lineUserId=${lineUserId}&date=${dateStr}`);
        
        if (fetchResponse.ok) {
          const data = await fetchResponse.json();
          if (data.success && data.data) {
            setFirestoreExerciseData(data.data);
            console.log('🚨 Production: Exercise data synchronized with Firestore');
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
            console.log('🚨 Production: Exercise rollback completed');
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
            console.log('🚨 Production: Exercise data consistency restored');
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
      console.log('🚨 Production: Updating exercise in Firestore:', exerciseId);
      
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
      console.log('🔍 PRODUCTION DEBUG: Exercise update date conversion:', { 
        selectedDate: selectedDate.toString(),
        utcDate: selectedDate.toISOString().split('T')[0],
        japanDate: dateStr
      });
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
        console.log('🚨 Production: Firestore exercise update successful, fetching latest data');
        // 更新成功：Firestoreから最新データを取得して同期
        const fetchResponse = await fetch(`/api/exercises?lineUserId=${lineUserId}&date=${dateStr}`);
        
        if (fetchResponse.ok) {
          const data = await fetchResponse.json();
          if (data.success && data.data) {
            setFirestoreExerciseData(data.data);
            console.log('🚨 Production: Exercise update data synchronized with Firestore');
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
            console.log('🚨 Production: Exercise update rollback completed');
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
            console.log('🚨 Production: Exercise update data consistency restored');
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