'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface BasicInfo {
  age: number | '';
  gender: 'male' | 'female' | 'other';
  height: number | '';
  weight: number | '';
}

interface Goal {
  type: 'weight_loss' | 'muscle_gain' | 'maintenance';
  targetWeight?: number;
  targetDate?: string; // 目標達成日 (YYYY-MM-DD)
}

interface ActivityLevel {
  level: 'sedentary' | 'light' | 'moderate';
}

const calculateBMR = (basicInfo: BasicInfo) => {
  const { age, gender, height, weight } = basicInfo;
  
  if (gender === 'male') {
    return 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
  } else if (gender === 'female') {
    return 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
  } else {
    // その他の場合は平均値を使用
    const maleValue = 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
    const femaleValue = 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
    return (maleValue + femaleValue) / 2;
  }
};

const calculateTDEE = (bmr: number, activityLevel: ActivityLevel['level']) => {
  const multipliers = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55
  };
  
  return bmr * multipliers[activityLevel];
};

const calculateTargetCalories = (tdee: number, goal: Goal['type']) => {
  switch (goal) {
    case 'weight_loss':
      return tdee - 400;
    case 'muscle_gain':
      return tdee + 300;
    case 'maintenance':
    default:
      return tdee;
  }
};

const calculatePFC = (targetCalories: number, weight: number, goal: Goal['type']) => {
  let proteinMultiplier = 1.6;
  if (goal === 'muscle_gain') proteinMultiplier = 2.0;
  if (goal === 'weight_loss') proteinMultiplier = 1.8;
  
  const protein = Math.round(weight * proteinMultiplier);
  const proteinCalories = protein * 4;
  
  const fatCalories = targetCalories * 0.25;
  const fat = Math.round(fatCalories / 9);
  
  const carbCalories = targetCalories - proteinCalories - fatCalories;
  const carbs = Math.round(carbCalories / 4);
  
  return { protein, fat, carbs };
};

