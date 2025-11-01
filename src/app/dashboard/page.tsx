'use client';

import React from 'react';
import { useSwipeable } from 'react-swipeable';

import { useDateBasedData } from '@/hooks/useDateBasedData';
import { useNavigationState } from '@/hooks/useNavigationState';
import { useMealData } from '@/hooks/useMealData';
import { useExerciseData } from '@/hooks/useExerciseData';
import { useWeightData } from '@/hooks/useWeightData';
import { useCounselingData } from '@/hooks/useCounselingData';
import { useFeedbackData } from '@/hooks/useFeedbackData';

import { CompactHeader } from '@/components/CompactHeader';
import { WeightCard } from '@/components/WeightCard';
import { CalorieCard } from '@/components/CalorieCard';
import { MealSummaryCard } from '@/components/MealSummaryCard';
import { WorkoutSummaryCard } from '@/components/WorkoutSummaryCard';
import { FeedbackCard } from '@/components/FeedbackCard';
import { BottomNavigation } from '@/components/BottomNavigation';
import { AddMealModal } from '@/components/AddMealModal';
import { EditMealModal } from '@/components/EditMealModal';
import { MealDetailModal } from '@/components/MealDetailModal';
import { CalendarModal } from '@/components/CalendarModal';
import { MyProfilePage } from '@/components/MyProfilePage';
import { SettingsPage } from '@/components/SettingsPage';
import { NutritionSettingsPage } from '@/components/NutritionSettingsPage';
import { PlanSettingsPage } from '@/components/PlanSettingsPage';
import { UserGuidePage } from '@/components/UserGuidePage';
import { ContactPage } from '@/components/ContactPage';
import { ReminderSettingsPage } from '@/components/ReminderSettingsPage';
import { WeightEntryModal } from '@/components/WeightEntryModal';
import { WeightSettingsModal } from '@/components/WeightSettingsModal';
import { DataManagementModal } from '@/components/DataManagementModal';
import { WeightChart } from '@/components/WeightChart';
import { ExerciseEntryModal } from '@/components/ExerciseEntryModal';
import { ExerciseEditModal } from '@/components/ExerciseEditModal';
import { FloatingShortcutBar } from '@/components/FloatingShortcutBar';

export default function DashboardPage() {
  const [hasError, setHasError] = React.useState(false);
  const [isClient, setIsClient] = React.useState(false);
  
  React.useEffect(() => {
    setIsClient(true);
  }, []);

  // サーバーサイドでは何も表示しない
  if (!isClient) {
    return <div className="min-h-screen bg-gray-50" />;
  }

  // エラーハンドリング
  if (hasError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center">
          <h1 className="text-xl font-semibold mb-4">ホームページでエラーが発生しました</h1>
          <button 
            onClick={() => setHasError(false)} 
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            再試行
          </button>
        </div>
      </div>
    );
  }

  try {
    return <DashboardContent onError={() => setHasError(true)} />;
  } catch (error) {
    console.error('Dashboard render error:', error);
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center">
          <h1 className="text-xl font-semibold mb-4">ホームページの読み込みに失敗しました</h1>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            ページを再読み込み
          </button>
        </div>
      </div>
    );
  }
}

