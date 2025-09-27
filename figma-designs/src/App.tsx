import React from 'react';

// カスタムフック
import { useDateBasedData } from './hooks/useDateBasedData';
import { useNavigationState } from './hooks/useNavigationState';
import { useMealData } from './hooks/useMealData';
import { useExerciseData } from './hooks/useExerciseData';
import { useWeightData } from './hooks/useWeightData';

// コンポーネント
import { CompactHeader } from './components/CompactHeader';
import { WeightCard } from './components/WeightCard';
import { CalorieCard } from './components/CalorieCard';
import { AIAdviceCard } from './components/AIAdviceCard';
import { MealSummaryCard } from './components/MealSummaryCard';
import { WorkoutSummaryCard } from './components/WorkoutSummaryCard';
import { BottomNavigation } from './components/BottomNavigation';
import { AddMealModal } from './components/AddMealModal';
import { EditMealModal } from './components/EditMealModal';
import { MealDetailModal } from './components/MealDetailModal';
import { CalendarModal } from './components/CalendarModal';
import { MyProfilePage } from './components/MyProfilePage';
import { SettingsPage } from './components/SettingsPage';
import { NutritionSettingsPage } from './components/NutritionSettingsPage';
import { PlanSettingsPage } from './components/PlanSettingsPage';
import { PaymentSettingsPage } from './components/PaymentSettingsPage';
import { UserGuidePage } from './components/UserGuidePage';
import { ContactPage } from './components/ContactPage';
import { MealAnalysisPage } from './components/MealAnalysisPage';
import { WeightDetailPage } from './components/WeightDetailPage';
import { ExercisePage } from './components/ExercisePage';
import { WeightEntryModal } from './components/WeightEntryModal';
import { WeightSettingsModal } from './components/WeightSettingsModal';
import { DataManagementModal } from './components/DataManagementModal';

