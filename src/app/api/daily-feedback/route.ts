import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { admin } from '@/lib/firebase-admin';
import { createDailyFeedbackFlexMessage } from '@/services/flexMessageTemplates';
import { getUserPlan } from '@/utils/usageLimits';
import { getCharacterPersona, generateCharacterPrompt, getCharacterLanguage, getLanguageInstruction } from '@/utils/aiCharacterUtils';
import type { AICharacterSettings } from '@/types';

interface DailyRecord {
  weight?: { value: number; date: string };
  meals: Array<{
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
    foods: string[];
    timestamp: string;
  }>;
  exercises: Array<{
    type: string;
    duration: number;
    intensity: string;
    timestamp: string;
  }>;
}

export async function POST(request: NextRequest) {
  try {
    const { userId, date } = await request.json();

    if (!userId || !date) {
      return NextResponse.json({ error: 'userId and date are required' }, { status: 400 });
    }

    // プラン制限チェック
    const userPlan = await getUserPlan(userId);
    if (userPlan === 'free') {
      return NextResponse.json({ 
        error: 'フィードバック機能は有料プランの機能です。プランをアップグレードしてご利用ください。',
        needsUpgrade: true 
      }, { status: 403 });
    }

    // 1日の記録データを取得
    const dailyData = await getDailyRecords(userId, date);
    
    // プロファイル履歴から目標値を取得（アプリと統一）
    const targetValues = await getTargetValuesForDate(userId, date);
    console.log('🎯 取得した目標値:', { userId, date, targetValues });
    
    
    // フィードバックを生成（目標値情報も含める）
    const feedback = await generateDailyFeedback(dailyData, date, targetValues, userId);

    // ユーザー名を取得
    const userName = await getUserName(userId);

    // 体重比較のための前回体重を取得
    const weightComparison = await getWeightComparison(userId, date);
    
    // フィードバック用データを準備
    const feedbackData = {
      date: formatDate(date),
      weight: dailyData.weight,
      weightComparison: weightComparison,
      calories: Math.round(dailyData.meals.reduce((sum, meal) => sum + meal.calories, 0)),
      protein: Number(dailyData.meals.reduce((sum, meal) => sum + meal.protein, 0).toFixed(1)),
      fat: Number(dailyData.meals.reduce((sum, meal) => sum + meal.fat, 0).toFixed(1)),
      carbs: Number(dailyData.meals.reduce((sum, meal) => sum + meal.carbs, 0).toFixed(1)),
      exerciseTime: dailyData.exercises.reduce((sum, ex) => sum + ex.duration, 0),
      exercises: dailyData.exercises.map(ex => ({ 
        type: ex.type, 
        displayName: ex.displayName,
        duration: ex.duration,
        reps: ex.reps,
        weight: ex.weight,
        setsCount: ex.setsCount,
        distance: ex.distance
      })),
      mealCount: dailyData.meals.length
    };

    // Flexメッセージを生成
    const flexMessage = createDailyFeedbackFlexMessage(feedbackData, feedback, userName, targetValues);

    // フィードバックをFirestoreに保存
    const db = admin.firestore();
    const recordRef = db.doc(`users/${userId}/dailyRecords/${date}`);
    
    await recordRef.set({
      feedback: feedback,
      feedbackCreatedAt: new Date().toISOString()
    }, { merge: true });


    return NextResponse.json({
      success: true,
      feedback,
      flexMessage,
      feedbackData,
      date
    });

  } catch (error: any) {
    console.error('1日フィードバック生成エラー:', error);
    return NextResponse.json({
      error: '1日フィードバックの生成に失敗しました',
      details: error.message
    }, { status: 500 });
  }
}

