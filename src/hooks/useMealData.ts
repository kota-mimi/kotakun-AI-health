import { useState, useEffect, useMemo } from 'react';
import { useAuth } from './useAuth';
import { generateId } from '@/lib/utils';

interface FoodItem {
  id: string;
  name: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
}

interface Meal {
  id: string;
  name: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  time: string;
  image?: string;
  images?: string[];
  foodItems?: FoodItem[];
}

interface MealData {
  breakfast: Meal[];
  lunch: Meal[];
  dinner: Meal[];
  snack: Meal[];
}

export type MealType = keyof MealData;

interface CounselingResult {
  aiAnalysis: {
    nutritionPlan: {
      dailyCalories: number;
      macros: {
        protein: number;
        carbs: number;
        fat: number;
      };
    };
  };
}

export function useMealData(selectedDate: Date, dateBasedData: any, updateDateData: (updates: any) => void, counselingResult?: CounselingResult | null) {
  const { liffUser } = useAuth();
  const [isAddMealModalOpen, setIsAddMealModalOpen] = useState(false);
  const [isEditMealModalOpen, setIsEditMealModalOpen] = useState(false);
  const [isMealDetailModalOpen, setIsMealDetailModalOpen] = useState(false);
  const [currentMealType, setCurrentMealType] = useState<MealType>('breakfast');
  const [currentEditMeal, setCurrentEditMeal] = useState<Meal | null>(null);
  const [currentDetailMeal, setCurrentDetailMeal] = useState<Meal | null>(null);
  const [firestoreMealData, setFirestoreMealData] = useState<MealData>({ breakfast: [], lunch: [], dinner: [], snack: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [addMealInitialMode, setAddMealInitialMode] = useState<'camera' | 'text' | 'album' | 'manual' | 'default'>('default');

  // 現在選択されている日付のデータを取得
  const getCurrentDateData = () => {
    if (!selectedDate || isNaN(selectedDate.getTime())) {
      console.warn('⚠️ Invalid selectedDate in useMealData:', selectedDate);
      return { mealData: { breakfast: [], lunch: [], dinner: [], snack: [] } };
    }
    const dateKey = selectedDate.toISOString().split('T')[0];
    return dateBasedData[dateKey] || { mealData: { breakfast: [], lunch: [], dinner: [], snack: [] } };
  };

  const currentDateData = getCurrentDateData();
  
  // Firestoreからデータを取得
  useEffect(() => {
    const fetchMealData = async () => {
      const lineUserId = liffUser?.userId;
      if (!lineUserId) return;
      if (!selectedDate || isNaN(selectedDate.getTime())) {
        console.warn('⚠️ Invalid selectedDate in fetchMealData:', selectedDate);
        return;
      }
      const dateStr = selectedDate.toISOString().split('T')[0];
      
      try {
        const response = await fetch('/api/meals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lineUserId, date: dateStr }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.mealData) {
            setFirestoreMealData(data.mealData);
          }
        }
      } catch (error) {
        console.error('食事データ取得エラー:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMealData();
  }, [selectedDate, liffUser?.userId]);

  // Firestoreデータとローカルデータを統合
  const mealData = {
    breakfast: [...firestoreMealData.breakfast, ...currentDateData.mealData?.breakfast || []],
    lunch: [...firestoreMealData.lunch, ...currentDateData.mealData?.lunch || []],
    dinner: [...firestoreMealData.dinner, ...currentDateData.mealData?.dinner || []],
    snack: [...firestoreMealData.snack, ...currentDateData.mealData?.snack || []]
  };

  // 動的カロリー・PFC計算
  const calculateDailyNutrition = () => {
    const allMeals = [
      ...mealData.breakfast,
      ...mealData.lunch,
      ...mealData.dinner,
      ...mealData.snack
    ];

    const totalCalories = allMeals.reduce((sum, meal) => sum + meal.calories, 0);
    const totalProtein = allMeals.reduce((sum, meal) => sum + (meal.protein || 0), 0);
    const totalFat = allMeals.reduce((sum, meal) => sum + (meal.fat || 0), 0);
    const totalCarbs = allMeals.reduce((sum, meal) => sum + (meal.carbs || 0), 0);

    // カウンセリング結果があればそれを使用、なければデフォルト値
    const targetCalories = counselingResult?.aiAnalysis?.nutritionPlan?.dailyCalories || 2000;
    const proteinTarget = counselingResult?.aiAnalysis?.nutritionPlan?.macros?.protein || 120;
    const fatTarget = counselingResult?.aiAnalysis?.nutritionPlan?.macros?.fat || 60;
    const carbsTarget = counselingResult?.aiAnalysis?.nutritionPlan?.macros?.carbs || 250;

    // カロリー計算ログ
    console.log('🍎 栄養目標値:', {
      カウンセリング結果: !!counselingResult,
      目標カロリー: targetCalories,
      タンパク質: proteinTarget,
      脂質: fatTarget,
      炭水化物: carbsTarget
    });

    return {
      totalCalories,
      targetCalories,
      pfc: {
        protein: totalProtein,
        fat: totalFat,
        carbs: totalCarbs,
        proteinTarget,
        fatTarget,
        carbsTarget
      }
    };
  };

  // 食事追加処理
  const handleAddMeal = (mealType: MealType) => {
    setCurrentMealType(mealType);
    setIsAddMealModalOpen(true);
  };

  const handleAddMealSubmit = async (meal: Omit<Meal, 'id'>) => {
    const newMeal = {
      id: generateId(),
      ...meal,
      createdAt: new Date(),
      mealType: currentMealType
    };

    try {
      // Firestoreに保存
      const lineUserId = liffUser?.userId;
      if (!lineUserId) return;
      if (!selectedDate || isNaN(selectedDate.getTime())) {
        console.warn('⚠️ Invalid selectedDate in addMeal:', selectedDate);
        return;
      }
      const dateStr = selectedDate.toISOString().split('T')[0];
      
      const response = await fetch('/api/meals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lineUserId,
          date: dateStr,
          mealType: currentMealType,
          mealData: newMeal
        }),
      });

      if (response.ok) {
        // Firestoreデータを更新
        setFirestoreMealData(prev => ({
          ...prev,
          [currentMealType]: [...prev[currentMealType], newMeal]
        }));
      } else {
        // Firestoreエラー時はローカルストレージに保存
        const currentData = getCurrentDateData();
        updateDateData({
          mealData: {
            ...currentData.mealData,
            [currentMealType]: [...currentData.mealData[currentMealType], newMeal]
          }
        });
      }
    } catch (error) {
      console.error('食事保存エラー:', error);
      // エラー時はローカルストレージに保存
      const currentData = getCurrentDateData();
      updateDateData({
        mealData: {
          ...currentData.mealData,
          [currentMealType]: [...currentData.mealData[currentMealType], newMeal]
        }
      });
    }
  };

  // 複数食事追加処理
  const handleAddMultipleMeals = (meals: Omit<Meal, 'id'>[]) => {
    const newMeals = meals.map(meal => ({
      id: generateId(),
      ...meal
    }));

    const currentData = getCurrentDateData();
    updateDateData({
      mealData: {
        ...currentData.mealData,
        [currentMealType]: [...currentData.mealData[currentMealType], ...newMeals]
      }
    });
  };

  // 食事編集処理
  const handleEditMeal = (mealType: MealType, mealId: string) => {
    const meal = mealData[mealType].find(m => m.id === mealId);
    if (meal) {
      setCurrentMealType(mealType);
      setCurrentEditMeal(meal);
      setIsEditMealModalOpen(true);
    }
  };

  const handleUpdateMeal = async (updatedMeal: Meal) => {
    const lineUserId = liffUser?.userId;
    if (!selectedDate || isNaN(selectedDate.getTime())) {
      console.warn('⚠️ Invalid selectedDate in updateMeal:', selectedDate);
      return;
    }
    const dateStr = selectedDate.toISOString().split('T')[0];
    
    // Firestoreデータに該当する食事があるかチェック
    const isFirestoreMeal = firestoreMealData[currentMealType].some(meal => meal.id === updatedMeal.id);
    
    if (isFirestoreMeal) {
      try {
        console.log('🔧 Updating Firestore meal:', updatedMeal.id);
        const response = await fetch('/api/meals', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lineUserId,
            date: dateStr,
            mealType: currentMealType,
            mealData: updatedMeal
          }),
        });

        if (response.ok) {
          console.log('🔧 Firestore update successful, updating local state');
          // Firestore更新成功時のみローカルstateを更新
          setFirestoreMealData(prev => ({
            ...prev,
            [currentMealType]: prev[currentMealType].map(meal => 
              meal.id === updatedMeal.id ? updatedMeal : meal
            )
          }));
        } else {
          console.error('🔧 Firestore update failed:', response.status);
          throw new Error('Firestore update failed');
        }
        return;
      } catch (error) {
        console.error('Firestore更新エラー:', error);
        // エラー時はローカルデータの更新にフォールバック
      }
    }
    
    // ローカルデータの更新
    console.log('🔧 Updating local meal data');
    const currentData = getCurrentDateData();
    updateDateData({
      mealData: {
        ...currentData.mealData,
        [currentMealType]: currentData.mealData[currentMealType].map(meal => 
          meal.id === updatedMeal.id ? updatedMeal : meal
        )
      }
    });
  };

  const handleUpdateMealFromEdit = async (updatedMeal: Meal) => {
    await handleUpdateMeal(updatedMeal);
  };

  const handleDeleteMealFromEdit = async (mealId: string) => {
    await handleDeleteMeal(mealId);
  };

  const handleDeleteMeal = async (mealId: string) => {
    console.log('🚨 handleDeleteMeal called with:', { mealId, userId: liffUser?.userId });
    const lineUserId = liffUser?.userId;
    if (!selectedDate || isNaN(selectedDate.getTime())) {
      console.warn('⚠️ Invalid selectedDate in deleteMeal:', selectedDate);
      return;
    }
    const dateStr = selectedDate.toISOString().split('T')[0];
    
    // 複数食事の個別削除かチェック（仮想IDの場合）
    let originalMealId = mealId;
    let individualMealIndex;
    
    if (mealId.includes('_')) {
      const parts = mealId.split('_');
      const lastPart = parts[parts.length - 1];
      // 最後の部分が数字で、全体が仮想ID（originalMealId_index形式）の場合のみ分割
      if (!isNaN(Number(lastPart)) && parts.length >= 3) {
        originalMealId = parts.slice(0, -1).join('_');
        individualMealIndex = Number(lastPart);
      }
    }
    
    // Firestoreデータに該当する食事があるかチェック（元のIDで確認）
    console.log('🔍 Checking Firestore meals:', { 
      currentMealType, 
      originalMealId, 
      firestoreMeals: firestoreMealData[currentMealType].map(m => m.id) 
    });
    const isFirestoreMeal = firestoreMealData[currentMealType].some(meal => meal.id === originalMealId);
    
    if (isFirestoreMeal) {
      try {
        console.log('🚨 Deleting Firestore meal:', { mealId, originalMealId, individualMealIndex });
        const response = await fetch('/api/meals', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lineUserId,
            date: dateStr,
            mealType: currentMealType,
            mealId,
            individualMealIndex
          }),
        });

        if (response.ok) {
          console.log('🚨 Firestore delete successful, refreshing data');
          // 削除成功時はデータを再取得
          const fetchResponse = await fetch('/api/meals', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lineUserId, date: dateStr }),
          });

          if (fetchResponse.ok) {
            const data = await fetchResponse.json();
            if (data.success && data.mealData) {
              setFirestoreMealData(data.mealData);
            }
          }
        } else {
          console.error('🚨 Firestore delete failed:', response.status);
          throw new Error('Firestore delete failed');
        }
        return;
      } catch (error) {
        console.error('食事削除エラー:', error);
        // エラー時はローカルデータの削除にフォールバック
      }
    }
    
    // ローカルデータから削除
    console.log('🚨 Deleting local meal data');
    const currentData = getCurrentDateData();
    updateDateData({
      mealData: {
        ...currentData.mealData,
        [currentMealType]: currentData.mealData[currentMealType].filter((meal: any) => meal.id !== mealId)
      }
    });
  };

  const handleDeleteIndividualMeal = (originalMealId: string, individualMealIndex: number) => {
    // 複数食事から個別の食事を削除
    const currentData = getCurrentDateData();
    const allMealTypes: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];
    
    for (const mealType of allMealTypes) {
      const mealIndex = currentData.mealData[mealType].findIndex(meal => meal.id === originalMealId);
      if (mealIndex !== -1) {
        const targetMeal = currentData.mealData[mealType][mealIndex];
        if (targetMeal.isMultipleMeals && targetMeal.meals) {
          // 該当する個別食事を削除
          const updatedMeals = targetMeal.meals.filter((_, index) => index !== individualMealIndex);
          
          if (updatedMeals.length === 0) {
            // 全て削除された場合は食事全体を削除
            updateDateData({
              mealData: {
                ...currentData.mealData,
                [mealType]: currentData.mealData[mealType].filter(meal => meal.id !== originalMealId)
              }
            });
          } else {
            // 一部削除の場合は更新
            const updatedMeal = { 
              ...targetMeal, 
              meals: updatedMeals,
              // 栄養価も再計算
              calories: updatedMeals.reduce((sum, meal) => sum + (meal.calories || 0), 0),
              protein: updatedMeals.reduce((sum, meal) => sum + (meal.protein || 0), 0),
              fat: updatedMeals.reduce((sum, meal) => sum + (meal.fat || 0), 0),
              carbs: updatedMeals.reduce((sum, meal) => sum + (meal.carbs || 0), 0)
            };
            
            updateDateData({
              mealData: {
                ...currentData.mealData,
                [mealType]: currentData.mealData[mealType].map(meal => 
                  meal.id === originalMealId ? updatedMeal : meal
                )
              }
            });
          }
        }
        break;
      }
    }
  };

  // 食事詳細表示処理
  const handleViewMealDetail = (mealType: MealType, mealId: string) => {
    console.log('🔥 handleViewMealDetail 呼び出し:', {
      mealType,
      mealId,
      mealData: mealData[mealType],
      mealIds: mealData[mealType].map(m => m.id)
    });
    
    const meal = mealData[mealType].find(m => m.id === mealId);
    console.log('🔥 見つかった食事:', meal);
    
    if (meal) {
      setCurrentMealType(mealType);
      setCurrentDetailMeal(meal);
      setIsMealDetailModalOpen(true);
      console.log('🔥 モーダル開いた!');
    } else {
      console.log('🔥 食事が見つからない!');
    }
  };

  const handleEditFromDetail = (mealId?: string, individualMealIndex?: number) => {
    setIsMealDetailModalOpen(false);
    
    if (mealId && individualMealIndex !== undefined) {
      // 個別食事の編集：複数食事から特定の食事だけを編集
      const allMeals = [...mealData.breakfast, ...mealData.lunch, ...mealData.dinner, ...mealData.snack];
      const targetMeal = allMeals.find(meal => meal.id === mealId);
      if (targetMeal && targetMeal.isMultipleMeals && targetMeal.meals) {
        const individualMeal = targetMeal.meals[individualMealIndex];
        if (individualMeal) {
          // 個別食事をMeal形式に変換
          const editMeal = {
            id: `${mealId}_${individualMealIndex}`, // 個別食事のID
            name: individualMeal.name,
            calories: individualMeal.calories || 0,
            protein: individualMeal.protein || 0,
            fat: individualMeal.fat || 0,
            carbs: individualMeal.carbs || 0,
            time: targetMeal.time,
            image: targetMeal.image,
            originalMealId: mealId, // 元の食事IDを保持
            individualMealIndex: individualMealIndex // インデックスを保持
          };
          setCurrentEditMeal(editMeal);
        }
      }
    } else {
      // 通常の編集（全体の食事）
      setCurrentEditMeal(currentDetailMeal);
    }
    
    setIsEditMealModalOpen(true);
  };

  const handleAddSimilarMeal = () => {
    setIsMealDetailModalOpen(false);
    if (currentDetailMeal) {
      const similarMeal = {
        ...currentDetailMeal,
        id: undefined, // 新しいIDが生成されるように
        time: new Date().toTimeString().slice(0, 5) // 現在時刻に設定
      };
      setCurrentEditMeal(similarMeal);
      setIsAddMealModalOpen(true);
    }
  };

  // 各記録方法に対応するハンドラー
  const handleCameraRecord = (mealType: MealType) => {
    setCurrentMealType(mealType);
    setAddMealInitialMode('camera');
    setIsAddMealModalOpen(true);
  };

  const handleTextRecord = (mealType: MealType) => {
    setCurrentMealType(mealType);
    setAddMealInitialMode('text');
    setIsAddMealModalOpen(true);
  };

  const handlePastRecord = (mealType: MealType) => {
    setCurrentMealType(mealType);
    setAddMealInitialMode('album');
    setIsAddMealModalOpen(true);
  };

  const handleManualRecord = (mealType: MealType) => {
    setCurrentMealType(mealType);
    setAddMealInitialMode('manual');
    setIsAddMealModalOpen(true);
  };

  // モーダル閉じる処理
  const closeMealModals = () => {
    setIsAddMealModalOpen(false);
    setIsEditMealModalOpen(false);
    setIsMealDetailModalOpen(false);
    setCurrentEditMeal(null);
    setCurrentDetailMeal(null);
    setAddMealInitialMode('default');
  };

  // カロリー・PFCデータをuseMemoで最適化（counselingResultの変更を監視）
  const calorieData = useMemo(() => {
    return calculateDailyNutrition();
  }, [mealData, counselingResult]);

  return {
    // データ
    mealData,
    calorieData,
    isLoading,
    
    // モーダル状態
    isAddMealModalOpen,
    isEditMealModalOpen,
    isMealDetailModalOpen,
    currentMealType,
    currentEditMeal,
    currentDetailMeal,
    
    // アクション
    handleAddMeal,
    handleAddMealSubmit,
    handleAddMultipleMeals,
    handleCameraRecord,
    handleTextRecord,
    handlePastRecord,
    handleManualRecord,
    handleEditMeal,
    handleUpdateMeal,
    handleUpdateMealFromEdit,
    handleDeleteMeal,
    handleDeleteMealFromEdit,
    handleDeleteIndividualMeal,
    handleViewMealDetail,
    handleEditFromDetail,
    handleAddSimilarMeal,
    closeMealModals,
    addMealInitialMode,
    
    // セッター（必要に応じて）
    setIsAddMealModalOpen,
    setIsEditMealModalOpen,
    setIsMealDetailModalOpen,
    setCurrentEditMeal,
    setCurrentDetailMeal
  };
}