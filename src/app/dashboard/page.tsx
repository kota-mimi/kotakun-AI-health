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
import { MealAnalysisPage } from '@/components/MealAnalysisPage';
import { WeightDetailPage } from '@/components/WeightDetailPage';
import { ExercisePage } from '@/components/ExercisePage';
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
      
      {navigation.activeTab === 'profile' && (
        <>
          {!navigation.showSettings && !navigation.showNutritionSettings && !navigation.showPlanSettings && !navigation.showPaymentSettings && !navigation.showUserGuide && !navigation.showContact ? (
            <div className="relative py-4 pb-20 space-y-4">
              <MyProfilePage 
                onNavigateToSettings={navigation.handleNavigateToSettings}
                onNavigateToData={() => navigation.setActiveTab('meal')}
                onNavigateToPlanSettings={navigation.handleNavigateToPlanSettings}
                onNavigateToPaymentSettings={navigation.handleNavigateToPaymentSettings}
                onNavigateToUserGuide={navigation.handleNavigateToUserGuide}
                onNavigateToContact={navigation.handleNavigateToContact}
                onNavigateToDataManagement={() => setIsDataManagementModalOpen(true)}
              />
            </div>
          ) : navigation.showSettings && !navigation.showNutritionSettings ? (
            <>
              <div className="relative px-4 py-4 pb-20 space-y-4">
                <SettingsPage 
                  onBack={navigation.handleBackFromSettings} 
                  onNavigateToNutritionSettings={navigation.handleNavigateToNutritionSettings}
                />
              </div>
            </>
          ) : navigation.showNutritionSettings ? (
            <>
              <NutritionSettingsPage 
                onBack={navigation.handleBackFromNutritionSettings}
                selectedNutrients={navigation.selectedNutrients}
                onNutrientChange={navigation.handleNutrientChange}
              />
            </>
          ) : navigation.showPlanSettings ? (
            <>
              <PlanSettingsPage 
                onBack={navigation.handleBackFromPlanSettings}
              />
            </>
          ) : navigation.showPaymentSettings ? (
            <>
              <PaymentSettingsPage 
                onBack={navigation.handleBackFromPaymentSettings}
              />
            </>
          ) : navigation.showUserGuide ? (
            <>
              <UserGuidePage 
                onBack={navigation.handleBackFromUserGuide}
              />
            </>
          ) : navigation.showContact ? (
            <>
              <ContactPage 
                onBack={navigation.handleBackFromContact}
              />
            </>
          ) : null}
        </>
      )}

      {navigation.activeTab === 'home' && (
        <>
          <CompactHeader
            currentDate={navigation.selectedDate}
            onDateSelect={navigation.handleDateSelect}
            onCalendar={navigation.handleCalendar}
            onNavigateToProfile={() => navigation.setActiveTab('profile')}
            onNavigateToData={() => navigation.setActiveTab('meal')}
          />

          <div className="relative px-4 py-4 pb-20 space-y-4">
            <WeightCard 
              data={weightManager.weightData} 
              onNavigateToWeight={() => navigation.setActiveTab('weight')}
              counselingResult={counselingResult}
            />

            <AIAdviceCard 
              onNavigateToProfile={() => navigation.setActiveTab('profile')}
              onViewAllAdvices={() => navigation.setActiveTab('profile')}
              counselingResult={counselingResult}
            />

            <CalorieCard 
              totalCalories={mealManager.calorieData.totalCalories}
              targetCalories={mealManager.calorieData.targetCalories}
              pfc={mealManager.calorieData.pfc}
              counselingResult={counselingResult}
            />

            <MealSummaryCard
              meals={mealManager.mealData}
              onAddMeal={mealManager.handleAddMeal}
              onViewMealDetail={mealManager.handleViewMealDetail}
              onNavigateToMeal={() => navigation.setActiveTab('meal')}
            />

            <WorkoutSummaryCard 
              exerciseData={exerciseManager.exerciseData}
              onNavigateToWorkout={() => navigation.setActiveTab('exercise')}
            />
          </div>
        </>
      )}

      {navigation.activeTab === 'meal' && (
        <>
          <MealAnalysisPage 
            onBack={() => navigation.setActiveTab('home')}
            mealData={mealManager.mealData}
            selectedDate={navigation.selectedDate}
            onDateSelect={navigation.handleDateSelect}
            selectedNutrients={navigation.selectedNutrients}
            onNavigateToNutritionSettings={navigation.handleNavigateToNutritionSettings}
            hideHeader={false}
          />
        </>
      )}

      {navigation.activeTab === 'weight' && (
        <>
          <WeightDetailPage 
            onBack={() => navigation.setActiveTab('home')}
            hideHeader={false}
            weightData={weightManager.weightTrendData}
            currentWeight={weightManager.weightData.current}
            targetWeight={weightManager.weightData.target}
            onOpenWeightEntry={() => weightManager.setIsWeightEntryModalOpen(true)}
            onOpenWeightSettings={() => weightManager.setIsWeightSettingsModalOpen(true)}
          />
        </>
      )}

      {navigation.activeTab === 'exercise' && (
        <>
          <ExercisePage 
            onBack={() => navigation.setActiveTab('home')}
            selectedDate={navigation.selectedDate}
            onDateSelect={navigation.handleDateSelect}
            hideHeader={false}
            exerciseData={exerciseManager.exerciseData}
            onAddExercise={exerciseManager.handleAddExercise}
            onDeleteExercise={exerciseManager.handleDeleteExercise}
            onUpdateExercise={exerciseManager.handleUpdateExercise}
            workoutPlans={exerciseManager.workoutPlans}
            onAddPlan={exerciseManager.handleAddPlan}
            onDeletePlan={exerciseManager.handleDeletePlan}
            onAddExerciseToPlan={exerciseManager.handleAddExerciseToPlan}
            onDeleteExerciseFromPlan={exerciseManager.handleDeleteExerciseFromPlan}
          />
        </>
      )}

      <BottomNavigation
        activeTab={navigation.activeTab}
        onTabChange={navigation.setActiveTab}
      />

      <AddMealModal
        isOpen={mealManager.isAddMealModalOpen}
        onClose={() => mealManager.setIsAddMealModalOpen(false)}
        mealType={mealManager.currentMealType}
        onAddMeal={mealManager.handleAddMealSubmit}
      />

      <EditMealModal
        isOpen={mealManager.isEditMealModalOpen}
        onClose={() => {
          mealManager.setIsEditMealModalOpen(false);
          mealManager.setCurrentEditMeal(null);
        }}
        mealType={mealManager.currentMealType}
        meal={mealManager.currentEditMeal}
        onUpdateMeal={mealManager.handleUpdateMeal}
        onDeleteMeal={mealManager.handleDeleteMeal}
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
        onUpdateSummary={(totals) => {
          // TODO: 合計値の更新処理を実装
          console.log('Summary update:', totals);
        }}
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