// 1日の記録データを取得（Firebase Admin SDKで直接取得）
async function getDailyRecords(userId: string, date: string): Promise<DailyRecord> {
  try {
    
    const db = admin.firestore();
    const recordRef = db.doc(`users/${userId}/dailyRecords/${date}`);
    const recordSnap = await recordRef.get();
    
    if (!recordSnap.exists) {
      return {
        meals: [],
        exercises: []
      };
    }
    
    const dailyRecord = recordSnap.data();
    
    
    // Firebase Admin で取得したデータをAI用のフォーマットに変換
    const formattedMeals = (dailyRecord?.meals || []).map((meal: any) => {
      return {
        calories: meal.calories || 0,
        protein: meal.protein || 0,
        fat: meal.fat || 0,
        carbs: meal.carbs || 0,
        foods: meal.foodItems || meal.items || [meal.name] || [],
        timestamp: meal.time || (meal.timestamp ? new Date(meal.timestamp._seconds * 1000 || meal.timestamp).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }) : '')
      };
    });
    
    const formattedExercises = (dailyRecord?.exercises || []).map((exercise: any) => ({
      type: exercise.name || exercise.type || '運動',
      displayName: exercise.displayName || exercise.name || exercise.type || '運動',
      duration: exercise.duration || 0,
      reps: exercise.reps || exercise.repetitions || 0,
      weight: exercise.weight || 0,
      setsCount: exercise.setsCount || exercise.sets || 0,
      distance: exercise.distance || 0,
      intensity: exercise.type === 'strength' ? '筋トレ' : exercise.type === 'cardio' ? '有酸素' : '軽運動',
      timestamp: exercise.time || (exercise.timestamp ? new Date(exercise.timestamp._seconds * 1000 || exercise.timestamp).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }) : '')
    }));
    
    const result: DailyRecord = {
      weight: dailyRecord?.weight ? { value: dailyRecord.weight, date: date } : undefined,
      meals: formattedMeals,
      exercises: formattedExercises
    };
    
    
    return result;
    
  } catch (error) {
    console.error('📊 getDailyRecords エラー:', error);
    // エラー時はデフォルトデータを返却
    return {
      meals: [],
      exercises: []
    };
  }
}


