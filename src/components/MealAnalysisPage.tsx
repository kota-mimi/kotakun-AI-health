import { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { 
  ArrowLeft,
  Menu,
  TrendingUp,
  TrendingDown,
  Target,
  Clock,
  Zap,
  Activity,
  BarChart3,
  PieChart,
  Calendar,
  Settings,
  Plus,
  Check,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { CompactHeader } from './CompactHeader';
import { MealTimeline } from './MealTimeline';
import { InstagramLikeFeed } from './InstagramLikeFeed';

interface MealAnalysisPageProps {  
  onBack: () => void;
  mealData: any;
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  selectedNutrients: Record<string, boolean>;
  onNavigateToNutritionSettings?: () => void;
  hideHeader?: boolean;
}

export function MealAnalysisPage({ onBack, mealData, selectedDate, onDateSelect, selectedNutrients, onNavigateToNutritionSettings, hideHeader = false }: MealAnalysisPageProps) {
  const [trendPeriod, setTrendPeriod] = useState<'7days' | '14days' | '30days'>('7days');
  const [isTrendOpen, setIsTrendOpen] = useState(false);

  // 日別の栄養データ計算（拡張栄養��含む）
  const calculateDailyNutrition = () => {
    const allMeals = [
      ...mealData.breakfast,
      ...mealData.lunch,
      ...mealData.dinner,
      ...mealData.snack
    ];

    const totalCalories = allMeals.reduce((sum: number, meal: any) => sum + meal.calories, 0);
    const totalProtein = allMeals.reduce((sum: number, meal: any) => sum + (meal.protein || 0), 0);
    const totalFat = allMeals.reduce((sum: number, meal: any) => sum + (meal.fat || 0), 0);
    const totalCarbs = allMeals.reduce((sum: number, meal: any) => sum + (meal.carbs || 0), 0);

    // 食事時間の取得
    const mealTimes = allMeals
      .filter(meal => meal.time)
      .map(meal => meal.time)
      .sort();
    
    const firstMealTime = mealTimes.length > 0 ? mealTimes[0] : null;
    const lastMealTime = mealTimes.length > 0 ? mealTimes[mealTimes.length - 1] : null;

    // 拡張栄養素（モック値）
    const extendedNutrition = {
      fiber: Math.round(totalCarbs * 0.2), // 炭水化物の20%を食物繊維と仮定
      sugar: Math.round(totalCarbs * 0.3), // 炭水化物の30%を糖質と仮定
      sodium: Math.round(totalCalories * 1.2), // カロリーの1.2倍をナトリウム(mg)と仮定
      calcium: Math.round(totalProtein * 8), // タンパク質の8倍をカルシウム(mg)と仮定
      potassium: Math.round(totalCalories * 1.5), // カロリーの1.5倍をカリウム(mg)と仮定
      iron: Math.round(totalProtein * 0.5), // タンパク質の0.5倍を鉄分(mg)と仮定
      bcaa: Math.round(totalProtein * 0.25), // タンパク質の25%をBCAAと仮定
      vitaminD: Math.round(totalCalories * 0.01), // カロリーの0.01倍をビタミンD(μg)と仮定
      vitaminB: Math.round(totalProtein * 0.1), // タンパク質の0.1倍をビタミンB群(mg)と仮定
      magnesium: Math.round(totalCalories * 0.15), // カロリーの0.15倍をマグネシウム(mg)と仮定
      water: Math.round(totalCalories * 0.8) // カロリーの0.8倍を水分量(ml)と仮定
    };

    return {
      calories: totalCalories,
      protein: totalProtein,
      fat: totalFat,
      carbs: totalCarbs,
      mealCount: allMeals.length,
      firstMealTime,
      lastMealTime,
      extended: extendedNutrition,
      targets: {
        calories: 2000,
        protein: 120,
        fat: 60,
        carbs: 250,
        fiber: 25,
        sugar: 50,
        sodium: 2000,
        calcium: 800,
        potassium: 3500,
        iron: 10,
        bcaa: 15,
        vitaminD: 10,
        vitaminB: 5,
        magnesium: 300,
        water: 2000
      }
    };
  };

  // 週間トレンドデータ（モック）
  const weeklyTrends = [
    { date: '12/25', calories: 1850, protein: 115, fat: 55, carbs: 230 },
    { date: '12/26', calories: 2100, protein: 125, fat: 70, carbs: 260 },
    { date: '12/27', calories: 1950, protein: 110, fat: 60, carbs: 245 },
    { date: '12/28', calories: 2050, protein: 130, fat: 65, carbs: 255 },
    { date: '12/29', calories: 1800, protein: 105, fat: 50, carbs: 220 },
    { date: '12/30', calories: 2200, protein: 135, fat: 75, carbs: 270 },
    { date: '今日', calories: 1580, protein: 85, fat: 45, carbs: 180 }
  ];

  const nutrition = calculateDailyNutrition();
  
  // 達成率計算
  const calorieProgress = Math.round((nutrition.calories / nutrition.targets.calories) * 100);
  const proteinProgress = Math.round((nutrition.protein / nutrition.targets.protein) * 100);
  const fatProgress = Math.round((nutrition.fat / nutrition.targets.fat) * 100);
  const carbsProgress = Math.round((nutrition.carbs / nutrition.targets.carbs) * 100);

  // トレンド計算
  const yesterdayCalories = weeklyTrends[weeklyTrends.length - 2]?.calories || 0;
  const calorieChange = nutrition.calories - yesterdayCalories;
  const caloriesTrend = calorieChange > 0 ? 'up' : calorieChange < 0 ? 'down' : 'stable';

  const handleCalendar = () => {
    console.log("カレンダー表示");
  };

  const trendPeriodOptions = [
    { key: '7days', label: '7日間' },
    { key: '14days', label: '2週間' },
    { key: '30days', label: '30日間' }
  ];

  const nutritionOptions = [
    { key: 'protein', label: 'タンパク質', unit: 'g', color: '#EF4444' },
    { key: 'fat', label: '脂質', unit: 'g', color: '#F59E0B' },
    { key: 'carbs', label: '炭水化物', unit: 'g', color: '#10B981' },
    { key: 'fiber', label: '食物繊維', unit: 'g', color: '#10B981' },
    { key: 'sugar', label: '糖質', unit: 'g', color: '#F97316' },
    { key: 'sodium', label: '塩分', unit: 'mg', color: '#8B5CF6' },
    { key: 'calcium', label: 'カルシウム', unit: 'mg', color: '#06B6D4' },
    { key: 'potassium', label: 'カリウム', unit: 'mg', color: '#84CC16' },
    { key: 'iron', label: '鉄分', unit: 'mg', color: '#DC2626' },
    { key: 'bcaa', label: 'BCAA', unit: 'g', color: '#F59E0B' },
    { key: 'vitaminD', label: 'ビタミンD', unit: 'μg', color: '#FBBF24' },
    { key: 'vitaminB', label: 'ビタミンB群', unit: 'mg', color: '#A78BFA' },
    { key: 'magnesium', label: 'マグネシウム', unit: 'mg', color: '#34D399' },
    { key: 'water', label: '水分量', unit: 'ml', color: '#60A5FA' }
  ];

  const getProgressColor = (progress: number) => {
    if (progress < 70) return 'bg-red-500';
    if (progress < 90) return 'bg-yellow-500';
    if (progress <= 110) return 'bg-green-500';
    return 'bg-orange-500';
  };

  const getProgressStatus = (progress: number) => {
    if (progress < 70) return { label: '不足', color: 'text-red-600' };
    if (progress < 90) return { label: 'やや不足', color: 'text-yellow-600' };
    if (progress <= 110) return { label: '良好', color: 'text-green-600' };
    return { label: '過多', color: 'text-orange-600' };
  };

  return (
    <div className={hideHeader ? "min-h-screen bg-white relative" : ""}>
      {/* 背景装飾 - hideHeaderの場合のみ */}
      {hideHeader && (
        <div className="absolute inset-0 bg-gradient-to-br from-blue-100/30 via-transparent to-indigo-50/20 pointer-events-none" style={{background: 'linear-gradient(135deg, rgba(70, 130, 180, 0.1) 0%, transparent 50%, rgba(70, 130, 180, 0.05) 100%)'}}></div>
      )}
      
      {!hideHeader && (
        <>
          {/* 戻るボタン */}
          <div className="absolute top-4 left-4 z-10">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="p-2 rounded-xl bg-white hover:bg-white  shadow-sm border border-gray-200"
            >
              <Menu size={20} style={{color: '#4682B4'}} />
            </Button>
          </div>

          {/* ホーム画面と同じヘッダー */}
          <CompactHeader
            currentDate={selectedDate}
            onDateSelect={onDateSelect}
            onCalendar={handleCalendar}
            onNavigateToProfile={() => {}}
            onNavigateToData={() => {}}
          />
        </>
      )}

      <div className={`space-y-4 ${hideHeader ? '' : 'px-4 py-4'}`}>
        {/* 詳細サマリーカード */}
        <Card className=" bg-white border border-slate-200/50 rounded-2xl shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-slate-800">食事分析</h3>
            <span className="text-xs text-slate-500">
              {selectedDate.toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' })}
            </span>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            {/* 摂取カロリー */}
            <div className="text-center">
              <div className="text-xs text-slate-500 mb-1">カロリー</div>
              <div className="font-bold text-health-primary">
                {nutrition.calories}
              </div>
              <div className="text-xs text-slate-400">kcal</div>
            </div>

            {/* 目標達成率 */}
            <div className="text-center">
              <div className="text-xs text-slate-500 mb-1">達成率</div>
              <div className={`font-bold ${
                calorieProgress >= 90 && calorieProgress <= 110 
                  ? 'text-success' 
                  : calorieProgress < 70 || calorieProgress > 130 
                    ? 'text-warning' 
                    : 'text-health-primary'
              }`}>
                {calorieProgress}
              </div>
              <div className="text-xs text-slate-400">%</div>
            </div>

            {/* 食事回数 */}
            <div className="text-center">
              <div className="text-xs text-slate-500 mb-1">食事回数</div>
              <div className="font-bold text-slate-700">
                {nutrition.mealCount}
              </div>
              <div className="text-xs text-slate-400">回</div>
            </div>
          </div>
        </Card>

        {/* 栄養バランス */}
        <Card className=" bg-white shadow-sm border border-gray-200 rounded-xl p-2">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-slate-800">栄養バランス</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigateToNutritionSettings && onNavigateToNutritionSettings()}
              className="p-1 rounded-lg hover:bg-gray-100"
              style={{color: '#4682B4'}}
            >
              <Settings size={14} />
            </Button>
          </div>
          <div className="space-y-2">
            {/* 選択された栄養素を表示 */}
            {nutritionOptions
              .filter(option => selectedNutrients[option.key as keyof typeof selectedNutrients])
              .map((option) => {
                const currentValue = option.key === 'protein' ? nutrition.protein :
                                  option.key === 'fat' ? nutrition.fat :
                                  option.key === 'carbs' ? nutrition.carbs :
                                  nutrition.extended[option.key as keyof typeof nutrition.extended];
                const targetValue = nutrition.targets[option.key as keyof typeof nutrition.targets];
                const progress = Math.round((currentValue / targetValue) * 100);
                
                return (
                  <div key={option.key}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center space-x-1.5">
                        <div 
                          className="w-2.5 h-2.5 rounded"
                          style={{ backgroundColor: option.color }}
                        ></div>
                        <span className="text-xs text-slate-700">{option.label}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-medium text-slate-800">
                          {currentValue}<span className="text-xs">{option.unit}</span>
                        </span>
                        <span className="text-xs text-slate-500 ml-0.5">
                          /{targetValue}{option.unit}
                        </span>
                      </div>
                    </div>
                    <Progress 
                      value={Math.min(progress, 100)} 
                      className="h-1.5 mb-0.5"
                      color={option.color}
                      backgroundColor={`${option.color}15`}
                    />
                    <div className="flex justify-between">
                      <span className="text-xs text-slate-500">{progress}%</span>
                      <span className={`text-xs ${getProgressStatus(progress).color}`}>
                        {getProgressStatus(progress).label}
                      </span>
                    </div>
                  </div>
                );
              })}
            
            {/* 選択された栄養素がない場合 */}
            {Object.values(selectedNutrients).every(selected => !selected) && (
              <div className="text-center py-4 text-slate-400">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-2">
                  <Settings size={14} className="text-slate-400" />
                </div>
                <p className="text-xs">設定ボタンから栄養素を選択</p>
              </div>
            )}
          </div>
        </Card>

        {/* 記録した食事内容 */}
        <div>
          <h3 className="font-semibold text-slate-800 mb-4 px-4">本日の食事記録</h3>
          <InstagramLikeFeed 
            mealData={mealData}
            selectedDate={selectedDate}
            onMealClick={(mealType, mealId) => {
              // 食事詳細表示の処理（必要に応じて実装）
              console.log('Meal clicked:', mealType, mealId);
            }}
          />
        </div>

        {/* トレンド（折りたたみ式） */}


      </div>
    </div>
  );
}