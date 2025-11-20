'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface BasicInfo {
  name: string;
  age: number | '';
  gender: 'male' | 'female' | 'other';
  height: number | '';
  weight: number | '';
}

interface Goal {
  type: 'rapid_loss' | 'moderate_loss' | 'slow_loss' | 'maintenance' | 'lean_gain' | 'moderate_gain' | 'bulk_gain';
  targetWeight?: number;
  targetDate?: string; // 目標達成日 (YYYY-MM-DD)
}

interface ActivityLevel {
  level: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
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
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9
  };
  
  return bmr * multipliers[activityLevel];
};

const calculateTargetCalories = (tdee: number, goal: Goal['type']) => {
  switch (goal) {
    case 'rapid_loss':
      return tdee - 700; // -0.7kg/週（急速減量）
    case 'moderate_loss':
      return tdee - 500; // -0.5kg/週（標準減量）
    case 'slow_loss':
      return tdee - 250; // -0.25kg/週（緩やか減量）
    case 'maintenance':
      return tdee; // 現状維持
    case 'lean_gain':
      return tdee + 200; // +0.2kg/週（リーンゲイン）
    case 'moderate_gain':
      return tdee + 300; // +0.3kg/週（筋肉増加）
    case 'bulk_gain':
      return tdee + 500; // +0.5kg/週（バルクアップ）
    default:
      return tdee;
  }
};