// AIを使ってフィードバックを生成
async function generateDailyFeedback(
  data: DailyRecord, 
  date: string, 
  targetValues?: any, 
  userId?: string
): Promise<string> {
  // 栄養データを計算
  const totalCalories = Math.round(data.meals.reduce((sum, meal) => sum + meal.calories, 0));
  const totalProtein = Number(data.meals.reduce((sum, meal) => sum + meal.protein, 0).toFixed(1));
  const totalFat = Number(data.meals.reduce((sum, meal) => sum + meal.fat, 0).toFixed(1));
  const totalCarbs = Number(data.meals.reduce((sum, meal) => sum + meal.carbs, 0).toFixed(1));
  const totalExerciseTime = data.exercises.reduce((sum, ex) => sum + ex.duration, 0);

  // 詳細分析のためのデータ計算
  const exerciseTime = totalExerciseTime;
  const calorieStatus = totalCalories < 1200 ? '少なめ' : totalCalories > 2500 ? '多め' : '適量';
  const proteinRatio = totalCalories > 0 ? Math.round((totalProtein * 4 / totalCalories) * 100) : 0;
  const fatRatio = totalCalories > 0 ? Math.round((totalFat * 9 / totalCalories) * 100) : 0;
  const carbsRatio = totalCalories > 0 ? Math.round((totalCarbs * 4 / totalCalories) * 100) : 0;
  
  // 目標値との比較
  const targetCalories = targetValues?.targetCalories || 2000;
  const targetProtein = targetValues?.macros?.protein || 120;
  const targetFat = targetValues?.macros?.fat || 67;
  const targetCarbs = targetValues?.macros?.carbs || 250;
  
  const calorieAchievement = Number(((totalCalories / targetCalories) * 100).toFixed(1));
  const proteinAchievement = Number(((totalProtein / targetProtein) * 100).toFixed(1));
  const fatAchievement = Number(((totalFat / targetFat) * 100).toFixed(1));
  const carbsAchievement = Number(((totalCarbs / targetCarbs) * 100).toFixed(1));
  
  // 体重変化の分析（過去3日間の体重を取得して比較）
  const weightTrend = userId ? await getWeightTrend(userId, date) : '体重変化データなし';
  
  // キャラクターのペルソナを取得
  const persona = getCharacterPersona(null);
  
  // プロンプトを作成（中間レベル：親しみやすく + タメになる）
  const prompt = `
あなたは健康アドバイザー「${persona.name}」として、親しみやすく、でもちゃんとタメになるフィードバックをしてください。

## キャラクター設定
- 性格: ${persona.personality}
- 口調: ${persona.tone}
- アドバイススタイル: 友達のように親しみやすく、でも健康に関する「へ〜」と思える豆知識も教える

## 記録データ（${date}）
### 栄養バランス詳細
- 摂取カロリー: ${totalCalories}kcal / 目標: ${targetCalories}kcal (達成率: ${calorieAchievement}%)
- タンパク質: ${totalProtein}g (目標: ${targetProtein}g)
- 脂質: ${totalFat}g (目標: ${targetFat}g)
- 炭水化物: ${totalCarbs}g (目標: ${targetCarbs}g)
- 食事内容: ${data.meals.map(meal => meal.foods.join(', ')).join('、') || '記録なし'}


### 体重変化
- 体重: ${data.weight?.value || '未記録'}kg
- 変化: ${weightTrend}

## フィードバック要件
以下の形式で回答してください：

■ 食事評価
良かった点: [具体的に2-3点褒めて、なぜ良いかの理由も説明する。例：「今日は3食きちんと摂れてるね！規則正しい食事リズムが作れてる。タンパク質もしっかり摂れてるから筋肉にも良いよ。カロリーバランスも意識できててすごい！」]
改善点: [具体的な数値目標や、なぜ必要かの理由も含めて提案する。例：「あと野菜を100g増やそう。ビタミンCで疲労回復効果があるよ」]

## 指示
- ${persona.name}らしい親しみやすい口調を保つ
- でも健康に関する「へ〜」と思える豆知識も入れる
- 数値は具体的に（例：「タンパク質があと20g必要」「週150分の運動目標まであと30分」など）
- 理由も教える（例：「筋肉作るために必要」「代謝アップのため」「疲労回復効果」など）
- 記録があったらしっかり褒める
- わかりやすく、実行しやすいアドバイス
- 専門用語は使わず、日常的な言葉で説明
- 絵文字、マークダウン記号（**、***、---など）は一切使わない
- プレーンテキストで回答する
`;

  try {
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const rawText = response.text();
    
    // 絵文字とマークダウン記号を除去
    return cleanFeedbackText(rawText);
    
  } catch (error) {
    console.error('❌❌❌ AI生成エラー:', error);
    // フォールバック: 固定テンプレート
    return generateFallbackFeedback(data, totalCalories, totalProtein, totalFat, totalCarbs, totalExerciseTime);
  }
}

// AIが使えない場合のフォールバック（中間レベル）
function generateFallbackFeedback(
  data: DailyRecord, 
  calories: number, 
  protein: number, 
  fat: number, 
  carbs: number, 
  exerciseTime: number
): string {
  const hasMeals = data.meals.length > 0;
  const hasExercise = exerciseTime > 0;
  
  // 簡単な数値分析
  const proteinRatio = calories > 0 ? Math.round((protein * 4 / calories) * 100) : 0;
  const targetProtein = Math.max(60, protein + 20); // 最低60g、または現在より20g多く
  
  const fallbackText = `■ 食事評価

良かった点:
・${hasMeals ? `食事記録をつけてるのがすごくいいね！栄養バランスが見える化できて、これが健康管理の第一歩だよ。タンパク質${protein}g摂れてるのも筋肉維持に役立ってる！` : 'まずは記録をつける習慣から始めよう'}

改善点:
・${hasMeals ? `タンパク質をあと${targetProtein - protein}gぐらい増やせるといいかも。体重1kgあたり1g以上摂ると筋肉が落ちにくくなるよ。卵や鶏肉、豆腐なんかがおすすめ！` : '栄養記録を始めて食事バランスを見てみよう'}


`;

  // フォールバックテキストもクリーンアップ
  return cleanFeedbackText(fallbackText);
}

