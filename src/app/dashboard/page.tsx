'use client';

import React from 'react';

import { useDateBasedData } from '@/hooks/useDateBasedData';
import { useNavigationState } from '@/hooks/useNavigationState';
import { useMealData } from '@/hooks/useMealData';
import { useExerciseData } from '@/hooks/useExerciseData';
import { useWeightData } from '@/hooks/useWeightData';
import { useCounselingData } from '@/hooks/useCounselingData';

import { CompactHeader } from '@/components/CompactHeader';
import { WeightCard } from '@/components/WeightCard';
import { CalorieCard } from '@/components/CalorieCard';
import { MealSummaryCard } from '@/components/MealSummaryCard';
import { WorkoutSummaryCard } from '@/components/WorkoutSummaryCard';
import { BottomNavigation } from '@/components/BottomNavigation';
import { AddMealModal } from '@/components/AddMealModal';
import { EditMealModal } from '@/components/EditMealModal';
import { MealDetailModal } from '@/components/MealDetailModal';
import { CalendarModal } from '@/components/CalendarModal';
import { MyProfilePage } from '@/components/MyProfilePage';
import { SettingsPage } from '@/components/SettingsPage';
import { NutritionSettingsPage } from '@/components/NutritionSettingsPage';
import { PlanSettingsPage } from '@/components/PlanSettingsPage';
import { PaymentSettingsPage } from '@/components/PaymentSettingsPage';
import { UserGuidePage } from '@/components/UserGuidePage';
import { ContactPage } from '@/components/ContactPage';
import { WeightEntryModal } from '@/components/WeightEntryModal';
import { WeightSettingsModal } from '@/components/WeightSettingsModal';
import { DataManagementModal } from '@/components/DataManagementModal';
import { WeightChart } from '@/components/WeightChart';
import { ExerciseEntryModal } from '@/components/ExerciseEntryModal';
import { ExerciseEditModal } from '@/components/ExerciseEditModal';
import { FloatingShortcutBar } from '@/components/FloatingShortcutBar';

