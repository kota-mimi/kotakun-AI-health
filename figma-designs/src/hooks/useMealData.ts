import { useState } from 'react';

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

export function useMealData(selectedDate: Date, dateBasedData: any, updateDateData: (updates: any) => void) {
  const [isAddMealModalOpen, setIsAddMealModalOpen] = useState(false);
  const [isEditMealModalOpen, setIsEditMealModalOpen] = useState(false);
  const [isMealDetailModalOpen, setIsMealDetailModalOpen] = useState(false);
  const [currentMealType, setCurrentMealType] = useState<MealType>('breakfast');
  const [currentEditMeal, setCurrentEditMeal] = useState<Meal | null>(null);
  const [currentDetailMeal, setCurrentDetailMeal] = useState<Meal | null>(null);

  // 現在選択されている日付のデータを取得
  const getCurrentDateData = () => {
    const dateKey = selectedDate.toISOString().split('T')[0];
    return dateBasedData[dateKey] || { mealData: { breakfast: [], lunch: [], dinner: [], snack: [] } };
  };

  const currentDateData = getCurrentDateData();
  const mealData = currentDateData.mealData;

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

    return {
      totalCalories,
      targetCalories: 2000,
      pfc: {
        protein: totalProtein,
        fat: totalFat,
        carbs: totalCarbs,
        proteinTarget: 120,
        fatTarget: 60,
        carbsTarget: 250
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
    const meal = mealData[mealType].find(m => m.id === mealId);
    if (meal) {
      setCurrentMealType(mealType);
      setCurrentDetailMeal(meal);
      setIsMealDetailModalOpen(true);
    }
  };

  const handleEditFromDetail = () => {
    setIsMealDetailModalOpen(false);
    setCurrentEditMeal(currentDetailMeal);
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