const calculatePFC = (targetCalories: number, weight: number, goal: Goal['type']) => {
  let proteinMultiplier = 1.6;
  
  // 目標別のタンパク質量調整
  if (goal === 'moderate_gain' || goal === 'bulk_gain') proteinMultiplier = 2.0;
  if (goal === 'lean_gain') proteinMultiplier = 1.8;
  if (goal === 'rapid_loss' || goal === 'moderate_loss' || goal === 'slow_loss') proteinMultiplier = 1.8;
  
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasCompletedCounseling, setHasCompletedCounseling] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);
  const [expandedCategory, setExpandedCategory] = useState<'loss' | 'maintenance' | 'gain' | null>(null);
  
  // カウンセリング完了状態をチェック
  React.useEffect(() => {
    const checkCounselingStatus = async () => {
      try {
        setIsCheckingStatus(true);
        
        // LocalStorageからカウンセリング結果をチェック
        const localResult = localStorage.getItem('counselingResult');
        
        if (localResult) {
          console.log('🔒 カウンセリング既に完了 - アクセス無効');
          setHasCompletedCounseling(true);
          return;
        }
        
        console.log('✅ カウンセリング未完了 - アクセス許可');
        setHasCompletedCounseling(false);
        
        // 開始時に古いカウンセリングキャッシュをクリア
        console.log('🧹 カウンセリングキャッシュをクリアしています...');
        localStorage.removeItem('hasCompletedCounseling');
        
      } catch (error) {
        console.error('カウンセリング状態チェックエラー:', error);
        setHasCompletedCounseling(false);
      } finally {
        setIsCheckingStatus(false);
      }
    };
    
    checkCounselingStatus();
  }, []);
  const [basicInfo, setBasicInfo] = useState<BasicInfo>({
    name: '',
    age: '',
    gender: 'male',
    height: '',
    weight: ''
  });
  const [goal, setGoal] = useState<Goal>({ 
    type: 'moderate_loss',
    targetWeight: 65,
    targetDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 3ヶ月後
  });
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>({ level: 'light' });

  const totalSteps = 3;

  const handleComplete = async () => {
    // 重複送信防止
    if (isSubmitting) {
      console.log('🚫 既に送信中です。重複送信を防止しました。');
      return;
    }
    
    // 名前が入力されているかチェック
    console.log('🔍 basicInfo.name:', basicInfo.name);
    console.log('🔍 basicInfo:', basicInfo);
    if (!basicInfo.name || !basicInfo.name.trim()) {
      alert('お名前を入力してください');
      setStep(1); // Step1に戻る
      return;
    }
    
    setIsSubmitting(true);
    console.log('🔥 カウンセリング完了ボタンが押されました - 名前チェックOK');
    
    // 空の値をデフォルト値で置き換え
    const cleanBasicInfo = {
      name: basicInfo.name,
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

    // 名前：cleanBasicInfoからそのまま使用
    console.log('🔍 cleanBasicInfo.name:', cleanBasicInfo.name);

    const counselingAnswers = {
      ...cleanBasicInfo,
      name: cleanBasicInfo.name, // cleanBasicInfoから直接取得
      goal: goal.type,
      primaryGoal: goal.type, // 保存処理で使用される
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
    localStorage.setItem('counselingAnswers', JSON.stringify(counselingAnswers));
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
    
    // 最後にフラグをリセット
    setIsSubmitting(false);
  };

  const generateAdvice = (goalType: Goal['type'], basicInfo: BasicInfo) => {
    const adviceMap = {
      rapid_loss: [
        '短期集中のため、水分と電解質の補給を忘れずに',
        '急激な減量のため、体調の変化に注意して進めましょう',
        '高タンパク質食品で筋肉の維持を心がけましょう'
      ],
      moderate_loss: [
        '無理な食事制限は避け、バランスの良い食事を心がけましょう',
        '有酸素運動と筋力トレーニングを組み合わせると効果的です',
        '1週間で0.5kgのペースで健康的に減量しましょう'
      ],
      slow_loss: [
        'ゆっくりとしたペースで無理なく続けることが大切です',
        '食事の質を重視し、栄養バランスを整えましょう',
        '長期的な習慣作りを意識して取り組みましょう'
      ],
      maintenance: [
        '現在の良い状態を維持するため、規則的な運動習慣を続けましょう',
        'バランスの良い食事で栄養バランスを保ちましょう',
        '定期的な体重・体調チェックで健康状態を把握しましょう'
      ],
      lean_gain: [
        '体脂肪の増加を抑えながら筋肉を増やしましょう',
        '質の良いタンパク質を体重×1.8g以上摂取しましょう',
        '筋力トレーニングに加えて適度な有酸素運動も取り入れましょう'
      ],
      moderate_gain: [
        'タンパク質をしっかり摂取し、筋力トレーニングを継続しましょう',
        '休養も筋肉成長には重要です。十分な睡眠を取りましょう',
        '段階的に負荷を上げながらトレーニングを行いましょう'
      ],
      bulk_gain: [
        '積極的にカロリーを摂取し、しっかりと体を大きくしましょう',
        '高強度の筋力トレーニングで筋肉に刺激を与えましょう',
        '十分な休息と睡眠で筋肉の回復と成長を促進しましょう'
      ]
    };

    return adviceMap[goalType];
  };

  const renderStep1 = () => (
    <div className="flex-1 px-6">
      <div className="space-y-8">
        {/* 名前 */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-slate-700 block">お名前</label>
          <input
            type="text"
            value={basicInfo.name}
            onChange={(e) => setBasicInfo(prev => ({ ...prev, name: e.target.value }))}
            className="w-full h-14 px-4 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-lg bg-white text-center"
            placeholder="お名前を入力"
          />
        </div>

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
          {/* 減量系 */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setExpandedCategory(expandedCategory === 'loss' ? null : 'loss')}
              className={`w-full p-4 rounded-2xl text-left transition-all flex items-center justify-between ${
                ['rapid_loss', 'moderate_loss', 'slow_loss'].includes(goal.type)
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <div>
                <div className="font-medium text-lg mb-1">減量・ダイエット</div>
                <div className="text-sm opacity-80">体重を減らして理想の体型を目指す</div>
              </div>
              <div className={`transition-transform ${expandedCategory === 'loss' ? 'rotate-180' : ''}`}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </button>
            
            {expandedCategory === 'loss' && (
              <div className="space-y-2 pl-4">
                <button
                  type="button"
                  onClick={() => {
                    setGoal(prev => ({ 
                      ...prev, 
                      type: 'slow_loss',
                      targetWeight: Math.max(30, (typeof basicInfo.weight === 'number' ? basicInfo.weight - 3 : 65)),
                      targetDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                    }));
                    setExpandedCategory(null);
                  }}
                  className={`w-full p-3 rounded-xl text-left transition-all ${
                    goal.type === 'slow_loss'
                      ? 'bg-blue-400 text-white shadow-sm'
                      : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
                  }`}
                >
                  <div className="font-medium mb-1">緩やか減量 (-0.25kg/週)</div>
                  <div className="text-sm opacity-80">無理なく健康的にダイエット</div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setGoal(prev => ({ 
                      ...prev, 
                      type: 'moderate_loss',
                      targetWeight: Math.max(30, (typeof basicInfo.weight === 'number' ? basicInfo.weight - 5 : 65)),
                      targetDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                    }));
                    setExpandedCategory(null);
                  }}
                  className={`w-full p-3 rounded-xl text-left transition-all ${
                    goal.type === 'moderate_loss'
                      ? 'bg-blue-400 text-white shadow-sm'
                      : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
                  }`}
                >
                  <div className="font-medium mb-1">標準減量 (-0.5kg/週)</div>
                  <div className="text-sm opacity-80">バランスの良いダイエット</div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setGoal(prev => ({ 
                      ...prev, 
                      type: 'rapid_loss',
                      targetWeight: Math.max(30, (typeof basicInfo.weight === 'number' ? basicInfo.weight - 8 : 65)),
                      targetDate: new Date(Date.now() + 70 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                    }));
                    setExpandedCategory(null);
                  }}
                  className={`w-full p-3 rounded-xl text-left transition-all ${
                    goal.type === 'rapid_loss'
                      ? 'bg-blue-400 text-white shadow-sm'
                      : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
                  }`}
                >
                  <div className="font-medium mb-1">集中減量 (-0.7kg/週)</div>
                  <div className="text-sm opacity-80">短期集中でしっかり減量</div>
                </button>
              </div>
            )}
          </div>

          {/* 維持系 */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => {
                setGoal({ type: 'maintenance' });
                setExpandedCategory(null);
              }}
              className={`w-full p-4 rounded-2xl text-left transition-all ${
                goal.type === 'maintenance'
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <div className="font-medium text-lg mb-1">健康維持</div>
              <div className="text-sm opacity-80">現在の体重をキープして健康的に過ごす</div>
            </button>
          </div>

          {/* 増量系 */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setExpandedCategory(expandedCategory === 'gain' ? null : 'gain')}
              className={`w-full p-4 rounded-2xl text-left transition-all flex items-center justify-between ${
                ['lean_gain', 'moderate_gain', 'bulk_gain'].includes(goal.type)
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <div>
                <div className="font-medium text-lg mb-1">増量・筋肉増加</div>
                <div className="text-sm opacity-80">筋力トレーニングで体を大きくする</div>
              </div>
              <div className={`transition-transform ${expandedCategory === 'gain' ? 'rotate-180' : ''}`}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </button>
            
            {expandedCategory === 'gain' && (
              <div className="space-y-2 pl-4">
                <button
                  type="button"
                  onClick={() => {
                    setGoal({ type: 'lean_gain' });
                    setExpandedCategory(null);
                  }}
                  className={`w-full p-3 rounded-xl text-left transition-all ${
                    goal.type === 'lean_gain'
                      ? 'bg-blue-400 text-white shadow-sm'
                      : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
                  }`}
                >
                  <div className="font-medium mb-1">リーンゲイン (+0.2kg/週)</div>
                  <div className="text-sm opacity-80">脂肪を抑えて筋肉増加</div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setGoal({ type: 'moderate_gain' });
                    setExpandedCategory(null);
                  }}
                  className={`w-full p-3 rounded-xl text-left transition-all ${
                    goal.type === 'moderate_gain'
                      ? 'bg-blue-400 text-white shadow-sm'
                      : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
                  }`}
                >
                  <div className="font-medium mb-1">筋肉増加 (+0.3kg/週)</div>
                  <div className="text-sm opacity-80">しっかり筋肉をつける</div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setGoal({ type: 'bulk_gain' });
                    setExpandedCategory(null);
                  }}
                  className={`w-full p-3 rounded-xl text-left transition-all ${
                    goal.type === 'bulk_gain'
                      ? 'bg-blue-400 text-white shadow-sm'
                      : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
                  }`}
                >
                  <div className="font-medium mb-1">バルクアップ (+0.5kg/週)</div>
                  <div className="text-sm opacity-80">積極的な増量・筋肉増加</div>
                </button>
              </div>
            )}
          </div>
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
                  <span>+{Math.round((goal.targetWeight - basicInfo.weight) * 10) / 10}kg増量</span>
                ) : goal.targetWeight < basicInfo.weight ? (
                  <span>-{Math.round((basicInfo.weight - goal.targetWeight) * 10) / 10}kg減量</span>
                ) : (
                  <span>現在の体重を維持</span>
                )
              ) : null}
            </div>
          </div>

          {/* 目標達成日 */}
          {(goal.type !== 'maintenance') && (
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
                    <div>残り{daysUntilTarget}日（約{Math.round(monthsUntilTarget * 10) / 10}ヶ月）</div>
                    <div className={`${monthlyPace > 2 ? 'text-red-500' : 'text-slate-500'}`}>
                      月{Math.round(monthlyPace * 10) / 10}kgペース
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
          className={`w-full p-5 rounded-2xl text-left transition-all ${
            activityLevel.level === 'sedentary'
              ? 'bg-blue-500 text-white shadow-md'
              : 'bg-slate-100 text-slate-700 active:bg-slate-200'
          }`}
        >
          <div className="font-medium text-lg mb-2">ほとんど運動しない (×1.2)</div>
          <div className="text-sm opacity-80">デスクワーク中心で、ほぼ座って過ごす</div>
        </button>

        <button
          type="button"
          onClick={() => setActivityLevel({ level: 'light' })}
          className={`w-full p-5 rounded-2xl text-left transition-all ${
            activityLevel.level === 'light'
              ? 'bg-blue-500 text-white shadow-md'
              : 'bg-slate-100 text-slate-700 active:bg-slate-200'
          }`}
        >
          <div className="font-medium text-lg mb-2">軽い運動をする (×1.375)</div>
          <div className="text-sm opacity-80">週1〜3回程度の軽い運動や散歩</div>
        </button>

        <button
          type="button"
          onClick={() => setActivityLevel({ level: 'moderate' })}
          className={`w-full p-5 rounded-2xl text-left transition-all ${
            activityLevel.level === 'moderate'
              ? 'bg-blue-500 text-white shadow-md'
              : 'bg-slate-100 text-slate-700 active:bg-slate-200'
          }`}
        >
          <div className="font-medium text-lg mb-2">定期的に運動する (×1.55)</div>
          <div className="text-sm opacity-80">週3〜5回程度の運動やスポーツ</div>
        </button>

        <button
          type="button"
          onClick={() => setActivityLevel({ level: 'active' })}
          className={`w-full p-5 rounded-2xl text-left transition-all ${
            activityLevel.level === 'active'
              ? 'bg-blue-500 text-white shadow-md'
              : 'bg-slate-100 text-slate-700 active:bg-slate-200'
          }`}
        >
          <div className="font-medium text-lg mb-2">激しい運動をする (×1.725)</div>
          <div className="text-sm opacity-80">週6〜7回の激しい運動やトレーニング</div>
        </button>

        <button
          type="button"
          onClick={() => setActivityLevel({ level: 'very_active' })}
          className={`w-full p-5 rounded-2xl text-left transition-all ${
            activityLevel.level === 'very_active'
              ? 'bg-blue-500 text-white shadow-md'
              : 'bg-slate-100 text-slate-700 active:bg-slate-200'
          }`}
        >
          <div className="font-medium text-lg mb-2">非常に激しい運動 (×1.9)</div>
          <div className="text-sm opacity-80">1日2回の運動や肉体労働</div>
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

  // ローディング中の表示
  if (isCheckingStatus) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">カウンセリング状態を確認中...</p>
        </div>
      </div>
    );
  }

  // カウンセリング完了済みの表示
  if (hasCompletedCounseling) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl p-8 text-center shadow-lg max-w-sm w-full">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">カウンセリング完了済み</h2>
          <p className="text-slate-600 mb-6">すでにカウンセリングは完了しています。<br />アプリで健康管理を続けましょう！</p>
          <Button 
            onClick={() => router.push('/dashboard')}
            className="w-full h-12 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-xl"
          >
            ダッシュボードへ
          </Button>
        </div>
      </div>
    );
  }

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
              onClick={() => {
                if (step === 1 && !basicInfo.name.trim()) {
                  alert('お名前を入力してください');
                  return;
                }
                setStep(step + 1);
              }}
              className="flex-1 h-14 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-2xl text-base shadow-md"
            >
              次へ
            </Button>
          ) : (
            <Button 
              onClick={handleComplete} 
              disabled={isSubmitting}
              className="flex-1 h-14 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed text-white font-medium rounded-2xl text-base shadow-md"
            >
              {isSubmitting ? '送信中...' : '完了'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}