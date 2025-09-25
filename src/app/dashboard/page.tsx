'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Camera, 
  Utensils, 
  Activity, 
  TrendingUp, 
  Heart,
  Droplet,
  Moon,
  Target,
  Plus
} from 'lucide-react';
import { calculateBMI, calculateTDEE, calculateCalorieTarget, formatCalories, formatWeight, formatBMI } from '@/utils/calculations';
import { formatDate, getTodayString } from '@/utils/date';

interface DashboardData {
  profile: {
    name: string;
    age: number;
    gender: string;
    height: number;
    weight: number;
    activityLevel: string;
    primaryGoal: string;
    targetWeight?: number;
  };
  todayStats: {
    calories: number;
    caloriesGoal: number;
    water: number;
    waterGoal: number;
    steps: number;
    stepsGoal: number;
    meals: number;
  };
}

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [aiAnalysis, setAiAnalysis] = useState<any>(null);

  useEffect(() => {
    const loadDashboardData = () => {
      try {
        const counselingAnswers = localStorage.getItem('counselingAnswers');
        const storedAiAnalysis = localStorage.getItem('aiAnalysis');
        
        if (counselingAnswers) {
          const answers = JSON.parse(counselingAnswers);
          
          const profile = {
            name: answers.name || 'ゲスト',
            age: answers.age || 30,
            gender: answers.gender || 'male',
            height: answers.height || 170,
            weight: answers.weight || 70,
            activityLevel: answers.activityLevel || 'moderate',
            primaryGoal: answers.primaryGoal || 'maintenance',
            targetWeight: answers.targetWeight
          };

          const userProfile = {
            ...profile,
            goals: [{ type: profile.primaryGoal }]
          } as any;

          // AI分析結果がある場合はそれを使用、なければ計算
          let caloriesGoal;
          if (storedAiAnalysis) {
            const analysis = JSON.parse(storedAiAnalysis);
            setAiAnalysis(analysis);
            caloriesGoal = analysis.nutritionPlan?.dailyCalories || calculateCalorieTarget(userProfile, userProfile.goals);
          } else {
            caloriesGoal = calculateCalorieTarget(userProfile, userProfile.goals);
          }

          const mockData: DashboardData = {
            profile,
            todayStats: {
              calories: 1200,
              caloriesGoal,
              water: 1500,
              waterGoal: storedAiAnalysis ? JSON.parse(storedAiAnalysis).nutritionPlan?.waterIntake || 2000 : 2000,
              steps: 6500,
              stepsGoal: 10000,
              meals: 2
            }
          };

          setDashboardData(mockData);
        } else {
          window.location.href = '/counseling';
        }
      } catch (error) {
        console.error('データ読み込みエラー:', error);
        window.location.href = '/counseling';
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const handleAddMeal = () => {
    // 将来的にはカメラ機能やモーダルを実装
    alert('食事追加機能は準備中です');
  };

  const handleAddExercise = () => {
    alert('運動記録機能は準備中です');
  };

  const handleAddWater = () => {
    if (dashboardData) {
      setDashboardData({
        ...dashboardData,
        todayStats: {
          ...dashboardData.todayStats,
          water: Math.min(dashboardData.todayStats.water + 200, dashboardData.todayStats.waterGoal)
        }
      });
    }
  };

  if (isLoading || !dashboardData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Heart className="h-12 w-12 text-green-600 mx-auto mb-4 animate-pulse" />
          <p className="text-lg text-gray-600">データを読み込み中...</p>
        </div>
      </div>
    );
  }

  const { profile, todayStats } = dashboardData;
  const bmi = calculateBMI(profile.weight, profile.height);
  const caloriesProgress = (todayStats.calories / todayStats.caloriesGoal) * 100;
  const waterProgress = (todayStats.water / todayStats.waterGoal) * 100;
  const stepsProgress = (todayStats.steps / todayStats.stepsGoal) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* ヘッダー */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            おかえりなさい、{profile.name}さん
          </h1>
          <p className="text-gray-600">
            {formatDate(new Date(), 'yyyy年MM月dd日')} の記録
          </p>
        </div>

        {/* 今日の概要 */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">カロリー</CardTitle>
              <Utensils className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCalories(todayStats.calories)}
              </div>
              <p className="text-xs text-gray-600">
                目標: {formatCalories(todayStats.caloriesGoal)}
              </p>
              <Progress value={caloriesProgress} className="mt-2" />
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">水分</CardTitle>
              <Droplet className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {todayStats.water}ml
              </div>
              <p className="text-xs text-gray-600">
                目標: {todayStats.waterGoal}ml
              </p>
              <Progress value={waterProgress} className="mt-2" />
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">歩数</CardTitle>
              <Activity className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {todayStats.steps.toLocaleString()}
              </div>
              <p className="text-xs text-gray-600">
                目標: {todayStats.stepsGoal.toLocaleString()}
              </p>
              <Progress value={stepsProgress} className="mt-2" />
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">BMI</CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatBMI(bmi)}
              </div>
              <p className="text-xs text-gray-600">
                {bmi < 18.5 ? '低体重' : bmi < 25 ? '普通体重' : bmi < 30 ? '過体重' : '肥満'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                現在: {formatWeight(profile.weight)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* クイックアクション */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={handleAddMeal}>
            <CardContent className="p-6 text-center">
              <Camera className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">食事を記録</h3>
              <p className="text-gray-600 text-sm mb-4">
                写真を撮ってAIが自動で栄養分析
              </p>
              <Button className="bg-green-600 hover:bg-green-700 text-white w-full">
                <Plus className="h-4 w-4 mr-2" />
                食事追加
              </Button>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={handleAddExercise}>
            <CardContent className="p-6 text-center">
              <Activity className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">運動を記録</h3>
              <p className="text-gray-600 text-sm mb-4">
                今日の運動や活動を記録しよう
              </p>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white w-full">
                <Plus className="h-4 w-4 mr-2" />
                運動追加
              </Button>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={handleAddWater}>
            <CardContent className="p-6 text-center">
              <Droplet className="h-12 w-12 text-cyan-600 mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">水分補給</h3>
              <p className="text-gray-600 text-sm mb-4">
                コップ1杯（200ml）追加
              </p>
              <Button className="bg-cyan-600 hover:bg-cyan-700 text-white w-full">
                <Plus className="h-4 w-4 mr-2" />
                水分追加
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* 今日の食事 */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Utensils className="h-5 w-5" />
              今日の食事 ({todayStats.meals}/3)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center text-gray-500 py-8">
              <Camera className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="mb-4">まだ食事が記録されていません</p>
              <Button onClick={handleAddMeal} className="bg-green-600 hover:bg-green-700 text-white">
                最初の食事を追加
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* AI分析結果がある場合のパーソナライズアドバイス */}
        {aiAnalysis ? (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-red-500" />
                🤖 AIからのパーソナライズアドバイス
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border-l-4 border-purple-500">
                  <h4 className="font-semibold text-purple-800 mb-2">あなた専用アドバイス</h4>
                  <p className="text-purple-700 text-sm whitespace-pre-line">
                    {aiAnalysis.personalizedAdvice}
                  </p>
                </div>

                {/* 栄養プラン */}
                {aiAnalysis.nutritionPlan && (
                  <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
                    <h4 className="font-semibold text-green-800 mb-2">🥗 推奨栄養プラン</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm text-green-700">
                      <p>🔥 カロリー: {aiAnalysis.nutritionPlan.dailyCalories}kcal/日</p>
                      <p>💪 タンパク質: {aiAnalysis.nutritionPlan.macros.protein}g</p>
                      <p>🍚 炭水化物: {aiAnalysis.nutritionPlan.macros.carbs}g</p>
                      <p>🥑 脂質: {aiAnalysis.nutritionPlan.macros.fat}g</p>
                      <p>🌾 食物繊維: {aiAnalysis.nutritionPlan.macros.fiber}g</p>
                      <p>💧 水分: {aiAnalysis.nutritionPlan.waterIntake}ml</p>
                    </div>
                  </div>
                )}

                {/* 推奨事項 */}
                {aiAnalysis.recommendations && aiAnalysis.recommendations.length > 0 && (
                  <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                    <h4 className="font-semibold text-blue-800 mb-2">📋 おすすめの行動</h4>
                    {aiAnalysis.recommendations.map((rec: any, index: number) => (
                      <div key={index} className="mb-2">
                        <p className="font-medium text-blue-700 text-sm">{rec.title}</p>
                        <ul className="list-disc list-inside text-xs text-blue-600 ml-2">
                          {rec.items.map((item: string, itemIndex: number) => (
                            <li key={itemIndex}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}

                {/* リスク要因があれば表示 */}
                {aiAnalysis.riskFactors && aiAnalysis.riskFactors.length > 0 && (
                  <div className="p-4 bg-orange-50 rounded-lg border-l-4 border-orange-500">
                    <h4 className="font-semibold text-orange-800 mb-2">⚠️ 注意点</h4>
                    {aiAnalysis.riskFactors.map((risk: any, index: number) => (
                      <p key={index} className="text-orange-700 text-sm mb-1">
                        {risk.message}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          /* 通常のアドバイス（AI分析がない場合） */
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                今日のアドバイス
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
                  <h4 className="font-semibold text-green-800 mb-2">栄養バランス</h4>
                  <p className="text-green-700 text-sm">
                    今日はまだカロリー摂取が目標の{Math.round(caloriesProgress)}%です。
                    バランスの良い食事を心がけましょう。
                  </p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                  <h4 className="font-semibold text-blue-800 mb-2">水分補給</h4>
                  <p className="text-blue-700 text-sm">
                    水分摂取が{Math.round(waterProgress)}%です。
                    あと{todayStats.waterGoal - todayStats.water}ml飲むと目標達成です。
                  </p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg border-l-4 border-purple-500">
                  <h4 className="font-semibold text-purple-800 mb-2">運動量</h4>
                  <p className="text-purple-700 text-sm">
                    今日の歩数は{todayStats.steps.toLocaleString()}歩です。
                    目標まであと{(todayStats.stepsGoal - todayStats.steps).toLocaleString()}歩です。
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}