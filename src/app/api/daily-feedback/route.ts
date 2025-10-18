import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { admin } from '@/lib/firebase-admin';

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

    // 1日の記録データを取得（ここでは模擬データ）
    const dailyData = await getDailyRecords(userId, date);
    
    // フィードバックを生成
    const feedback = await generateDailyFeedback(dailyData, date);

    return NextResponse.json({
      success: true,
      feedback,
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
    const formattedMeals = (dailyRecord?.meals || []).map((meal: any) => ({
      calories: meal.calories || 0,
      protein: meal.protein || 0,
      fat: meal.fat || 0,
      carbs: meal.carbs || 0,
      foods: meal.foodItems || meal.items || [meal.name] || [],
      timestamp: meal.time || (meal.timestamp ? new Date(meal.timestamp._seconds * 1000 || meal.timestamp).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }) : '')
    }));
    
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
async function generateDailyFeedback(data: DailyRecord, date: string): Promise<string> {
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
  
  // プロンプトを作成
  const prompt = `
【データ分析専門AI】として、以下の健康記録を詳細に分析し、具体的で実用的なフィードバックを作成してください。

【${date}の記録データ】
🏃‍♂️ 体重: ${data.weight?.value || '未記録'}kg
🍽️ 食事回数: ${mealCount}回 (時間: ${mealTimes.join(', ') || '未記録'})
🔥 総カロリー: ${totalCalories}kcal (${calorieStatus})
📊 PFC比率: P${proteinRatio}% F${fatRatio}% C${carbsRatio}%
   - タンパク質: ${totalProtein}g
   - 脂質: ${totalFat}g
   - 炭水化物: ${totalCarbs}g
💪 運動: ${exerciseTime}分 (${data.exercises.map(ex => `${ex.type}${ex.duration}分`).join(', ') || '未実施'})

【具体的な食事内容】
${data.meals.map((meal, i) => `${i+1}. ${meal.timestamp}: ${meal.foods.join(', ')} (${meal.calories}kcal)`).join('\n') || '詳細記録なし'}

【分析指示】
1. **数値の具体的評価**: カロリー・PFC比率・食事タイミングを厳密に分析
2. **改善点の特定**: 数値データから明確な改善ポイントを抽出
3. **実行可能なアドバイス**: 明日から実践できる具体的な提案
4. **バランス評価**: 全体的な栄養バランスを客観的に評価

【出力形式】
📊 今日の記録
⚖️ 体重: ${data.weight?.value || '記録なし'}kg
🍽️ 食事: ${totalCalories}kcal (${mealCount}回) | P:${totalProtein}g F:${totalFat}g C:${totalCarbs}g
💪 運動: ${exerciseTime > 0 ? `${exerciseTime}分` : '記録なし'}

━━━━━━━━━━━━━━━━━━━━

🎯 体重管理
[記録状況と体重管理のコメント]

🥗 食事分析 (${totalCalories}kcal)
📈 カロリー評価: [${calorieStatus}の詳細分析]
⚖️ PFC比率: [P${proteinRatio}% F${fatRatio}% C${carbsRatio}%の評価]
⏰ 食事タイミング: [${mealCount}回の食事タイミング評価]

👍 良かった点:
・[具体的なデータに基づく良い点]
・[栄養バランスの良い部分]

🔧 改善できる点:
・[具体的な数値改善案]
・[食事内容の具体的改善案]

💡 明日の提案: [1つの具体的アクション]

💪 運動分析
[${exerciseTime}分の運動評価と具体的アドバイス]

━━━━━━━━━━━━━━━━━━━━

🌟 総合評価
[データに基づく客観的評価と励まし]

【出力要件】
- 数値を積極的に活用した具体的分析
- 毎日異なる内容になるよう詳細に
- 親しみやすいがデータドリブンな口調
- 実行可能な具体的アドバイス重視
`;

  try {
    // Gemini APIでフィードバック生成
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    
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
  return `📊 今日の記録
⚖️ 体重: ${data.weight?.value || '記録なし'}kg
🍽️ 食事: ${calories}kcal | P:${protein}g F:${fat}g C:${carbs}g
💪 運動: ${data.exercises.map(ex => `${ex.type} ${ex.duration}分`).join(', ') || '記録なし'}

━━━━━━━━━━━━━━━━━━━━

🎯 体重
記録お疲れさま！継続が一番大切だよ✨

🥗 食事
👍 今日良かったところ:
・タンパク質${protein}gしっかり摂れてる！
・3食バランス良く食べられてる👍

💡 もっと良くなるコツ:
・野菜をもう少し増やせると完璧
・水分もしっかり摂ろうね
明日も今日みたいに頑張ろう！

💪 運動
${exerciseTime > 0 ? `${exerciseTime}分も頑張った！素晴らしい🔥` : '明日は少しでも体を動かしてみよう💪'}

━━━━━━━━━━━━━━━━━━━━

🌟 今日も記録お疲れさま！
継続してるだけで確実に良い方向に向かってるよ✨
明日も一緒に頑張ろうね💪`;
}