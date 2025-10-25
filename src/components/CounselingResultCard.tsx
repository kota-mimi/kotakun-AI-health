import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Activity, Target, Calendar, User, Ruler, Weight } from 'lucide-react';

interface CounselingResult {
  aiAnalysis?: {
    nutritionPlan: {
      dailyCalories: number;
      macros: {
        protein: number;
        carbs: number;
        fat: number;
      };
    };
  };
  answers: {
    age: number;
    gender: string;
    height: number;
    weight: number;
    goal: string;
    targetWeight: number;
    targetDate: string;
    activityLevel: string;
  };
  results: {
    bmr: number;
    tdee: number;
    targetCalories: number;
    pfc: {
      protein: number;
      fat: number;
      carbs: number;
    };
  };
}

interface CounselingResultCardProps {
  counselingResult: CounselingResult;
  onRecounseling?: () => void;
}

export function CounselingResultCard({ counselingResult, onRecounseling }: CounselingResultCardProps) {
  const answers = counselingResult?.answers || {};
  const results = counselingResult?.results || {};
  
  // デバッグ用ログ
  
  const getGoalText = (goal: string) => {
    switch(goal) {
      case 'weight_loss': return '体重を落としたい';
      case 'healthy_beauty': return '健康的にキレイになりたい';
      case 'weight_gain': return '体重を増やしたい';
      case 'muscle_gain': return '筋肉をつけたい';
      case 'lean_muscle': return '筋肉をつけながら痩せたい';
      case 'fitness_improve': return '運動不足解消・体力を向上したい';
      default: return '健康になりたい';
    }
  };

  const getGenderText = (gender: string) => {
    switch(gender) {
      case 'male': return '男性';
      case 'female': return '女性';
      default: return 'その他';
    }
  };

  const getActivityLevelText = (level: string) => {
    switch(level) {
      case 'sedentary': return 'ほとんど運動しない';
      case 'light': return '軽い運動をする';
      case 'moderate': return '定期的に運動する';
      default: return '軽い運動をする';
    }
  };

  const weightDifference = (answers.weight || 0) - (answers.targetWeight || 0);

  return (
    <Card className="w-full">
      <CardHeader className="bg-blue-500 text-white rounded-t-lg">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5" />
          <h3 className="text-lg font-semibold">あなたのカウンセリング結果</h3>
        </div>
      </CardHeader>
      
      <CardContent className="p-4 space-y-4">
        {/* 基本情報 */}
        <div className="space-y-3">
          <h4 className="font-medium text-gray-700 border-b pb-1">基本情報</h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-gray-500" />
              <span className="text-gray-600">年齢:</span>
              <span className="font-medium">{answers.age || '-'}歳</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-600">性別:</span>
              <span className="font-medium">{getGenderText(answers.gender || 'male')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Ruler className="w-4 h-4 text-gray-500" />
              <span className="text-gray-600">身長:</span>
              <span className="font-medium">{answers.height || '-'}cm</span>
            </div>
            <div className="flex items-center gap-2">
              <Weight className="w-4 h-4 text-gray-500" />
              <span className="text-gray-600">体重:</span>
              <span className="font-medium">{answers.weight || '-'}kg</span>
            </div>
          </div>
        </div>

        {/* 目標 */}
        <div className="space-y-3">
          <h4 className="font-medium text-gray-700 border-b pb-1">目標</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-blue-500" />
              <span className="text-gray-600">目標:</span>
              <span className="font-medium">{getGoalText(answers.goal || 'weight_loss')}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-600">目標体重:</span>
              <span className="font-medium">{answers.targetWeight || '-'}kg</span>
              {weightDifference !== 0 && (
                <span className={`text-xs px-2 py-1 rounded ${
                  weightDifference > 0 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                }`}>
                  {weightDifference > 0 ? `-${Math.abs(weightDifference)}kg` : `+${Math.abs(weightDifference)}kg`}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="text-gray-600">目標日:</span>
              <span className="font-medium">
                {answers.targetDate ? new Date(answers.targetDate).toLocaleDateString('ja-JP') : '-'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-600">活動レベル:</span>
              <span className="font-medium">{getActivityLevelText(answers.activityLevel || 'light')}</span>
            </div>
          </div>
        </div>

        {/* 1日の目安 */}
        <div className="space-y-3">
          <h4 className="font-medium text-gray-700 border-b pb-1">1日の目安</h4>
          <div className="bg-blue-50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-blue-600">{results.targetCalories || '-'}kcal</div>
            <div className="text-xs text-gray-600 mt-1">目標カロリー</div>
          </div>
          
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div className="bg-red-50 rounded-lg p-3 text-center">
              <div className="font-semibold text-red-600">{results.pfc?.protein || '-'}g</div>
              <div className="text-xs text-gray-600">タンパク質</div>
            </div>
            <div className="bg-yellow-50 rounded-lg p-3 text-center">
              <div className="font-semibold text-yellow-600">{results.pfc?.fat || '-'}g</div>
              <div className="text-xs text-gray-600">脂質</div>
            </div>
            <div className="bg-green-50 rounded-lg p-3 text-center">
              <div className="font-semibold text-green-600">{results.pfc?.carbs || '-'}g</div>
              <div className="text-xs text-gray-600">炭水化物</div>
            </div>
          </div>
        </div>

        {/* 代謝情報 */}
        <div className="space-y-3">
          <h4 className="font-medium text-gray-700 border-b pb-1">代謝情報</h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <div className="font-semibold text-gray-700">{results.bmr || '-'}kcal</div>
              <div className="text-xs text-gray-600">基礎代謝(BMR)</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <div className="font-semibold text-gray-700">{results.tdee || '-'}kcal</div>
              <div className="text-xs text-gray-600">総消費カロリー(TDEE)</div>
            </div>
          </div>
        </div>

        {/* 再診断ボタン */}
        {onRecounseling && (
          <Button 
            onClick={onRecounseling}
            variant="outline" 
            className="w-full mt-4"
          >
            カウンセリングを再実施
          </Button>
        )}
      </CardContent>
    </Card>
  );
}