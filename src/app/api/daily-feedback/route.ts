import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { admin } from '@/lib/firebase-admin';
import { createDailyFeedbackFlexMessage } from '@/services/flexMessageTemplates';

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

    // 1日の記録データを取得
    const dailyData = await getDailyRecords(userId, date);
    
    // プロファイル履歴から目標値を取得（アプリと統一）
    const targetValues = await getTargetValuesForDate(userId, date);
    
    // フィードバックを生成（目標値情報も含める）
    const feedback = await generateDailyFeedback(dailyData, date, targetValues, userId);

    // ユーザー名を取得
    const userName = await getUserName(userId);

    // フィードバック用データを準備
    const feedbackData = {
      date: formatDate(date),
      weight: dailyData.weight,
      calories: dailyData.meals.reduce((sum, meal) => sum + meal.calories, 0),
      protein: dailyData.meals.reduce((sum, meal) => sum + meal.protein, 0),
      fat: dailyData.meals.reduce((sum, meal) => sum + meal.fat, 0),
      carbs: dailyData.meals.reduce((sum, meal) => sum + meal.carbs, 0),
      exerciseTime: dailyData.exercises.reduce((sum, ex) => sum + ex.duration, 0),
      exercises: dailyData.exercises.map(ex => ({ type: ex.type, duration: ex.duration })),
      mealCount: dailyData.meals.length
    };

    // Flexメッセージを生成
    const flexMessage = createDailyFeedbackFlexMessage(feedbackData, feedback, userName, targetValues);

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
    console.log('📊 getDailyRecords開始:', { userId, date });
    
    const db = admin.firestore();
    const recordRef = db.doc(`users/${userId}/dailyRecords/${date}`);
    const recordSnap = await recordRef.get();
    
    if (!recordSnap.exists) {
      console.log('📊 記録データなし - デフォルトデータを返却');
      return {
        meals: [],
        exercises: []
      };
    }
    
    const dailyRecord = recordSnap.data();
    
    console.log('📊 Firebase Admin データ取得成功:', {
      hasMeals: !!dailyRecord?.meals,
      mealsCount: dailyRecord?.meals?.length || 0,
      hasExercises: !!dailyRecord?.exercises,
      exercisesCount: dailyRecord?.exercises?.length || 0,
      hasWeight: !!dailyRecord?.weight
    });
    
    // Firebase Admin で取得したデータをAI用のフォーマットに変換
    const formattedMeals = (dailyRecord?.meals || []).map((meal: any) => {
      console.log('📊 Meal データ:', {
        name: meal.name,
        calories: meal.calories,
        protein: meal.protein,
        fat: meal.fat,
        carbs: meal.carbs,
        allFields: Object.keys(meal)
      });
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
      duration: exercise.duration || 0,
      intensity: exercise.type === 'strength' ? '筋トレ' : exercise.type === 'cardio' ? '有酸素' : '軽運動',
      timestamp: exercise.time || (exercise.timestamp ? new Date(exercise.timestamp._seconds * 1000 || exercise.timestamp).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }) : '')
    }));
    
    const result: DailyRecord = {
      weight: dailyRecord?.weight ? { value: dailyRecord.weight, date: date } : undefined,
      meals: formattedMeals,
      exercises: formattedExercises
    };
    
    console.log('📊 フォーマット済みデータ:', {
      mealsCount: result.meals.length,
      exercisesCount: result.exercises.length,
      totalCalories: result.meals.reduce((sum, meal) => sum + meal.calories, 0)
    });
    
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
async function generateDailyFeedback(data: DailyRecord, date: string, targetValues?: any, userId?: string): Promise<string> {
  // 栄養データを計算
  const totalCalories = data.meals.reduce((sum, meal) => sum + meal.calories, 0);
  const totalProtein = data.meals.reduce((sum, meal) => sum + meal.protein, 0);
  const totalFat = data.meals.reduce((sum, meal) => sum + meal.fat, 0);
  const totalCarbs = data.meals.reduce((sum, meal) => sum + meal.carbs, 0);
  const totalExerciseTime = data.exercises.reduce((sum, ex) => sum + ex.duration, 0);

  // 詳細分析のためのデータ計算
  const mealCount = data.meals.length;
  const mealTimes = data.meals.map(meal => meal.timestamp).filter(t => t);
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
  
  const calorieAchievement = Math.round((totalCalories / targetCalories) * 100);
  const proteinAchievement = Math.round((totalProtein / targetProtein) * 100);
  const fatAchievement = Math.round((totalFat / targetFat) * 100);
  const carbsAchievement = Math.round((totalCarbs / targetCarbs) * 100);
  
  // 体重変化の分析（過去3日間の体重を取得して比較）
  const weightTrend = userId ? await getWeightTrend(userId, date) : '体重変化データなし';
  
  // プロンプトを作成
  const prompt = `
あなたは経験豊富なパーソナルトレーナーと管理栄養士の知識を持つアドバイザーです。
ユーザーから提供された1日の食事内容と運動内容を分析し、具体的で実践的なフィードバックを提供してください。

【${date}の記録データ】
📊 基本情報:
- 体重: ${data.weight?.value || '未記録'}kg
- 体重変化: ${weightTrend}
- 食事回数: ${mealCount}回 (記録時間: ${mealTimes.join(', ') || '未記録'})

🔥 カロリー分析:
- 摂取カロリー: ${totalCalories}kcal (目標: ${targetCalories}kcal)
- 達成率: ${calorieAchievement}% ${calorieAchievement >= 90 && calorieAchievement <= 110 ? '✅ 適正範囲' : calorieAchievement < 90 ? '⚠️ 不足' : '⚠️ 過多'}

🎯 PFC目標達成率:
- タンパク質: ${totalProtein}g / ${targetProtein}g (${proteinAchievement}%) ${proteinAchievement >= 90 ? '✅' : '⚠️'}
- 脂質: ${totalFat}g / ${targetFat}g (${fatAchievement}%) ${fatAchievement >= 80 && fatAchievement <= 120 ? '✅' : '⚠️'}
- 炭水化物: ${totalCarbs}g / ${targetCarbs}g (${carbsAchievement}%) ${carbsAchievement >= 80 && carbsAchievement <= 120 ? '✅' : '⚠️'}

💪 運動記録:
- 総運動時間: ${exerciseTime}分
- 運動内容: ${data.exercises.map(ex => `${ex.type}${ex.duration}分`).join(', ') || '未実施'}

🍽️ 食事詳細:
${data.meals.map((meal, i) => `${i+1}. ${meal.timestamp || '時間不明'}: ${meal.foods.join(', ')} (${meal.calories}kcal)`).join('\n') || '詳細記録なし'}

【絶対厳守ルール】
- 親しみやすく、友達のような口調で書く（敬語は使わない）
- 難しい言葉は使わず、分かりやすい表現にする
- 箇条書きは「・」で始める
- 各項目は150-200文字で具体的に書く
- 食事評価では絶対に食事・栄養の話のみ（運動の話は書くな）
- 運動評価では絶対に運動・身体活動の話のみ（食事の話は書くな）

【フィードバック形式】

■ 食事評価

良かった点:
・[食事・栄養で良かったことを150-200文字で親しみやすく褒める]

改善点:
・[食事・栄養で改善すべき点を150-200文字で親しみやすく提案]

■ 運動評価

良かった点:
・[運動・身体活動で良かったことを150-200文字で親しみやすく褒める]

改善提案:
・[運動・身体活動で改善すべき点を150-200文字で親しみやすく提案]

■ 総合アドバイス
・[今日の頑張りを認めて、励ましの言葉と軽いアドバイスを150-200文字で親しみやすく書く]

【禁止事項】
- 運動評価に食事・タンパク質・栄養・水分補給の話を絶対に書くな
- 食事評価に運動・筋トレ・有酸素運動の話を絶対に書くな
`;

  try {
    // Gemini APIでフィードバック生成
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
    
  } catch (error) {
    console.error('AI生成エラー:', error);
    // フォールバック: 固定テンプレート
    return generateFallbackFeedback(data, totalCalories, totalProtein, totalFat, totalCarbs, totalExerciseTime);
  }
}

