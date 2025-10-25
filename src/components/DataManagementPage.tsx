import { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  ArrowLeft,
  Utensils,
  Scale,
  Dumbbell,
  BarChart3
} from 'lucide-react';
import { MealAnalysisPage } from './MealAnalysisPage';
import { WeightDetailPage } from './WeightDetailPage';
import { ExercisePage } from './ExercisePage';
import { WeightSettingsPage } from './WeightSettingsPage';
import { NutritionSettingsPage } from './NutritionSettingsPage';

interface DataManagementPageProps {
  onBack: () => void;
  mealData: any;
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  selectedNutrients: Record<string, boolean>;
  onNavigateToNutritionSettings?: () => void;
  onNutrientChange?: (nutrients: Record<string, boolean>) => void;
  exerciseData?: any[];
  onAddExercise?: (exercise: any) => void;
  onDeleteExercise?: (exerciseId: string) => void;
  onUpdateExercise?: (exerciseId: string, updates: any) => void;
  workoutPlans?: any[];
  onAddPlan?: (plan: any) => void;
  onDeletePlan?: (planId: string) => void;
  onAddExerciseToPlan?: (planId: string, exercise: any) => void;
  onDeleteExerciseFromPlan?: (planId: string, exerciseId: string) => void;
}

type TabType = 'meal' | 'weight' | 'exercise';

export function DataManagementPage({ 
  onBack, 
  mealData, 
  selectedDate, 
  onDateSelect, 
  selectedNutrients,
  onNavigateToNutritionSettings,
  onNutrientChange,
  exerciseData = [],
  onAddExercise,
  onDeleteExercise,
  onUpdateExercise,
  workoutPlans = [],
  onAddPlan,
  onDeletePlan,
  onAddExerciseToPlan,
  onDeleteExerciseFromPlan
}: DataManagementPageProps) {
  const [activeTab, setActiveTab] = useState<TabType>('meal');
  const [showWeightSettings, setShowWeightSettings] = useState(false);
  const [showNutritionSettings, setShowNutritionSettings] = useState(false);

  const tabs = [
    {
      id: 'meal' as TabType,
      label: '食事',
      icon: Utensils,
      color: '#4682B4'
    },
    {
      id: 'weight' as TabType,
      label: '体重',
      icon: Scale,
      color: '#10B981'
    },
    {
      id: 'exercise' as TabType,
      label: '運動',
      icon: Dumbbell,
      color: '#F59E0B'
    }
  ];

  const handleTabChange = (tabId: TabType) => {
    setActiveTab(tabId);
    // 設定画面が開いている場合は閉じる
    if (showWeightSettings) {
      setShowWeightSettings(false);
    }
    if (showNutritionSettings) {
      setShowNutritionSettings(false);
    }
  };

  const handleNavigateToNutritionSettings = () => {
    setShowNutritionSettings(true);
  };

  const handleCalendar = () => {
  };

  // 体重設定画面の場合
  if (showWeightSettings) {
    return (
      <WeightSettingsPage onBack={() => setShowWeightSettings(false)} />
    );
  }

  // 栄養素設定画面の場合
  if (showNutritionSettings) {
    return (
      <NutritionSettingsPage 
        onBack={() => setShowNutritionSettings(false)}
        selectedNutrients={selectedNutrients}
        onNutrientChange={onNutrientChange}
      />
    );
  }

  return (
    <div className="min-h-screen bg-white overflow-y-auto">
      {/* ヘッダー */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="flex items-center justify-between p-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft size={20} />
            <span>戻る</span>
          </Button>
          <h1 className="text-lg font-semibold text-gray-800">データ管理</h1>
          <div className="w-16"></div> {/* スペーサー */}
        </div>
      </div>
      
      {/* タブナビゲーション */}
      <div className="relative px-4 pt-4 pb-2">
        <div className="bg-slate-100/80 rounded-2xl p-1 flex">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <Button
                key={tab.id}
                variant="ghost"
                onClick={() => handleTabChange(tab.id)}
                className={`flex-1 py-3 px-4 rounded-xl font-medium text-sm transition-all duration-200 flex items-center justify-center space-x-2 ${
                  isActive 
                    ? 'bg-white text-slate-900 shadow-sm' 
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </Button>
            );
          })}
        </div>
      </div>

      {/* タブコンテンツ */}
      <div className="relative">
        {activeTab === 'meal' && (
          <div className="px-4 py-4 pb-20">
            <MealAnalysisPage 
              onBack={onBack}
              mealData={mealData}
              selectedDate={selectedDate}
              onDateSelect={onDateSelect}
              selectedNutrients={selectedNutrients}
              onNavigateToNutritionSettings={handleNavigateToNutritionSettings}
              hideHeader={true}
            />
          </div>
        )}
        
        {activeTab === 'weight' && (
          <div className="px-4 py-4 pb-20">
            <WeightDetailPage 
              onBack={onBack} 
              onNavigateToSettings={() => setShowWeightSettings(true)}
              hideHeader={true}
            />
          </div>
        )}
        
        {activeTab === 'exercise' && (
          <div className="px-4 py-4 pb-20">
            <ExercisePage 
              onBack={onBack}
              selectedDate={selectedDate}
              onDateSelect={onDateSelect}
              hideHeader={true}
              exerciseData={exerciseData}
              onAddExercise={onAddExercise}
              onDeleteExercise={onDeleteExercise}
              onUpdateExercise={onUpdateExercise}
              workoutPlans={workoutPlans}
              onAddPlan={onAddPlan}
              onDeletePlan={onDeletePlan}
              onAddExerciseToPlan={onAddExerciseToPlan}
              onDeleteExerciseFromPlan={onDeleteExerciseFromPlan}
            />
          </div>
        )}
      </div>
    </div>
  );
}