// 絵文字とマークダウン記号を除去する関数
function cleanFeedbackText(text: string): string {
  return text
    // 絵文字を除去（Unicode絵文字範囲）
    .replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '')
    // マークダウン記号を除去
    .replace(/\*{1,3}/g, '') // *, **, ***
    .replace(/_{1,3}/g, '') // _, __, ___
    .replace(/`{1,3}/g, '') // `, ```, `
    .replace(/#{1,6}\s*/g, '') // # から ######
    .replace(/[-=]{3,}/g, '') // ---, ===, ━━━
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // [text](link) → text
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1') // ![alt](image) → alt
    // 余分な空白や改行をクリーンアップ
    .replace(/\n{3,}/g, '\n\n') // 3つ以上の改行を2つに
    .replace(/[ \t]{2,}/g, ' ') // 連続するスペースやタブを1つに
    .trim();
}

// ユーザー名を取得
async function getUserName(userId: string): Promise<string | undefined> {
  try {
    const db = admin.firestore();
    const userRef = db.collection('users').doc(userId);
    const userSnap = await userRef.get();
    
    if (!userSnap.exists) {
      return undefined;
    }
    
    const userData = userSnap.data();
    return userData?.profile?.name || undefined;
  } catch (error) {
    console.error('ユーザー名取得エラー:', error);
    return undefined;
  }
}

// 日付をフォーマット（YYYY-MM-DD → M/D形式）
function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  } catch (error) {
    return dateString;
  }
}

// プロファイル履歴から目標値を取得（アプリと同じロジック）
async function getTargetValuesForDate(userId: string, date: string) {
  try {
    const db = admin.firestore();
    
    // 1. プロファイル履歴から指定日に有効なプロファイルを取得
    const profileHistoryRef = db.collection('users').doc(userId).collection('profileHistory');
    const snapshot = await profileHistoryRef
      .where('changeDate', '<=', date)
      .orderBy('changeDate', 'desc')
      .limit(1)
      .get();
    
    if (!snapshot.empty) {
      const profileData = snapshot.docs[0].data();
      
      return {
        targetCalories: profileData.targetCalories || 2000,
        bmr: profileData.bmr || 1500,
        tdee: profileData.tdee || 2000,
        macros: profileData.macros || {
          protein: 120,
          fat: 67,
          carbs: 250
        }
      };
    }
    
    // 2. プロファイル履歴がない場合、最新のカウンセリング結果を取得
    const counselingRef = db.collection('users').doc(userId).collection('counseling').doc('result');
    const counselingSnap = await counselingRef.get();
    
    if (counselingSnap.exists) {
      const counselingData = counselingSnap.data();
      const aiAnalysis = counselingData?.aiAnalysis?.nutritionPlan;
      
      if (aiAnalysis) {
        
        return {
          targetCalories: aiAnalysis.dailyCalories || 2000,
          bmr: aiAnalysis.bmr || 1500,
          tdee: aiAnalysis.tdee || 2000,
          macros: aiAnalysis.macros || {
            protein: Math.round((aiAnalysis.dailyCalories * 0.25) / 4),
            fat: Math.round((aiAnalysis.dailyCalories * 0.30) / 9),
            carbs: Math.round((aiAnalysis.dailyCalories * 0.45) / 4)
          }
        };
      }
    }
    
    // 3. デフォルト値
    return {
      targetCalories: 2000,
      bmr: 1500,
      tdee: 2000,
      macros: {
        protein: 120,
        fat: 67,
        carbs: 250
      }
    };
    
  } catch (error) {
    console.error('目標値取得エラー:', error);
    // エラー時はデフォルト値
    return {
      targetCalories: 2000,
      bmr: 1500,
      tdee: 2000,
      macros: {
        protein: 120,
        fat: 67,
        carbs: 250
      }
    };
  }
}