// AIが使えない場合のフォールバック
function generateFallbackFeedback(
  data: DailyRecord, 
  calories: number, 
  protein: number, 
  fat: number, 
  carbs: number, 
  exerciseTime: number
): string {
  return `■ 食事評価

良かった点:
・タンパク質${protein}gもしっかり摂れてるね！筋肉を作るのに大切な栄養だから、この調子でバランス良く食べていこう。

改善点:
・野菜をもう少し増やせるともっといいかも。ビタミンとか食物繊維が体の調子を整えてくれるからね。

■ 運動評価

良かった点:
・${exerciseTime > 0 ? `${exerciseTime}分も体を動かしたんだね！継続することで体力もついてくるし、すごくいい感じだよ。` : '運動のことを意識してるだけでも大きな一歩だよ！'}

改善提案:
・${exerciseTime > 0 ? `今の運動を続けながら、始める前と終わった後にちょっとストレッチするともっと効果的だよ。` : `まずは10分くらいの散歩から始めてみない？無理しないペースが一番だよ。`}

■ 総合アドバイス
・今日もお疲れさま！毎日記録してるのが本当にすごいよ。少しずつでも続けることが一番大事だから、焦らず自分のペースで頑張ろうね。`;
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
      console.log('📊 プロファイル履歴から目標値取得:', {
        date,
        profileDate: profileData.changeDate,
        targetCalories: profileData.targetCalories
      });
      
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
        console.log('📊 カウンセリング結果から目標値取得:', {
          dailyCalories: aiAnalysis.dailyCalories,
          bmr: aiAnalysis.bmr,
          tdee: aiAnalysis.tdee
        });
        
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
    console.log('📊 デフォルト値を使用');
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