export default function App() {
  // カスタムフックで状態管理を分離
  const navigation = useNavigationState();
  const dateBasedDataManager = useDateBasedData();
  
  // データ管理モーダル状態
  const [isDataManagementModalOpen, setIsDataManagementModalOpen] = React.useState(false);
  
  // 現在の日付データを取得
  const currentDateData = dateBasedDataManager.getCurrentDateData(navigation.selectedDate);
  
  // 日付データ更新関数を部分適用
  const updateDateData = (updates: any) => {
    dateBasedDataManager.updateDateData(navigation.selectedDate, updates);
  };

  // 食事データ管理
  const mealManager = useMealData(
    navigation.selectedDate, 
    dateBasedDataManager.dateBasedData, 
    updateDateData
  );

  // 運動データ管理
  const exerciseManager = useExerciseData(
    navigation.selectedDate, 
    dateBasedDataManager.dateBasedData, 
    updateDateData
  );

  // 体重データ管理
  const weightManager = useWeightData(
    navigation.selectedDate,
    dateBasedDataManager.dateBasedData,
    updateDateData
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50 max-w-sm mx-auto relative">
      {/* 背景装飾 */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-100/30 via-transparent to-indigo-50/20 pointer-events-none" style={{background: 'linear-gradient(135deg, rgba(70, 130, 180, 0.1) 0%, transparent 50%, rgba(70, 130, 180, 0.05) 100%)'}}></div>
      
      {/* プロフィールページ（設定画面含む） */}
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
              {/* 設定コンテンツ */}
              <div className="relative px-4 py-4 pb-20 space-y-4">
                <SettingsPage 
                  onBack={navigation.handleBackFromSettings} 
                  onNavigateToNutritionSettings={navigation.handleNavigateToNutritionSettings}
                />
              </div>
            </>
          ) : navigation.showNutritionSettings ? (
            <>
              {/* 栄養素設定コンテンツ */}
              <NutritionSettingsPage 
                onBack={navigation.handleBackFromNutritionSettings}
                selectedNutrients={navigation.selectedNutrients}
                onNutrientChange={navigation.handleNutrientChange}
              />
            </>
          ) : navigation.showPlanSettings ? (
            <>
              {/* プラン設定コンテンツ */}
              <PlanSettingsPage 
                onBack={navigation.handleBackFromPlanSettings}
              />
            </>
          ) : navigation.showPaymentSettings ? (
            <>
              {/* 支払い設定コンテンツ */}
              <PaymentSettingsPage 
                onBack={navigation.handleBackFromPaymentSettings}
              />
            </>
          ) : navigation.showUserGuide ? (
            <>
              {/* 使い方ガイドコンテンツ */}
              <UserGuidePage 
                onBack={navigation.handleBackFromUserGuide}
              />
            </>
          ) : navigation.showContact ? (
            <>
              {/* お問い合わせコンテンツ */}
              <ContactPage 
                onBack={navigation.handleBackFromContact}
              />
            </>
          ) : null}
        </>
      )}

      {/* ホーム画面 */}
      {navigation.activeTab === 'home' && (
        <>
          {/* ヘッダー（月表示 + 週間カレンダー統合） */}
          <CompactHeader
            currentDate={navigation.selectedDate}
            onDateSelect={navigation.handleDateSelect}
            onCalendar={navigation.handleCalendar}
            onNavigateToProfile={() => navigation.setActiveTab('profile')}
            onNavigateToData={() => navigation.setActiveTab('meal')}
          />

          {/* メインコンテンツ */}
          <div className="relative px-4 py-4 pb-20 space-y-4">
            {/* 体重エリア */}
            <WeightCard 
              data={weightManager.weightData} 
              onNavigateToWeight={() => navigation.setActiveTab('weight')}
            />

            {/* カロリーエリア */}
            <CalorieCard 
              totalCalories={mealManager.calorieData.totalCalories}
              targetCalories={mealManager.calorieData.targetCalories}
              pfc={mealManager.calorieData.pfc}
            />

            {/* AIアドバイスエリア */}
            <AIAdviceCard 
              onNavigateToProfile={() => navigation.setActiveTab('profile')}
              onViewAllAdvices={() => navigation.setActiveTab('profile')}
            />

            {/* 食事サマリーエリア */}
            <MealSummaryCard
              meals={mealManager.mealData}
              onAddMeal={mealManager.handleAddMeal}
              onViewMealDetail={mealManager.handleViewMealDetail}
              onNavigateToMeal={() => navigation.setActiveTab('meal')}
            />

            {/* 運動サマリーエリア */}
            <WorkoutSummaryCard 
              exerciseData={exerciseManager.exerciseData}
              onNavigateToWorkout={() => navigation.setActiveTab('exercise')}
            />
          </div>
        </>
      )}

      {/* 食事ページ */}
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

      {/* 体重ページ */}
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

      {/* 運動ページ */}
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

      {/* 下部ナビゲーション */}
      <BottomNavigation
        activeTab={navigation.activeTab}
        onTabChange={navigation.setActiveTab}
      />

      {/* 食事追加モーダル */}
      <AddMealModal
        isOpen={mealManager.isAddMealModalOpen}
        onClose={() => mealManager.setIsAddMealModalOpen(false)}
        mealType={mealManager.currentMealType}
        onAddMeal={mealManager.handleAddMealSubmit}
      />

      {/* 食事編集モーダル */}
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

      {/* 食事詳細モーダル */}
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
      />

      {/* カレンダーモーダル */}
      <CalendarModal
        isOpen={navigation.isCalendarModalOpen}
        onClose={() => navigation.setIsCalendarModalOpen(false)}
        selectedDate={navigation.selectedDate}
        onDateSelect={navigation.handleDateSelect}
      />

      {/* 体重入力モーダル */}
      <WeightEntryModal
        isOpen={weightManager.isWeightEntryModalOpen}
        onClose={() => weightManager.setIsWeightEntryModalOpen(false)}
        onSubmit={weightManager.handleAddWeightEntry}
        currentWeight={weightManager.weightData.current}
      />

      {/* 体重設定モーダル */}
      <WeightSettingsModal
        isOpen={weightManager.isWeightSettingsModalOpen}
        onClose={() => weightManager.setIsWeightSettingsModalOpen(false)}
        currentSettings={weightManager.weightSettings}
        onUpdateSettings={weightManager.handleUpdateWeightSettings}
      />

      {/* データ管理モーダル */}
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