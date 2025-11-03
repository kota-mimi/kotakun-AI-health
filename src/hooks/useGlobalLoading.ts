import { useState, useEffect } from 'react';

interface LoadingStates {
  counseling: boolean;
  weight: boolean;
  meal: boolean;
  exercise: boolean;
  feedback: boolean;
}

export function useGlobalLoading() {
  const [loadingStates, setLoadingStates] = useState<LoadingStates>({
    counseling: true,
    weight: true,
    meal: true,
    exercise: true,
    feedback: true,
  });

  // 全体のローディング状態を判定
  const isAnyLoading = Object.values(loadingStates).some(loading => loading);
  const isAllLoaded = Object.values(loadingStates).every(loading => !loading);

  // 特定のカテゴリのローディング状態を更新
  const setLoadingState = (category: keyof LoadingStates, isLoading: boolean) => {
    setLoadingStates(prev => ({
      ...prev,
      [category]: isLoading
    }));
  };

  // ローディング完了を監視
  useEffect(() => {
    if (isAllLoaded) {
      console.log('🎉 全データの読み込み完了');
    }
  }, [isAllLoaded]);

  return {
    loadingStates,
    isAnyLoading,
    isAllLoaded,
    setLoadingState,
    
    // 個別状態取得
    isCounselingLoading: loadingStates.counseling,
    isWeightLoading: loadingStates.weight,
    isMealLoading: loadingStates.meal,
    isExerciseLoading: loadingStates.exercise,
    isFeedbackLoading: loadingStates.feedback,
  };
}