export default function DashboardPage() {
  const navigation = useNavigationState();
  const dateBasedDataManager = useDateBasedData();
  
  const [isDataManagementModalOpen, setIsDataManagementModalOpen] = React.useState(false);
  const [isMealMenuOpen, setIsMealMenuOpen] = React.useState(false);
  const [isExerciseEntryModalOpen, setIsExerciseEntryModalOpen] = React.useState(false);
  const [isExerciseEditModalOpen, setIsExerciseEditModalOpen] = React.useState(false);
  const [selectedExerciseForEdit, setSelectedExerciseForEdit] = React.useState(null);
  
  const currentDateData = dateBasedDataManager.getCurrentDateData(navigation.selectedDate);
  
  const updateDateData = (updates: any) => {
    dateBasedDataManager.updateDateData(navigation.selectedDate, updates);
  };

  const { counselingResult } = useCounselingData(); // 本番環境対応・エラー耐性強化版

  const mealManager = useMealData(
    navigation.selectedDate, 
    dateBasedDataManager.dateBasedData, 
    updateDateData,
    counselingResult
  );

  const exerciseManager = useExerciseData(
    navigation.selectedDate, 
    dateBasedDataManager.dateBasedData, 
    updateDateData
  );

  const weightManager = useWeightData(
    navigation.selectedDate,
    dateBasedDataManager.dateBasedData,
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

  return (
    <div className="min-h-screen relative">
      
      {/* プロフィール・設定タブ */}
      {navigation.activeTab === 'profile' && (
        <>
          {!navigation.showSettings && !navigation.showNutritionSettings && !navigation.showPlanSettings && !navigation.showPaymentSettings && !navigation.showUserGuide && !navigation.showContact ? (
            <div className="relative py-4 pb-20 space-y-4">
              <MyProfilePage 
                onNavigateToSettings={navigation.handleNavigateToSettings}
                onNavigateToData={() => {}} // 削除：データページはもうない
                onNavigateToPlanSettings={navigation.handleNavigateToPlanSettings}
                onNavigateToPaymentSettings={navigation.handleNavigateToPaymentSettings}
                onNavigateToUserGuide={navigation.handleNavigateToUserGuide}
                onNavigateToContact={navigation.handleNavigateToContact}
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
          ) : navigation.showPaymentSettings ? (
            <PaymentSettingsPage 
              onBack={navigation.handleBackFromPaymentSettings}
            />
          ) : navigation.showUserGuide ? (
            <UserGuidePage 
              onBack={navigation.handleBackFromUserGuide}
            />
          ) : navigation.showContact ? (
            <ContactPage 
              onBack={navigation.handleBackFromContact}
            />
          ) : null}
        </>
      )}


      {/* ホームタブ */}
      {navigation.activeTab === 'home' && (
        <>
          <div className={`transition-all duration-300 ${isMealMenuOpen ? 'blur-xl' : ''}`}>
            <CompactHeader
              currentDate={navigation.selectedDate}
              onDateSelect={navigation.handleDateSelect}
              onCalendar={navigation.handleCalendar}
              onNavigateToProfile={() => navigation.setActiveTab('profile')}
              onNavigateToData={() => {}} // 削除：データページなし
              counselingResult={counselingResult}
            />
          </div>

          <div className="relative px-4 py-4 pb-24 space-y-4">
            {/* 体重カード - クリックで体重入力モーダル */}
            <div className={`transition-all duration-300 ${isMealMenuOpen ? 'blur-xl' : ''}`}>
              <WeightCard 
                data={weightManager.weightData} 
                onNavigateToWeight={() => weightManager.setIsWeightEntryModalOpen(true)}
                counselingResult={counselingResult}
              />
            </div>

            {/* 体重グラフ */}
            <div className={`transition-all duration-300 ${isMealMenuOpen ? 'blur-xl' : ''}`}>
              <WeightChart 
                data={weightManager.realWeightData}
                period="month"
                height={175}
                targetWeight={counselingResult?.answers?.targetWeight || weightManager.weightSettings.targetWeight}
                currentWeight={weightManager.weightData.current || counselingResult?.answers?.weight || 0}
                counselingResult={counselingResult}
              />
            </div>


            {/* カロリーカード */}
            <div className={`transition-all duration-300 ${isMealMenuOpen ? 'blur-xl' : ''}`}>
              <CalorieCard 
                totalCalories={mealManager.calorieData.totalCalories}
                targetCalories={mealManager.calorieData.targetCalories}
                pfc={mealManager.calorieData.pfc}
                counselingResult={counselingResult}
                exerciseData={exerciseManager.exerciseData}
              />
            </div>

            {/* 食事カード */}
            <MealSummaryCard
              meals={mealManager.mealData}
              onAddMeal={mealManager.handleAddMeal}
              onCameraRecord={mealManager.handleCameraRecord}
              onTextRecord={mealManager.handleTextRecord}
              onPastRecord={mealManager.handlePastRecord}
              onManualRecord={mealManager.handleManualRecord}
              onViewMealDetail={mealManager.handleViewMealDetail}
              onEditMeal={mealManager.handleEditMeal}
              onEditIndividualMeal={mealManager.handleEditFromDetail}
              onNavigateToMeal={() => {}} // 削除：専用ページなし
              onMenuOpenChange={setIsMealMenuOpen}
            />

            {/* 運動カード */}
            <div className={`transition-all duration-300 ${isMealMenuOpen ? 'blur-xl' : ''}`}>
              <WorkoutSummaryCard 
                exerciseData={exerciseManager.exerciseData}
                selectedDate={navigation.selectedDate}
                onNavigateToWorkout={() => {}} // 削除：専用ページなし
                onAddExercise={() => setIsExerciseEntryModalOpen(true)}
                onEditExercise={(exerciseId) => {
                  const exercise = exerciseManager.exerciseData.find(ex => ex.id === exerciseId);
                  if (exercise) {
                    setSelectedExerciseForEdit(exercise);
                    setIsExerciseEditModalOpen(true);
                  }
                }}
                onDeleteExercise={(exerciseId) => exerciseManager.handleDeleteExercise(exerciseId)}
              />
            </div>
          </div>


        </>
      )}


      {/* ボトムナビゲーション */}
      <div className={`transition-all duration-300 ${isMealMenuOpen ? 'blur-xl' : ''}`}>
        <BottomNavigation
          activeTab={navigation.activeTab}
          onTabChange={navigation.setActiveTab}
        />
      </div>

      {/* 共通モーダル群 */}
      <CalendarModal
        isOpen={navigation.isCalendarModalOpen}
        onClose={() => navigation.setIsCalendarModalOpen(false)}
        selectedDate={navigation.selectedDate}
        onDateSelect={navigation.handleDateSelect}
        counselingResult={counselingResult}
      />

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