// 体重変化の傾向を分析（過去3日間）
async function getWeightTrend(userId: string, currentDate: string): Promise<string> {
  try {
    const db = admin.firestore();
    const currentDateObj = new Date(currentDate);
    
    // 過去3日間の日付を生成
    const dates = [];
    for (let i = 2; i >= 0; i--) {
      const date = new Date(currentDateObj);
      date.setDate(date.getDate() - i);
      dates.push(date.toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' }));
    }
    
    // 各日付の体重記録を取得
    const weights = [];
    for (const date of dates) {
      const recordRef = db.doc(`users/${userId}/dailyRecords/${date}`);
      const recordSnap = await recordRef.get();
      
      if (recordSnap.exists) {
        const data = recordSnap.data();
        if (data?.weight) {
          weights.push({
            date,
            weight: data.weight,
            dateObj: new Date(date)
          });
        }
      }
    }
    
    if (weights.length < 2) {
      return '体重変化の比較データが不足しています';
    }
    
    // 最新と最古の体重を比較
    const latestWeight = weights[weights.length - 1].weight;
    const oldestWeight = weights[0].weight;
    const weightChange = Math.round((latestWeight - oldestWeight) * 10) / 10;
    
    if (Math.abs(weightChange) < 0.1) {
      return '安定 (変化なし)';
    } else if (weightChange > 0) {
      return `+${weightChange}kg (${weights.length}日間で増加)`;
    } else {
      return `${weightChange}kg (${weights.length}日間で減少)`;
    }
    
  } catch (error) {
    console.error('体重変化分析エラー:', error);
    return '体重変化の分析中にエラーが発生しました';
  }
}

// 体重比較データを取得（現在の体重 vs 前回の体重）
async function getWeightComparison(userId: string, currentDate: string): Promise<{ current?: number; previous?: number; change?: number; changeText?: string }> {
  try {
    const db = admin.firestore();
    const currentDateObj = new Date(currentDate);
    
    // 現在の日付の体重を取得
    const currentRecordRef = db.doc(`users/${userId}/dailyRecords/${currentDate}`);
    const currentRecordSnap = await currentRecordRef.get();
    const currentWeight = currentRecordSnap.exists ? currentRecordSnap.data()?.weight : undefined;
    
    if (!currentWeight) {
      return {};
    }
    
    // 過去7日間で最も最近の体重記録を探す
    let previousWeight = undefined;
    for (let i = 1; i <= 7; i++) {
      const pastDate = new Date(currentDateObj);
      pastDate.setDate(pastDate.getDate() - i);
      const pastDateString = pastDate.toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' });
      
      const pastRecordRef = db.doc(`users/${userId}/dailyRecords/${pastDateString}`);
      const pastRecordSnap = await pastRecordRef.get();
      
      if (pastRecordSnap.exists && pastRecordSnap.data()?.weight) {
        previousWeight = pastRecordSnap.data()?.weight;
        break;
      }
    }
    
    if (!previousWeight) {
      return { current: currentWeight };
    }
    
    // 体重変化を計算
    const change = Math.round((currentWeight - previousWeight) * 10) / 10;
    let changeText = '';
    
    if (Math.abs(change) < 0.1) {
      changeText = '変化なし';
    } else if (change > 0) {
      changeText = `+${change}kg`;
    } else {
      changeText = `${change}kg`;
    }
    
    return {
      current: currentWeight,
      previous: previousWeight,
      change: change,
      changeText: changeText
    };
    
  } catch (error) {
    console.error('体重比較取得エラー:', error);
    return {};
  }
}