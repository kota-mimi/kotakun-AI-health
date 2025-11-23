import { useState } from 'react';
import { useLocalStorage } from './useLocalStorage';

export type TabType = 'home' | 'profile';

export function useNavigationState() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);

  // プロフィール・設定ページの状態管理
  const [showSettings, setShowSettings] = useState(false);
  const [showNutritionSettings, setShowNutritionSettings] = useState(false);
  const [showPlanSettings, setShowPlanSettings] = useState(false);
  const [showPaymentSettings, setShowPaymentSettings] = useState(false);
  const [showUserGuide, setShowUserGuide] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [showWeightSettings, setShowWeightSettings] = useState(false);
  const [showReminderSettings, setShowReminderSettings] = useState(false);
  const [showAICharacter, setShowAICharacter] = useState(false);

  // 栄養素設定をlocalStorageで永続化
  const selectedNutrientsStorage = useLocalStorage('healthApp_selectedNutrients', {
    protein: true,
    fat: true,
    carbs: true,
    fiber: false,
    sugar: false,
    sodium: false,
    calcium: false,
    potassium: false,
    iron: false,
    bcaa: false,
    vitaminD: false,
    vitaminB: false,
    magnesium: false,
    water: false
  });

  // 日付選択ハンドラー
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  // カレンダーモーダルハンドラー
  const handleCalendar = () => {
    setIsCalendarModalOpen(true);
  };

  // 設定ページナビゲーション関数
  const handleNavigateToSettings = () => {
    setShowSettings(true);
  };

  const handleBackFromSettings = () => {
    setShowSettings(false);
  };

  const handleNavigateToNutritionSettings = () => {
    setShowNutritionSettings(true);
  };

  const handleBackFromNutritionSettings = () => {
    setShowNutritionSettings(false);
  };

  const handleNutrientChange = (nutrients: Record<string, boolean>) => {
    selectedNutrientsStorage.setValue(nutrients);
  };

  // サービスサポートページのナビゲーション関数
  const handleNavigateToPlanSettings = () => {
    setShowPlanSettings(true);
  };

  const handleNavigateToPaymentSettings = () => {
    setShowPaymentSettings(true);
  };

  const handleNavigateToUserGuide = () => {
    setShowUserGuide(true);
  };

  const handleNavigateToContact = () => {
    setShowContact(true);
  };

  const handleBackFromPlanSettings = () => {
    setShowPlanSettings(false);
  };

  const handleBackFromPaymentSettings = () => {
    setShowPaymentSettings(false);
  };

  const handleBackFromUserGuide = () => {
    setShowUserGuide(false);
  };

  const handleBackFromContact = () => {
    setShowContact(false);
  };

  const handleNavigateToReminderSettings = () => {
    setShowReminderSettings(true);
  };

  const handleBackFromReminderSettings = () => {
    setShowReminderSettings(false);
  };

  const handleNavigateToAICharacter = () => {
    setShowAICharacter(true);
  };

  const handleBackFromAICharacter = () => {
    setShowAICharacter(false);
  };

  return {
    // 基本状態
    selectedDate,
    activeTab,
    isCalendarModalOpen,
    
    // プロフィール・設定状態
    showSettings,
    showNutritionSettings,
    showPlanSettings,
    showPaymentSettings,
    showUserGuide,
    showContact,
    showWeightSettings,
    showReminderSettings,
    showAICharacter,
    selectedNutrients: selectedNutrientsStorage.value,
    
    // アクション
    handleDateSelect,
    handleCalendar,
    setActiveTab,
    setIsCalendarModalOpen,
    
    // 設定ナビゲーションアクション
    handleNavigateToSettings,
    handleBackFromSettings,
    handleNavigateToNutritionSettings,
    handleBackFromNutritionSettings,
    handleNutrientChange,
    handleNavigateToPlanSettings,
    handleNavigateToPaymentSettings,
    handleNavigateToUserGuide,
    handleNavigateToContact,
    handleBackFromPlanSettings,
    handleBackFromPaymentSettings,
    handleBackFromUserGuide,
    handleBackFromContact,
    handleNavigateToReminderSettings,
    handleBackFromReminderSettings,
    handleNavigateToAICharacter,
    handleBackFromAICharacter,
    
    // セッター（必要に応じて）
    setSelectedDate,
    setShowWeightSettings
  };
}