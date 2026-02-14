'use client';

import React, { useMemo } from 'react';
import { useSwipeable } from 'react-swipeable';

import { useDateBasedData } from '@/hooks/useDateBasedData';
import { useNavigationState } from '@/hooks/useNavigationState';
import { useMealData } from '@/hooks/useMealData';
import { useWeightData } from '@/hooks/useWeightData';
import { useCounselingData } from '@/hooks/useCounselingData';
import { useFeedbackData } from '@/hooks/useFeedbackData';
// import { useGlobalLoading } from '@/hooks/useGlobalLoading';
import { useSharedProfile } from '@/hooks/useSharedProfile';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useShareRecord } from '@/hooks/useShareRecord';

import { CompactHeader } from '@/components/CompactHeader';
import { CalorieCard } from '@/components/CalorieCard';
import { MealSummaryCard } from '@/components/MealSummaryCard';
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
import { DataManagementModal } from '@/components/DataManagementModal';
import { WeightCard } from '@/components/WeightCard';
import { WeightEntryModal } from '@/components/WeightEntryModal';
import { FloatingShortcutBar } from '@/components/FloatingShortcutBar';
import { CalorieCardSkeleton, MealCardSkeleton } from '@/components/ui/skeleton';
// import { AppLoadingScreen } from '@/components/LoadingScreen';

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
  // const globalLoading = useGlobalLoading();
  const sharedProfile = useSharedProfile(); // 🔄 統合プロフィール管理
  const shareRecord = useShareRecord(); // 📤 共有機能（テスト用に戻す）
  
  // 🚀 統合ダッシュボードデータ取得（コスト削減）
  const dashboardData = useDashboardData(navigation?.selectedDate || new Date());
  
  // URLパラメータに基づいてページを開く
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    const showUserGuide = params.get('showUserGuide');
    
    if (tab === 'plan') {
      // プロフィールタブに切り替えてからプラン設定ページを開く
      navigation.setActiveTab('profile');
      navigation.handleNavigateToPlanSettings();
    }
    
    if (showUserGuide === 'true') {
      // プロフィールタブに切り替えてから使い方ガイドを開く
      navigation.setActiveTab('profile');
      navigation.handleNavigateToUserGuide();
    }
  }, []);
  
  const [isDataManagementModalOpen, setIsDataManagementModalOpen] = React.useState(false);
  const [isMealMenuOpen, setIsMealMenuOpen] = React.useState(false);
  
  const currentDateData = dateBasedDataManager?.getCurrentDateData?.(navigation?.selectedDate) || { mealData: { breakfast: [], lunch: [], dinner: [], snack: [] } };
  
  const updateDateData = (updates: any) => {
    try {
      dateBasedDataManager?.updateDateData?.(navigation?.selectedDate, updates);
      
      // 体重データが更新された場合、統合ダッシュボードキャッシュも無効化
      if (updates.weightEntries || updates.weight) {
        dashboardData.invalidateCache();
        console.log('🔄 体重更新により統合ダッシュボードキャッシュを無効化');
      }
    } catch (error) {
      console.error('updateDateData error:', error);
      onError();
    }
  };

  // getWeekDates関数の定義（後でuseMemoで使用）
  const getWeekDates = (weekOffset: number = 0) => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() + weekOffset * 7 - today.getDay());
    
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  // 🔄 統合データから各データを取得（コスト削減済み）
  const counselingResult = dashboardData.counselingData;
  const isCounselingLoading = dashboardData.isLoading;

  const mealManager = useMealData(
    navigation?.selectedDate || new Date(), 
    dateBasedDataManager?.dateBasedData || {}, 
    updateDateData,
    counselingResult,
    sharedProfile, // 🔄 統合プロフィール渡し
    dashboardData.mealsData // 🚀 統合データから取得
  );


  const weightManager = useWeightData(
    navigation?.selectedDate || new Date(),
    dateBasedDataManager?.dateBasedData || {},
    updateDateData,
    counselingResult,
    sharedProfile, // 🔧 プロフィール体重フォールバック有効化
    dashboardData.weightData // 🚀 統合ダッシュボードデータから体重データを直接渡す
  );

  const feedbackManager = useFeedbackData(
    navigation?.selectedDate || new Date(),
    dateBasedDataManager?.dateBasedData || {},
    updateDateData
  );

  // 🚀 第2段階最適化：週間記録チェッカー（useMemo + Map）
  const weeklyRecordsChecker = useMemo(() => {
    const optimizationStart = performance.now();
    
    // 🚀 早期リターン：全データが空の場合は高速関数を返す
    const hasWeightData = dashboardData.weightData?.length > 0; // 統合データを直接使用
    const hasMealData = mealManager?.mealData && Object.keys(mealManager.mealData).length > 0;
    
    if (!hasWeightData && !hasMealData) {
      const totalTime = performance.now() - optimizationStart;
      console.log(`🚀 weeklyRecordsChecker: empty data optimization`, {
        totalTime: `${totalTime.toFixed(3)}ms`,
        result: 'fast function returned'
      });
      return () => false; // 超高速関数を返す
    }
    
    // selectedWeekの計算（CompactHeaderと同じロジック）
    const currentWeekOffset = (() => {
      const today = new Date();
      const selectedKey = navigation?.selectedDate?.toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' }) || '';
      const todayKey = today.toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' });
      
      if (selectedKey === todayKey) return 0; // 今日の週
      
      // 週の差を計算
      const todayWeekStart = new Date(today);
      todayWeekStart.setDate(today.getDate() - today.getDay());
      
      const selectedWeekStart = new Date(navigation?.selectedDate || today);
      selectedWeekStart.setDate(selectedWeekStart.getDate() - selectedWeekStart.getDay());
      
      const msPerWeek = 7 * 24 * 60 * 60 * 1000;
      return Math.round((selectedWeekStart.getTime() - todayWeekStart.getTime()) / msPerWeek);
    })();
    
    // データがある場合：週間分をまとめて計算
    const weekDates = getWeekDates(currentWeekOffset);
    const recordsMap = new Map<string, boolean>();
    
    weekDates.forEach(date => {
      const dateKey = date.toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' });
      
      // 各データタイプをチェック
      const hasWeightRecord = hasWeightData && dashboardData.weightData.some(
        (record: any) => record.date === dateKey && record.weight > 0
      );
      
      const hasMealRecord = hasMealData && 
                            mealManager.mealData[dateKey] && 
                            Array.isArray(mealManager.mealData[dateKey]) && 
                            mealManager.mealData[dateKey].length > 0;
      
      
      recordsMap.set(dateKey, hasWeightRecord || hasMealRecord);
    });
    
    const totalTime = performance.now() - optimizationStart;
    console.log(`🚀 weeklyRecordsChecker: batch calculation completed`, {
      totalTime: `${totalTime.toFixed(3)}ms`,
      weekDatesProcessed: weekDates.length,
      recordsFound: Array.from(recordsMap.values()).filter(Boolean).length
    });
    
    // 高速検索関数を返す
    return (date: Date): boolean => {
      const dateKey = date.toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' });
      return recordsMap.get(dateKey) || false;
    };
    
  }, [
    navigation?.selectedDate,
    dashboardData.weightData, // 統合データを直接参照
    mealManager?.mealData
  ]);

  // 🚀 第2段階：超高速Map取得（useMemoチェッカー使用）
  const hasRecordsForDate = (date: Date): boolean => {
    const startTime = performance.now();
    const result = weeklyRecordsChecker(date);
    const totalTime = performance.now() - startTime;
    
    console.log(`🚀 hasRecordsForDate Map lookup:`, {
      totalTime: `${totalTime.toFixed(4)}ms`,
      result,
      stage: 'phase2'
    });
    
    return result;
  };

  // ローディング機能完全削除

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

  // 共有機能ハンドラー - 共有ページに遷移
  const handleShareRecord = async () => {
    try {
      // シンプル体重取得（WeightCardと同じロジック）
      const currentWeight = weightManager?.weightData?.current || 
                           sharedProfile?.latestProfile?.weight ||
                           counselingResult?.answers?.weight || 
                           counselingResult?.userProfile?.weight || 0;
      
      const recordData = shareRecord.formatRecordData(
        navigation?.selectedDate || new Date(),
        mealManager?.mealData || {},
        [],
        {},  // formatRecordDataでは体重使わない
        counselingResult
      );
      
      const targetCalories = mealManager?.calorieData?.targetCalories || 2000;

      const shareData = {
        date: (navigation?.selectedDate || new Date()).toISOString(),
        weight: currentWeight,  // シンプルに数値で送信
        weightDiff: (weightManager?.weightData?.current > 0 && weightManager?.weightData?.previous > 0) 
          ? (weightManager?.weightData?.current - weightManager?.weightData?.previous) 
          : null,
        calories: recordData.calories,
        caloriesTarget: targetCalories,
        protein: recordData.protein,
        fat: recordData.fat,
        carbs: recordData.carbs,
        // PFC目標値も送信（共有ページで正しい目標値を表示するため）
        proteinTarget: mealManager?.calorieData?.pfc?.proteinTarget || 100,
        fatTarget: mealManager?.calorieData?.pfc?.fatTarget || 55,
        carbsTarget: mealManager?.calorieData?.pfc?.carbsTarget || 250,
        exerciseTime: recordData.exerciseTime,
        exerciseBurned: recordData.exerciseBurned,
        achievementRate: Math.round((recordData.calories / targetCalories) * 100)
      };
      
      console.log('🔍 シンプル送信データ:', {
        currentWeight,
        shareData
      });
      
      console.log('📊 Raw record data:', recordData);
      console.log('📊 Record data details:', {
        calories: recordData.calories,
        protein: recordData.protein,
        fat: recordData.fat,
        carbs: recordData.carbs,
        exerciseTime: recordData.exerciseTime,
        exerciseBurned: recordData.exerciseBurned
      });
      // セキュアな共有データを構築
      const currentUserId = counselingResult?.answers?.lineUserId || 'anonymous';
      const { encryptDataWithTimestamp, hashUserId, generateSessionId } = await import('@/lib/encryption');
      
      // ユーザーIDをハッシュ化（個人情報保護）
      const hashedUserId = await hashUserId(currentUserId);
      const sessionId = generateSessionId();
      const timestamp = Date.now();
      const expiresAt = timestamp + (10 * 60 * 1000); // 10分で期限切れ
      
      const secureShareData = {
        userId: hashedUserId,
        timestamp,
        expiresAt,
        sessionId,
        data: shareData
      };
      
      console.log('🔒 Secure share data prepared:', {
        userId: hashedUserId,
        sessionId,
        expiresAt: new Date(expiresAt).toISOString(),
        timestamp: timestamp
      });
      
      // データを暗号化（timestampを明示的に指定）
      const encryptedData = await encryptDataWithTimestamp(secureShareData, hashedUserId, timestamp);
      const shareUrl = `https://health-share-ten.vercel.app?secure=${encodeURIComponent(encryptedData)}&t=${timestamp}&u=${hashedUserId}`;
      
      console.log('🔗 Generated secure share URL length:', shareUrl.length);
      
      // 新しいタブで共有ページを開く
      window.open(shareUrl, '_blank');
      
    } catch (error) {
      console.error('❌ Share navigation error:', error);
      alert(`エラー: ${error.message}`);
    }
  };


  return (
    <div className="min-h-screen relative bg-gray-50">
      
      {/* プロフィール・設定タブ */}
      {navigation.activeTab === 'profile' && (
        <>
          {!navigation.showSettings && !navigation.showNutritionSettings && !navigation.showPlanSettings && !navigation.showUserGuide && !navigation.showContact ? (
            <div className="relative py-4 pb-20 space-y-4">
              <MyProfilePage 
                onNavigateToSettings={navigation.handleNavigateToSettings}
                onNavigateToData={() => {}} // 削除：データページはもうない
                onNavigateToPlanSettings={navigation.handleNavigateToPlanSettings}
                onNavigateToUserGuide={navigation.handleNavigateToUserGuide}
                onNavigateToContact={navigation.handleNavigateToContact}
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
                hasRecordsForDate={hasRecordsForDate}
                onShareRecord={handleShareRecord}
              />
            )}
          </div>

          <div {...swipeHandlers} className="relative px-4 py-4 pb-24 space-y-4">

            {/* 体重カード */}
            <div className={`transition-all duration-300 ${isMealMenuOpen ? 'blur-xl' : ''}`}>
              {dashboardData.isLoading ? (
                <CalorieCardSkeleton />
              ) : weightManager ? (
                <WeightCard
                  data={weightManager.weightData}
                  counselingResult={counselingResult}
                  selectedDate={navigation.selectedDate}
                  sharedProfile={sharedProfile}
                  onNavigateToWeight={() => weightManager.setIsWeightEntryModalOpen(true)}
                />
              ) : null}
            </div>

            {/* カロリーカード */}
            <div className={`transition-all duration-300 ${isMealMenuOpen ? 'blur-xl' : ''}`}>
              {dashboardData.isLoading ? (
                <CalorieCardSkeleton />
              ) : mealManager ? (
                <CalorieCard 
                  totalCalories={mealManager.calorieData?.totalCalories || 0}
                  targetCalories={mealManager.calorieData?.targetCalories || 2000}
                  pfc={mealManager.calorieData?.pfc || { protein: 0, fat: 0, carbs: 0, proteinTarget: 120, fatTarget: 60, carbsTarget: 250 }}
                  counselingResult={counselingResult}
                  selectedDate={navigation.selectedDate}
                  profileData={sharedProfile.latestProfile} // 🔄 統合プロフィール渡し
                />
              ) : null}
            </div>

            {/* 食事カード */}
            {dashboardData.isLoading ? (
              <MealCardSkeleton />
            ) : mealManager?.mealData ? (
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
            ) : null}


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



      {/* 体重記録モーダル */}
      <WeightEntryModal
        isOpen={weightManager?.isWeightEntryModalOpen || false}
        onClose={() => weightManager?.setIsWeightEntryModalOpen(false)}
        onSubmit={weightManager?.handleAddWeightEntry || (() => {})}
        currentWeight={weightManager?.weightData?.current || 0}
      />

    </div>
  );
}