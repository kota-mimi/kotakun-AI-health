'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { CounselingAnswer, UserProfile } from '@/types';

const questions = [
  {
    id: 'basic_info',
    title: '基本情報',
    fields: [
      { id: 'name', label: 'お名前', type: 'text', required: true },
      { id: 'age', label: '年齢', type: 'number', required: true },
      { 
        id: 'gender', 
        label: '性別', 
        type: 'select', 
        options: [
          { value: 'male', label: '男性' },
          { value: 'female', label: '女性' },
          { value: 'other', label: 'その他' }
        ], 
        required: true 
      },
      { id: 'height', label: '身長 (cm)', type: 'number', required: true },
      { id: 'weight', label: '体重 (kg)', type: 'number', required: true },
    ]
  },
  {
    id: 'goals',
    title: '目標設定',
    fields: [
      { id: 'targetWeight', label: '目標体重 (kg)', type: 'number', required: false },
      { id: 'targetDate', label: 'いつまでに達成したいですか？', type: 'date', required: false },
      {
        id: 'primaryGoal',
        label: '目標タイプ',
        type: 'select',
        options: [
          { value: 'weight_loss', label: '体重を落としたい' },
          { value: 'healthy_beauty', label: '健康的にキレイになりたい' },
          { value: 'weight_gain', label: '体重を増やしたい' },
          { value: 'muscle_gain', label: '筋肉をつけたい' },
          { value: 'lean_muscle', label: '筋肉をつけながら痩せたい' },
          { value: 'fitness_improve', label: '運動不足解消・体力を助けたい' },
          { value: 'other', label: 'その他' }
        ],
        required: true
      },
      { id: 'targetAreas', label: '気になる、改善、強化したい部位', type: 'textarea', required: false },
    ]
  },
  {
    id: 'sleep',
    title: '睡眠について',
    fields: [
      {
        id: 'sleepDuration',
        label: '睡眠時間',
        type: 'select',
        options: [
          { value: 'under_3h', label: '3時間未満' },
          { value: '4_5h', label: '4~5時間' },
          { value: '6_7h', label: '6~7時間' },
          { value: '8h_plus', label: '8時間以上' }
        ],
        required: true
      },
      {
        id: 'sleepQuality',
        label: '睡眠の質',
        type: 'select',
        options: [
          { value: 'good', label: '良い' },
          { value: 'normal', label: '普通' },
          { value: 'bad', label: '悪い' }
        ],
        required: true
      }
    ]
  },
  {
    id: 'activity',
    title: '活動レベル',
    fields: [
      {
        id: 'activityLevel',
        label: '活動レベル',
        type: 'select',
        options: [
          { value: 'low', label: '低い（座っていることが多く、一日の運動は通勤通学買い物など）' },
          { value: 'slightly_low', label: 'やや低い（上記の人＋週に1.2回の適度な軽い運動する）' },
          { value: 'normal', label: '普通（外回りや肉体労働で働いている又は週に2.3回の強度な運動する）' },
          { value: 'high', label: '高い（上記の普通の人＋週に3〜5強度な運動をする）' },
          { value: 'very_high', label: 'かなり高い（アスリート、毎日強度な運動をする人）' }
        ],
        required: true
      }
    ]
  },
  {
    id: 'exercise',
    title: '運動習慣',
    fields: [
      {
        id: 'exerciseHabit',
        label: '運動習慣',
        type: 'select',
        options: [
          { value: 'yes', label: 'ある' },
          { value: 'no', label: 'ない' }
        ],
        required: true
      },
      {
        id: 'exerciseFrequency',
        label: '運動頻度',
        type: 'select',
        options: [
          { value: 'none', label: 'しない' },
          { value: 'weekly_1_2', label: '週1~2回' },
          { value: 'weekly_3_4', label: '週3~4回' },
          { value: 'weekly_5_6', label: '週5~6回' },
          { value: 'daily', label: '毎日' }
        ],
        required: true
      },
      {
        id: 'exerciseEnvironment',
        label: '運動環境',
        type: 'select',
        options: [
          { value: 'gym', label: 'ジム' },
          { value: 'home', label: '自宅（散歩、ランニング）' },
          { value: 'both', label: '両方' }
        ],
        required: false
      }
    ]
  },
  {
    id: 'diet',
    title: '食事習慣',
    fields: [
      {
        id: 'mealFrequency',
        label: '食事回数',
        type: 'select',
        options: [
          { value: '1', label: '1回' },
          { value: '2', label: '2回' },
          { value: '3', label: '3回' },
          { value: '4_plus', label: '4回以上' }
        ],
        required: true
      },
      {
        id: 'snackFrequency',
        label: '間食頻度',
        type: 'select',
        options: [
          { value: 'none', label: 'しない' },
          { value: 'sometimes', label: '時々食べる' },
          { value: 'almost_daily', label: 'ほぼ毎日食べる' },
          { value: 'daily', label: '毎日食べる' }
        ],
        required: true
      },
      {
        id: 'alcoholFrequency',
        label: '飲酒頻度',
        type: 'select',
        options: [
          { value: 'none', label: '飲まない' },
          { value: 'sometimes', label: '時々飲む' },
          { value: 'almost_daily', label: 'ほぼ毎日飲む' },
          { value: 'daily', label: '毎日飲む' }
        ],
        required: true
      },
      { id: 'dietaryRestrictions', label: '食事制限・希望', type: 'textarea', required: false }
    ]
  },
  {
    id: 'health_condition',
    title: '健康状態',
    fields: [
      { id: 'medicalConditions', label: '持病や既往歴があれば教えてください', type: 'textarea', required: false },
      { id: 'allergies', label: 'アレルギーがあれば教えてください', type: 'textarea', required: false },
    ]
  }
];

