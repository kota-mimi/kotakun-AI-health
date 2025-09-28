import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

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

  // 現在選択されている日付のデータを取得
  const getCurrentDateData = () => {
    const dateKey = selectedDate.toISOString().split('T')[0];
    return dateBasedData[dateKey] || { mealData: { breakfast: [], lunch: [], dinner: [], snack: [] } };
  };

  const currentDateData = getCurrentDateData();
  
  // Firestoreからデータを取得
  useEffect(() => {
    const fetchMealData = async () => {
      const lineUserId = liffUser?.userId || 'U7fd12476d6263912e0d9c99fc3a6bef9';
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

  const handleAddMealSubmit = (meal: Omit<Meal, 'id'>) => {
    const newMeal = {
      id: Date.now().toString(),
      ...meal
    };

    const currentData = getCurrentDateData();
    updateDateData({
      mealData: {
        ...currentData.mealData,
        [currentMealType]: [...currentData.mealData[currentMealType], newMeal]
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

  const handleUpdateMeal = (updatedMeal: Meal) => {
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

  const handleDeleteMeal = (mealId: string) => {
    const currentData = getCurrentDateData();
    updateDateData({
      mealData: {
        ...currentData.mealData,
        [currentMealType]: currentData.mealData[currentMealType].filter(meal => meal.id !== mealId)
      }
    });
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

  // モーダル閉じる処理
  const closeMealModals = () => {
    setIsAddMealModalOpen(false);
    setIsEditMealModalOpen(false);
    setIsMealDetailModalOpen(false);
    setCurrentEditMeal(null);
    setCurrentDetailMeal(null);
  };

  return {
    // データ
    mealData,
    calorieData: calculateDailyNutrition(),
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
    handleEditMeal,
    handleUpdateMeal,
    handleDeleteMeal,
    handleViewMealDetail,
    handleEditFromDetail,
    handleAddSimilarMeal,
    closeMealModals,
    
    // セッター（必要に応じて）
    setIsAddMealModalOpen,
    setIsEditMealModalOpen,
    setIsMealDetailModalOpen,
    setCurrentEditMeal,
    setCurrentDetailMeal
  };
}