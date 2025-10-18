import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { FirestoreService } from '@/services/firestoreService';

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

// 1日の記録データを取得（Firestoreから実際のデータを取得）
async function getDailyRecords(userId: string, date: string): Promise<DailyRecord> {
  try {
    console.log('📊 getDailyRecords開始:', { userId, date });
    
    const firestoreService = new FirestoreService();
    const dailyRecord = await firestoreService.getDailyRecord(userId, date);
    
    if (!dailyRecord) {
      console.log('📊 記録データなし - デフォルトデータを返却');
      return {
        meals: [],
        exercises: []
      };
    }
    
    console.log('📊 Firestoreデータ取得成功:', {
      hasMeals: !!dailyRecord.meals,
      mealsCount: dailyRecord.meals?.length || 0,
      hasExercises: !!dailyRecord.exercises,
      exercisesCount: dailyRecord.exercises?.length || 0,
      hasWeight: !!dailyRecord.weight
    });
    
    // Firestoreのデータ構造をAI用のフォーマットに変換
    const formattedMeals = (dailyRecord.meals || []).map(meal => ({
      calories: meal.calories || 0,
      protein: meal.protein || 0,
      fat: meal.fat || 0,
      carbs: meal.carbs || 0,
      foods: meal.foodItems || meal.items || [meal.name] || [],
      timestamp: meal.time || new Date(meal.timestamp || '').toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
    }));
    
    const formattedExercises = (dailyRecord.exercises || []).map(exercise => ({
      type: exercise.name || exercise.type || '運動',
      duration: exercise.duration || 0,
      intensity: exercise.type === 'strength' ? '筋トレ' : exercise.type === 'cardio' ? '有酸素' : '軽運動',
      timestamp: exercise.time || new Date(exercise.timestamp || '').toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })
    }));
    
    const result: DailyRecord = {
      weight: dailyRecord.weight ? { value: dailyRecord.weight, date: date } : undefined,
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

  // プロンプトを作成
  const prompt = `
以下は${date}の健康記録です。分かりやすく親しみやすい口調で、1日のフィードバックを作成してください。

【記録データ】
体重: ${data.weight?.value || '記録なし'}kg
総摂取カロリー: ${totalCalories}kcal
タンパク質: ${totalProtein}g
脂質: ${totalFat}g  
炭水化物: ${totalCarbs}g
運動: ${data.exercises.map(ex => `${ex.type} ${ex.duration}分`).join(', ') || '記録なし'}

【フィードバック形式】
📊 今日の記録
⚖️ 体重: [体重] (前回比較は省略)
🍽️ 食事: [カロリー]kcal | P:[タンパク質]g F:[脂質]g C:[炭水化物]g
💪 運動: [運動内容]

━━━━━━━━━━━━━━━━━━━━

🎯 体重
[1行でシンプルなコメント]

🥗 食事
👍 今日良かったところ:
・[具体的な良い点を2-3個、分かりやすく]

💡 もっと良くなるコツ:
・[改善点を2-3個、具体的で実行しやすく]
[明日試してほしいことを1つ]

💪 運動
[良かった点とアドバイスを簡潔に]

━━━━━━━━━━━━━━━━━━━━

🌟 [ポジティブな全体励まし]

【注意点】
- 専門用語は使わずPFCなど基本的な用語のみ
- 敬語は使わず親しみやすい口調
- 必ずポジティブな要素を含める
- 具体的で実行しやすいアドバイス
- 絵文字を適度に使用
`;

  try {
    // Gemini APIでフィードバック生成
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);
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