function DashboardContent({ onError }: { onError: () => void }) {
  const navigation = useNavigationState();
  const dateBasedDataManager = useDateBasedData();
  
  // URLパラメータに基づいてプラン設定ページを開く
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    if (tab === 'plan') {
      // プロフィールタブに切り替えてからプラン設定ページを開く
      navigation.setActiveTab('profile');
      navigation.handleNavigateToPlanSettings();
    }
  }, []);
  
  const [isDataManagementModalOpen, setIsDataManagementModalOpen] = React.useState(false);
  const [isMealMenuOpen, setIsMealMenuOpen] = React.useState(false);
  const [isExerciseEntryModalOpen, setIsExerciseEntryModalOpen] = React.useState(false);
  const [isExerciseEditModalOpen, setIsExerciseEditModalOpen] = React.useState(false);
  const [selectedExerciseForEdit, setSelectedExerciseForEdit] = React.useState(null);
  
  const currentDateData = dateBasedDataManager?.getCurrentDateData?.(navigation?.selectedDate) || { mealData: { breakfast: [], lunch: [], dinner: [], snack: [] } };
  
  const updateDateData = (updates: any) => {
    try {
      dateBasedDataManager?.updateDateData?.(navigation?.selectedDate, updates);
    } catch (error) {
      console.error('updateDateData error:', error);
      onError();
    }
  };

  const { counselingResult } = useCounselingData(); // 本番環境対応・エラー耐性強化版

  const mealManager = useMealData(
    navigation?.selectedDate || new Date(), 
    dateBasedDataManager?.dateBasedData || {}, 
    updateDateData,
    counselingResult
  );

  const exerciseManager = useExerciseData(
    navigation?.selectedDate || new Date(), 
    dateBasedDataManager?.dateBasedData || {}, 
    updateDateData
  );

  const weightManager = useWeightData(
    navigation?.selectedDate || new Date(),
    dateBasedDataManager?.dateBasedData || {},
    updateDateData,
    counselingResult
  );

  const feedbackManager = useFeedbackData(
    navigation?.selectedDate || new Date(),
    dateBasedDataManager?.dateBasedData || {},
    updateDateData
  );

  // 現在の時間に基づいて適切な食事タイプを判定

  const getCurrentMealType = () => {
    const now = new Date();
    const hour = now.getHours();
    
    if (hour >= 5 && hour < 11) return 'breakfast'; // 5:00-10:59 朝食
    if (hour >= 11 && hour < 15) return 'lunch';    // 11:00-14:59 昼食
    if (hour >= 15 && hour < 19) return 'snack';    // 15:00-18:59 間食
    return 'dinner'; // 19:00-4:59 夕食
  };

  // スワイプで日付移動する関数
  const handleSwipeLeft = () => {
    // 左スワイプ = 翌日へ
    const nextDay = new Date(navigation.selectedDate);
    nextDay.setDate(nextDay.getDate() + 1);
    navigation.handleDateSelect(nextDay);
  };

  const handleSwipeRight = () => {
    // 右スワイプ = 前日へ
    const prevDay = new Date(navigation.selectedDate);
    prevDay.setDate(prevDay.getDate() - 1);
    navigation.handleDateSelect(prevDay);
  };

  // スワイプハンドラーを設定
  const swipeHandlers = useSwipeable({
    onSwipedLeft: handleSwipeLeft,
    onSwipedRight: handleSwipeRight,
    trackMouse: true, // マウスドラッグでもテスト可能
    preventScrollOnSwipe: false, // 縦スクロールは維持
    delta: 50, // 50px以上のスワイプで発動
  });


  return (
    <div className="min-h-screen relative bg-gradient-to-br from-orange-50 to-amber-50">
      
      {/* プロフィール・設定タブ */}
      {navigation.activeTab === 'profile' && (
        <>
          {!navigation.showSettings && !navigation.showNutritionSettings && !navigation.showPlanSettings && !navigation.showUserGuide && !navigation.showContact && !navigation.showReminderSettings ? (
            <div className="relative py-4 pb-20 space-y-4">
              <MyProfilePage 
                onNavigateToSettings={navigation.handleNavigateToSettings}
                onNavigateToData={() => {}} // 削除：データページはもうない
                onNavigateToPlanSettings={navigation.handleNavigateToPlanSettings}
                onNavigateToUserGuide={navigation.handleNavigateToUserGuide}
                onNavigateToContact={navigation.handleNavigateToContact}
                onNavigateToReminderSettings={navigation.handleNavigateToReminderSettings}
                onNavigateToCounseling={() => {
                  window.location.href = '/counseling';
                }}
              />
            </div>
          ) : navigation.showSettings && !navigation.showNutritionSettings ? (
            <div className="relative px-4 py-4 pb-20 space-y-4">
              <SettingsPage 
                onBack={navigation.handleBackFromSettings} 
                onNavigateToNutritionSettings={navigation.handleNavigateToNutritionSettings}
              />
            </div>
          ) : navigation.showNutritionSettings ? (
            <NutritionSettingsPage 
              onBack={navigation.handleBackFromNutritionSettings}
              selectedNutrients={navigation.selectedNutrients}
              onNutrientChange={navigation.handleNutrientChange}
            />
          ) : navigation.showPlanSettings ? (
            <PlanSettingsPage 
              onBack={navigation.handleBackFromPlanSettings}
            />
          ) : navigation.showUserGuide ? (
            <UserGuidePage 
              onBack={navigation.handleBackFromUserGuide}
            />
          ) : navigation.showContact ? (
            <ContactPage 
              onBack={navigation.handleBackFromContact}
            />
          ) : navigation.showReminderSettings ? (
            <ReminderSettingsPage 
              onBack={navigation.handleBackFromReminderSettings}
            />
          ) : null}
        </>
      )}


      {/* ホームタブ */}
      {navigation?.activeTab === 'home' && (
        <>
          <div className={`transition-all duration-300 ${isMealMenuOpen ? 'blur-xl' : ''}`}>
            {navigation?.selectedDate && (
              <CompactHeader
                currentDate={navigation.selectedDate}
                onDateSelect={navigation.handleDateSelect}
                onCalendar={navigation.handleCalendar}
                onNavigateToProfile={() => navigation.setActiveTab('profile')}
                onNavigateToData={() => {}} // 削除：データページなし
                counselingResult={counselingResult}
              />
            )}
          </div>

          <div {...swipeHandlers} className="relative px-4 py-4 pb-24 space-y-4">
            {/* 体重カード - クリックで体重入力モーダル */}
            <div className={`transition-all duration-300 ${isMealMenuOpen ? 'blur-xl' : ''}`}>
              {weightManager?.weightData && (
                <WeightCard 
                  data={weightManager.weightData} 
                  onNavigateToWeight={() => weightManager.setIsWeightEntryModalOpen?.(true)}
                  counselingResult={counselingResult}
                  selectedDate={navigation?.selectedDate}
                />
              )}
            </div>


            {/* カロリーカード */}
            <div className={`transition-all duration-300 ${isMealMenuOpen ? 'blur-xl' : ''}`}>
              {mealManager && (
                <CalorieCard 
                  totalCalories={mealManager.calorieData?.totalCalories || 0}
                  targetCalories={mealManager.calorieData?.targetCalories || 2000}
                  pfc={mealManager.calorieData?.pfc || { protein: 0, fat: 0, carbs: 0, proteinTarget: 120, fatTarget: 60, carbsTarget: 250 }}
                  counselingResult={counselingResult}
                  exerciseData={exerciseManager?.exerciseData || []}
                  selectedDate={navigation.selectedDate}
                />
              )}
            </div>

            {/* 食事カード */}
            {mealManager?.mealData && (
              <MealSummaryCard
                meals={mealManager.mealData}
                onAddMeal={mealManager.handleAddMeal || (() => {})}
                onCameraRecord={mealManager.handleCameraRecord || (() => {})}
                onTextRecord={mealManager.handleTextRecord || (() => {})}
                onPastRecord={mealManager.handlePastRecord || (() => {})}
                onManualRecord={mealManager.handleManualRecord || (() => {})}
                onViewMealDetail={mealManager.handleViewMealDetail || (() => {})}
                onEditMeal={mealManager.handleEditMeal || (() => {})}
                onEditIndividualMeal={mealManager.handleEditFromDetail || (() => {})}
                onNavigateToMeal={() => {}} // 削除：専用ページなし
                onMenuOpenChange={setIsMealMenuOpen}
              />
            )}

            {/* 運動カード */}
            <div className={`transition-all duration-300 ${isMealMenuOpen ? 'blur-xl' : ''}`}>
              {exerciseManager?.exerciseData && navigation?.selectedDate && (
                <WorkoutSummaryCard 
                  exerciseData={exerciseManager.exerciseData}
                  selectedDate={navigation.selectedDate}
                  onNavigateToWorkout={() => {}} // 削除：専用ページなし
                  onAddExercise={() => setIsExerciseEntryModalOpen(true)}
                  onEditExercise={(exerciseId) => {
                    const exercise = exerciseManager.exerciseData?.find?.(ex => ex.id === exerciseId);
                    if (exercise) {
                      setSelectedExerciseForEdit(exercise);
                      setIsExerciseEditModalOpen(true);
                    }
                  }}
                  onDeleteExercise={(exerciseId) => exerciseManager.handleDeleteExercise?.(exerciseId)}
                  onUpdateExercise={(exerciseId, updates) => exerciseManager.handleUpdateExercise?.(exerciseId, updates)}
                />
              )}
            </div>

            {/* フィードバックカード */}
            <div className={`transition-all duration-300 ${isMealMenuOpen ? 'blur-xl' : ''}`}>
              <FeedbackCard
                feedbackData={feedbackManager.feedbackData}
                isLoading={feedbackManager.isLoading}
                hasFeedbackData={feedbackManager.hasFeedbackData}
                onGenerateFeedback={feedbackManager.generateFeedback}
                selectedDate={navigation.selectedDate}
                onNavigateToCounseling={() => {
                  window.location.href = '/counseling';
                }}
              />
            </div>
          </div>


        </>
      )}


      {/* ボトムナビゲーション */}
      <div className={`transition-all duration-300 ${isMealMenuOpen ? 'blur-xl' : ''}`}>
        {navigation?.activeTab && navigation?.setActiveTab && (
          <BottomNavigation
            activeTab={navigation.activeTab}
            onTabChange={navigation.setActiveTab}
          />
        )}
      </div>

      {/* 共通モーダル群 */}
      {navigation?.isCalendarModalOpen !== undefined && navigation?.selectedDate && (
        <CalendarModal
          isOpen={navigation.isCalendarModalOpen}
          onClose={() => navigation.setIsCalendarModalOpen?.(false)}
          selectedDate={navigation.selectedDate}
          onDateSelect={navigation.handleDateSelect}
          counselingResult={counselingResult}
        />
      )}

      <WeightEntryModal
        isOpen={weightManager.isWeightEntryModalOpen}
        onClose={() => weightManager.setIsWeightEntryModalOpen(false)}
        onSubmit={weightManager.handleAddWeightEntry}
        currentWeight={weightManager.weightData.current}
      />

      <WeightSettingsModal
        isOpen={weightManager.isWeightSettingsModalOpen}
        onClose={() => weightManager.setIsWeightSettingsModalOpen(false)}
        currentSettings={weightManager.weightSettings}
        onUpdateSettings={weightManager.handleUpdateWeightSettings}
      />

      <DataManagementModal
        isOpen={isDataManagementModalOpen}
        onClose={() => setIsDataManagementModalOpen(false)}
        onExportData={dateBasedDataManager.exportData}
        onImportData={dateBasedDataManager.importData}
        onClearAllData={dateBasedDataManager.clearAllData}
      />


      {/* 食事記録モーダル群 - 全タブで共通 */}
      <AddMealModal
        isOpen={mealManager.isAddMealModalOpen}
        onClose={() => mealManager.setIsAddMealModalOpen(false)}
        mealType={mealManager.currentMealType}
        onAddMeal={mealManager.handleAddMealSubmit}
        onAddMultipleMeals={mealManager.handleAddMultipleMeals}
        allMealsData={mealManager.mealData}
      />

      <EditMealModal
        key={`${mealManager.currentEditMeal?.id || 'empty'}_${mealManager.currentEditMeal?.name || ''}_${mealManager.currentEditMeal?.originalMealId || 'none'}_${mealManager.currentEditMeal?.individualMealIndex || 'single'}`}
        isOpen={mealManager.isEditMealModalOpen}
        onClose={() => {
          mealManager.setIsEditMealModalOpen(false);
          mealManager.setCurrentEditMeal(null);
        }}
        mealType={mealManager.currentMealType}
        meal={mealManager.currentEditMeal}
        onUpdateMeal={mealManager.handleUpdateMealFromEdit}
        onDeleteMeal={mealManager.handleDeleteMealFromEdit}
        onDeleteIndividualMeal={mealManager.handleDeleteIndividualMeal}
      />

      <MealDetailModal
        isOpen={mealManager.isMealDetailModalOpen}
        onClose={() => {
          mealManager.setIsMealDetailModalOpen(false);
          mealManager.setCurrentDetailMeal(null);
        }}
        meal={mealManager.currentDetailMeal}
        mealType={mealManager.currentMealType}
        onEditMeal={mealManager.handleEditFromDetail}
        onAddSimilarMeal={mealManager.handleAddSimilarMeal}
        onDeleteIndividualMeal={mealManager.handleDeleteIndividualMeal}
        allMealsOfType={mealManager.mealData[mealManager.currentMealType] || []}
      />

      {/* 運動記録モーダル */}
      <ExerciseEntryModal
        isOpen={isExerciseEntryModalOpen}
        onClose={() => setIsExerciseEntryModalOpen(false)}
        onSubmit={exerciseManager.handleAddSimpleExercise}
        userWeight={weightManager.weightData.current || counselingResult?.answers?.weight || 70}
      />

      {/* 運動編集モーダル */}
      <ExerciseEditModal
        isOpen={isExerciseEditModalOpen}
        onClose={() => {
          setIsExerciseEditModalOpen(false);
          setSelectedExerciseForEdit(null);
        }}
        onUpdate={(exerciseId, updates) => {
          exerciseManager.handleUpdateExercise(exerciseId, updates);
        }}
        onDelete={(exerciseId) => {
          exerciseManager.handleDeleteExercise(exerciseId);
        }}
        exercise={selectedExerciseForEdit}
        userWeight={weightManager.weightData.current || counselingResult?.answers?.weight || 70}
      />

    </div>
  );
}