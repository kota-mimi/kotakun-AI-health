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
import { AIAdviceCard } from '@/components/AIAdviceCard';
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

export default function DashboardPage() {
  const navigation = useNavigationState();
  const dateBasedDataManager = useDateBasedData();
  
  const [isDataManagementModalOpen, setIsDataManagementModalOpen] = React.useState(false);
  
  const currentDateData = dateBasedDataManager.getCurrentDateData(navigation.selectedDate);
  
  const updateDateData = (updates: any) => {
    dateBasedDataManager.updateDateData(navigation.selectedDate, updates);
  };

  const { counselingResult } = useCounselingData();

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
                onNavigateToDataManagement={() => setIsDataManagementModalOpen(true)}
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

      {/* 他のタブは全部ホーム画面を表示 */}
      {(navigation.activeTab === 'home' || navigation.activeTab === 'meal' || navigation.activeTab === 'weight' || navigation.activeTab === 'exercise') && (
        <>
          <CompactHeader
            currentDate={navigation.selectedDate}
            onDateSelect={navigation.handleDateSelect}
            onCalendar={navigation.handleCalendar}
            onNavigateToProfile={() => navigation.setActiveTab('profile')}
            onNavigateToData={() => {}} // 削除：データページなし
          />

          <div className="relative px-4 py-4 pb-20 space-y-4">
            {/* 体重カード - クリックで体重入力モーダル */}
            <WeightCard 
              data={weightManager.weightData} 
              onNavigateToWeight={() => weightManager.setIsWeightEntryModalOpen(true)}
              counselingResult={counselingResult}
            />

            {/* AIアドバイスカード */}
            <AIAdviceCard 
              onNavigateToProfile={() => navigation.setActiveTab('profile')}
              onViewAllAdvices={() => navigation.setActiveTab('profile')}
              counselingResult={counselingResult}
            />

            {/* カロリーカード */}
            <CalorieCard 
              totalCalories={mealManager.calorieData.totalCalories}
              targetCalories={mealManager.calorieData.targetCalories}
              pfc={mealManager.calorieData.pfc}
              counselingResult={counselingResult}
            />

            {/* 食事カード */}
            <MealSummaryCard
              meals={mealManager.mealData}
              onAddMeal={mealManager.handleAddMeal}
              onViewMealDetail={mealManager.handleViewMealDetail}
              onNavigateToMeal={() => {}} // 削除：専用ページなし
            />

            {/* 運動カード */}
            <WorkoutSummaryCard 
              exerciseData={exerciseManager.exerciseData}
              onNavigateToWorkout={() => {}} // 削除：専用ページなし
            />
          </div>
        </>
      )}

      {/* ボトムナビゲーション */}
      <BottomNavigation
        activeTab={navigation.activeTab}
        onTabChange={navigation.setActiveTab}
      />

      {/* モーダル群 */}
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

      <CalendarModal
        isOpen={navigation.isCalendarModalOpen}
        onClose={() => navigation.setIsCalendarModalOpen(false)}
        selectedDate={navigation.selectedDate}
        onDateSelect={navigation.handleDateSelect}
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
    </div>
  );
}