export default function CounselingPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const progress = ((currentStep + 1) / questions.length) * 100;

  const handleInputChange = (fieldId: string, value: any) => {
    setAnswers(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  const handleNext = () => {
    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      // ローカルストレージにカウンセリング回答を保存
      localStorage.setItem('counselingAnswers', JSON.stringify(answers));
      
      // LIFF経由でLINE User IDを取得
      let lineUserId = null;
      try {
        const liff = (await import('@line/liff')).default;
        if (liff.isLoggedIn()) {
          const profile = await liff.getProfile();
          lineUserId = profile.userId;
        }
      } catch (liffError) {
        console.log('LIFF User ID取得エラー:', liffError);
      }

      // AI分析APIを呼び出し
      // LIFF User IDがない場合はモックIDを使用
      const userId = lineUserId || `mock_user_${Date.now()}`;
      
      try {
        const response = await fetch('/api/counseling/analyze', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            answers,
            lineUserId: userId,
          }),
        });

        if (response.ok) {
          const result = await response.json();
          // AI分析結果をローカルストレージに保存
          localStorage.setItem('aiAnalysis', JSON.stringify(result.analysis));
          console.log('AI分析完了:', result.analysis);
        } else {
          console.error('AI分析APIエラー:', await response.text());
        }
      } catch (apiError) {
        console.error('AI分析API呼び出しエラー:', apiError);
      }
      
      // ダッシュボードへリダイレクト
      window.location.href = '/dashboard';
    } catch (error) {
      console.error('送信エラー:', error);
      // エラーが発生してもダッシュボードには進める
      window.location.href = '/dashboard';
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentQuestion = questions[currentStep];
  const isLastStep = currentStep === questions.length - 1;

  const renderField = (field: any) => {
    const value = answers[field.id] || '';

    switch (field.type) {
      case 'text':
        return (
          <Input
            id={field.id}
            value={value}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            required={field.required}
          />
        );
      
      case 'number':
        return (
          <Input
            id={field.id}
            type="number"
            value={value}
            onChange={(e) => handleInputChange(field.id, parseFloat(e.target.value) || '')}
            required={field.required}
          />
        );
      
      case 'date':
        return (
          <Input
            id={field.id}
            type="date"
            value={value}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            required={field.required}
          />
        );
      
      case 'select':
        return (
          <select
            id={field.id}
            value={value}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            required={field.required}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
          >
            <option value="">選択してください</option>
            {field.options.map((option: any) => (
              <option 
                key={typeof option === 'string' ? option : option.value} 
                value={typeof option === 'string' ? option : option.value}
              >
                {typeof option === 'string' ? option : option.label}
              </option>
            ))}
          </select>
        );
      
      case 'textarea':
        return (
          <Textarea
            id={field.id}
            value={value}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            required={field.required}
            rows={3}
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-center text-gray-800 mb-4">
            健康カウンセリング
          </h1>
          <Progress value={progress} className="w-full h-2" />
          <p className="text-center text-sm text-gray-600 mt-2">
            {currentStep + 1} / {questions.length}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl text-center">
              {currentQuestion.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {currentQuestion.fields.map((field) => (
              <div key={field.id} className="space-y-2">
                <Label htmlFor={field.id} className="font-medium">
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </Label>
                {renderField(field)}
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex justify-between mt-8">
          <Button
            variant="outline"
            onClick={handlePrev}
            disabled={currentStep === 0}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            前へ
          </Button>

          {isLastStep ? (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700 text-white px-8"
            >
              {isSubmitting ? '送信中...' : '完了'}
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
            >
              次へ
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}