export default function SimpleCounselingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  
  // 開始時に古いカウンセリングキャッシュをクリア
  React.useEffect(() => {
    console.log('🧹 カウンセリングキャッシュをクリアしています...');
    localStorage.removeItem('counselingResult');
    localStorage.removeItem('hasCompletedCounseling');
  }, []);
  const [basicInfo, setBasicInfo] = useState<BasicInfo>({
    age: '',
    gender: 'male',
    height: '',
    weight: ''
  });
  const [goal, setGoal] = useState<Goal>({ 
    type: 'weight_loss',
    targetWeight: 65,
    targetDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 3ヶ月後
  });
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>({ level: 'light' });

  const totalSteps = 3;

  const handleComplete = async () => {
    console.log('🔥 カウンセリング完了ボタンが押されました');
    
    // 空の値をデフォルト値で置き換え
    const cleanBasicInfo = {
      age: (typeof basicInfo.age === 'number' && basicInfo.age > 0) ? basicInfo.age : 
            (typeof basicInfo.age === 'string' && basicInfo.age !== '') ? parseInt(basicInfo.age) : 25,
      gender: basicInfo.gender,
      height: (typeof basicInfo.height === 'number' && basicInfo.height > 0) ? basicInfo.height : 
              (typeof basicInfo.height === 'string' && basicInfo.height !== '') ? parseFloat(basicInfo.height) : 170,
      weight: (typeof basicInfo.weight === 'number' && basicInfo.weight > 0) ? basicInfo.weight : 
              (typeof basicInfo.weight === 'string' && basicInfo.weight !== '') ? parseFloat(basicInfo.weight) : 70
    };
    
    console.log('📊 basicInfo original:', basicInfo);
    console.log('📊 cleanBasicInfo:', cleanBasicInfo);
    
    const bmr = calculateBMR(cleanBasicInfo);
    const tdee = calculateTDEE(bmr, activityLevel.level);
    const targetCalories = calculateTargetCalories(tdee, goal.type);
    const pfc = calculatePFC(targetCalories, cleanBasicInfo.weight, goal.type);

    // 目標期間を計算（目標日付から）
    const targetPeriod = goal.targetDate ? 
      Math.ceil((new Date(goal.targetDate).getTime() - Date.now()) / (30 * 24 * 60 * 60 * 1000))
      : null;

    const counselingAnswers = {
      ...cleanBasicInfo,
      goal: goal.type,
      targetWeight: goal.targetWeight,
      targetDate: goal.targetDate,
      activityLevel: activityLevel.level
    };

    const counselingResult = {
      id: `counseling_${Date.now()}`,
      answers: counselingAnswers,
      results: {
        bmr: Math.round(bmr),
        tdee: Math.round(tdee),
        targetCalories: Math.round(targetCalories),
        targetWeight: goal.targetWeight,
        targetDate: goal.targetDate,
        pfc
      },
      advice: generateAdvice(goal.type, cleanBasicInfo),
      createdAt: new Date().toISOString()
    };

    // ローカルストレージに保存
    localStorage.setItem('counselingResult', JSON.stringify(counselingResult));
    localStorage.setItem('hasCompletedCounseling', 'true');

    // Firestore保存とLINE通知を実行（AI分析なし）
    try {
      // LINE User IDをLIFFから取得
      let lineUserId: string | null = null;
      
      console.log('🔍 LIFF環境チェック:', {
        hasWindow: typeof window !== 'undefined',
        hasLiff: typeof window !== 'undefined' && !!window.liff,
        isLoggedIn: typeof window !== 'undefined' && window.liff && window.liff.isLoggedIn()
      });
      
      if (typeof window !== 'undefined' && window.liff && window.liff.isLoggedIn()) {
        try {
          const profile = await window.liff.getProfile();
          lineUserId = profile.userId;
          console.log('👤 LIFF LINE User ID:', lineUserId);
        } catch (error) {
          console.error('LIFF Profile取得エラー:', error);
          // エラー時も一時的にダミーIDを使用
          lineUserId = 'temp-user-' + Date.now();
          console.log('🧪 一時的なダミーID使用:', lineUserId);
        }
      } else {
        console.error('LIFF環境ではありません。一時的にダミーIDを使用します。');
        // LIFF環境でない場合も一時的にダミーIDを使用
        lineUserId = 'temp-user-' + Date.now();
        console.log('🧪 一時的なダミーID使用:', lineUserId);
      }
      
      console.log('🔍 最終的なlineUserId:', lineUserId);
      console.log('🔍 lineUserId type:', typeof lineUserId);
      console.log('🔍 lineUserId boolean:', !!lineUserId);
      
      // 強制的にダミーIDを設定（デバッグ用）
      if (!lineUserId) {
        lineUserId = 'debug-user-' + Date.now();
        console.log('🔧 強制ダミーID設定:', lineUserId);
      }
      
      const requestData = {
        answers: counselingAnswers,
        results: counselingResult.results,
        lineUserId: lineUserId
      };
      
      console.log('🚀 APIリクエスト送信開始...');
      console.log('📤 送信データ:', requestData);
      
      const response = await fetch('/api/counseling/save', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestData),
        });

        console.log('🔍 API Response Status:', response.status);
        if (response.ok) {
          const result = await response.json();
          console.log('✅ カウンセリング結果保存・LINE通知送信完了:', result);
        } else {
          const errorText = await response.text();
          console.error('❌ カウンセリング保存エラー:', {
            status: response.status,
            statusText: response.statusText,
            error: errorText
          });
        }
      }
    } catch (error) {
      console.error('カウンセリング保存API呼び出しエラー:', error);
    }

    // LINEに戻る
    if (typeof window !== 'undefined' && window.liff) {
      console.log('📱 LINEアプリに戻ります');
      window.liff.closeWindow();
    } else {
      // フォールバック：ダッシュボードに移動
      router.push('/dashboard');
    }
  };

  const generateAdvice = (goalType: Goal['type'], basicInfo: BasicInfo) => {
    const adviceMap = {
      weight_loss: [
        '無理な食事制限は避け、バランスの良い食事を心がけましょう',
        '有酸素運動と筋力トレーニングを組み合わせると効果的です',
        '1週間で0.5-1kgのペースで減量するのが理想的です'
      ],
      muscle_gain: [
        'タンパク質をしっかり摂取し、筋力トレーニングを継続しましょう',
        '休養も筋肉成長には重要です。十分な睡眠を取りましょう',
        '段階的に負荷を上げながらトレーニングを行いましょう'
      ],
      maintenance: [
        '現在の良い状態を維持するため、規則的な運動習慣を続けましょう',
        'バランスの良い食事で栄養バランスを保ちましょう',
        '定期的な体重・体調チェックで健康状態を把握しましょう'
      ]
    };

    return adviceMap[goalType];
  };

  const renderStep1 = () => (
    <div className="flex-1 px-6">
      <div className="space-y-8">
        {/* 年齢 */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-slate-700 block">年齢</label>
          <input
            type="number"
            inputMode="numeric"
            pattern="[0-9]*"
            min="18"
            max="80"
            value={basicInfo.age}
            onChange={(e) => setBasicInfo(prev => ({ ...prev, age: e.target.value === '' ? '' : parseInt(e.target.value) || '' }))}
            className="w-full h-14 px-4 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-lg bg-white text-center"
            placeholder="25"
          />
        </div>

        {/* 性別 */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-slate-700 block">性別</label>
          <div className="relative">
            <select
              value={basicInfo.gender}
              onChange={(e) => setBasicInfo(prev => ({ ...prev, gender: e.target.value as 'male' | 'female' | 'other' }))}
              className="w-full h-14 px-4 pr-12 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-lg bg-white"
              style={{ 
                appearance: 'none',
                WebkitAppearance: 'none',
                MozAppearance: 'none'
              }}
            >
              <option value="male">男性</option>
              <option value="female">女性</option>
              <option value="other">その他</option>
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 6L8 10L12 6" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
        </div>

        {/* 身長・体重 */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-3">
            <label className="text-sm font-medium text-slate-700 block">身長</label>
            <div className="relative">
              <input
                type="number"
                inputMode="decimal"
                step="0.1"
                min="140"
                max="200"
                value={basicInfo.height}
                onChange={(e) => setBasicInfo(prev => ({ ...prev, height: e.target.value === '' ? '' : parseFloat(e.target.value) || '' }))}
                className="w-full h-14 px-4 pr-12 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-lg bg-white text-center"
                placeholder="170"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">cm</span>
            </div>
          </div>
          
          <div className="space-y-3">
            <label className="text-sm font-medium text-slate-700 block">体重</label>
            <div className="relative">
              <input
                type="number"
                inputMode="decimal"
                step="0.1"
                min="30"
                max="150"
                value={basicInfo.weight}
                onChange={(e) => setBasicInfo(prev => ({ ...prev, weight: e.target.value === '' ? '' : parseFloat(e.target.value) || '' }))}
                className="w-full h-14 px-4 pr-12 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-lg bg-white text-center"
                placeholder="70"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">kg</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="flex-1 px-6">
      <div className="space-y-8">
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => setGoal(prev => ({ 
              ...prev, 
              type: 'weight_loss',
              targetWeight: Math.max(30, basicInfo.weight - 5),
              targetDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            }))}
            className={`w-full p-6 rounded-2xl text-left transition-all ${
              goal.type === 'weight_loss'
                ? 'bg-blue-500 text-white shadow-md'
                : 'bg-slate-100 text-slate-700 active:bg-slate-200'
            }`}
          >
            <div className="font-medium text-lg mb-2">ダイエット</div>
            <div className="text-sm opacity-80">体重を減らして理想の体型を目指す</div>
          </button>

          <button
            type="button"
            onClick={() => setGoal({ type: 'muscle_gain' })}
            className={`w-full p-6 rounded-2xl text-left transition-all ${
              goal.type === 'muscle_gain'
                ? 'bg-blue-500 text-white shadow-md'
                : 'bg-slate-100 text-slate-700 active:bg-slate-200'
            }`}
          >
            <div className="font-medium text-lg mb-2">筋肉量アップ</div>
            <div className="text-sm opacity-80">筋力トレーニングで体を大きくする</div>
          </button>

          <button
            type="button"
            onClick={() => setGoal({ type: 'maintenance' })}
            className={`w-full p-6 rounded-2xl text-left transition-all ${
              goal.type === 'maintenance'
                ? 'bg-blue-500 text-white shadow-md'
                : 'bg-slate-100 text-slate-700 active:bg-slate-200'
            }`}
          >
            <div className="font-medium text-lg mb-2">健康維持</div>
            <div className="text-sm opacity-80">現在の状態をキープして健康的に過ごす</div>
          </button>
        </div>

        {/* 詳細設定 */}
        <div className="bg-slate-50 rounded-2xl p-6 space-y-6">
          <h3 className="font-medium text-slate-900 text-lg">詳細設定</h3>
          
          {/* 目標体重 */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-slate-700 block">目標体重</label>
            <div className="relative">
              <input
                type="number"
                inputMode="decimal"
                step="0.1"
                min="30"
                max="150"
                value={goal.targetWeight || ''}
                onChange={(e) => setGoal(prev => ({ ...prev, targetWeight: e.target.value === '' ? undefined : parseFloat(e.target.value) || undefined }))}
                className="w-full h-12 px-4 pr-12 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white text-center"
                placeholder="目標体重"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">kg</span>
            </div>
            <div className="text-xs text-center text-slate-500">
              {goal.targetWeight && typeof basicInfo.weight === 'number' ? (
                goal.targetWeight > basicInfo.weight ? (
                  <span>+{goal.targetWeight - basicInfo.weight}kg増量</span>
                ) : goal.targetWeight < basicInfo.weight ? (
                  <span>-{basicInfo.weight - goal.targetWeight}kg減量</span>
                ) : (
                  <span>現在の体重を維持</span>
                )
              ) : null}
            </div>
          </div>

          {/* 目標達成日 */}
          {(goal.type === 'weight_loss' || goal.type === 'muscle_gain') && (
            <div className="space-y-3">
              <label className="text-sm font-medium text-slate-700 block">目標達成日</label>
              <input
                type="date"
                min={new Date().toISOString().split('T')[0]}
                max={new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                value={goal.targetDate || ''}
                onChange={(e) => setGoal(prev => ({ ...prev, targetDate: e.target.value }))}
                className="w-full h-12 px-4 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white text-center"
              />
              {goal.targetDate && goal.targetWeight && typeof basicInfo.weight === 'number' && goal.targetWeight !== basicInfo.weight && (() => {
                const daysUntilTarget = Math.ceil((new Date(goal.targetDate).getTime() - Date.now()) / (24 * 60 * 60 * 1000));
                const monthsUntilTarget = daysUntilTarget / 30;
                const monthlyPace = Math.abs((goal.targetWeight - basicInfo.weight) / monthsUntilTarget);
                
                return (
                  <div className="text-xs text-center text-slate-500 space-y-1">
                    <div>残り{daysUntilTarget}日（約{monthsUntilTarget.toFixed(1)}ヶ月）</div>
                    <div className={`${monthlyPace > 2 ? 'text-red-500' : 'text-slate-500'}`}>
                      月{monthlyPace.toFixed(1)}kgペース
                      {monthlyPace > 2 && ' ⚠️ 急激すぎる可能性があります'}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="flex-1 px-6">
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => setActivityLevel({ level: 'sedentary' })}
          className={`w-full p-6 rounded-2xl text-left transition-all ${
            activityLevel.level === 'sedentary'
              ? 'bg-blue-500 text-white shadow-md'
              : 'bg-slate-100 text-slate-700 active:bg-slate-200'
          }`}
        >
          <div className="font-medium text-lg mb-2">ほとんど運動しない</div>
          <div className="text-sm opacity-80">デスクワーク中心で、ほぼ座って過ごす</div>
        </button>

        <button
          type="button"
          onClick={() => setActivityLevel({ level: 'light' })}
          className={`w-full p-6 rounded-2xl text-left transition-all ${
            activityLevel.level === 'light'
              ? 'bg-blue-500 text-white shadow-md'
              : 'bg-slate-100 text-slate-700 active:bg-slate-200'
          }`}
        >
          <div className="font-medium text-lg mb-2">軽い運動をする</div>
          <div className="text-sm opacity-80">週1〜2回程度の軽い運動や散歩</div>
        </button>

        <button
          type="button"
          onClick={() => setActivityLevel({ level: 'moderate' })}
          className={`w-full p-6 rounded-2xl text-left transition-all ${
            activityLevel.level === 'moderate'
              ? 'bg-blue-500 text-white shadow-md'
              : 'bg-slate-100 text-slate-700 active:bg-slate-200'
          }`}
        >
          <div className="font-medium text-lg mb-2">定期的に運動する</div>
          <div className="text-sm opacity-80">週3〜5回程度の運動やスポーツ</div>
        </button>
      </div>
    </div>
  );

  const stepTitles = [
    '基本情報',
    '目標設定', 
    '運動習慣'
  ];

  const stepDescriptions = [
    'あなたの基本的な情報を教えてください',
    'どのような目標を達成したいですか？',
    '普段の運動レベルを教えてください'
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col max-w-md mx-auto relative">
      {/* ヘッダー */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="flex items-center justify-between p-4">
          <button 
            onClick={() => step > 1 ? setStep(step - 1) : router.back()}
            className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center active:bg-slate-200 transition-colors"
          >
            <ChevronLeft size={20} className="text-slate-600" />
          </button>
          
          <div className="text-center flex-1 mx-4">
            <h1 className="text-lg font-semibold text-slate-900">{stepTitles[step - 1]}</h1>
            <div className="flex justify-center mt-2">
              {[1, 2, 3].map((stepNum) => (
                <div 
                  key={stepNum}
                  className={`w-2 h-2 rounded-full mx-1 transition-colors ${
                    stepNum <= step ? 'bg-blue-500' : 'bg-slate-200'
                  }`}
                />
              ))}
            </div>
          </div>
          
          <div className="w-10" />
        </div>
      </div>

      {/* サブタイトル */}
      <div className="bg-white px-4 py-4 border-b border-slate-100">
        <p className="text-sm text-slate-600 text-center leading-relaxed">{stepDescriptions[step - 1]}</p>
      </div>

      {/* メインコンテンツ */}
      <div className="flex-1 flex flex-col py-8">
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
      </div>

      {/* ボトムボタン */}
      <div className="bg-white border-t border-slate-200 p-6 safe-area-bottom">
        <div className="flex gap-3">
          {step > 1 && (
            <Button 
              onClick={() => setStep(step - 1)} 
              variant="outline"
              className="flex-1 h-14 border-2 border-slate-200 text-slate-600 hover:bg-slate-50 rounded-2xl font-medium text-base"
            >
              戻る
            </Button>
          )}
          {step < 3 ? (
            <Button 
              onClick={() => setStep(step + 1)} 
              className="flex-1 h-14 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-2xl text-base shadow-md"
            >
              次へ
            </Button>
          ) : (
            <Button 
              onClick={handleComplete} 
              className="flex-1 h-14 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-2xl text-base shadow-md"
            >
              完了
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}