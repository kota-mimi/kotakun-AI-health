import { GoogleGenerativeAI } from '@google/generative-ai';
import { getCharacterPersona, getCharacterLanguage, getLanguageInstruction } from '@/utils/aiCharacterUtils';
import { calculateBMI, calculateTDEE, calculateCalorieTarget, calculateMacroTargets } from '@/utils/calculations';
import type { UserProfile, CounselingAnswer } from '@/types';
import { admin } from '@/lib/firebase-admin';

class AIHealthService {
  private genAI: GoogleGenerativeAI;

  // 会話履歴を文字列に変換する共通メソッド
  private formatConversationHistory(conversations: any[] | undefined): string {
    if (!conversations || conversations.length === 0) {
      return '';
    }
    
    let conversationHistory = '\n\n【過去の会話】\n';
    conversations.slice(-3).forEach((conv, index) => {
      conversationHistory += `${index + 1}. ユーザー: ${conv.userMessage}\n${conv.aiResponse}\n`;
    });
    return conversationHistory + '\n';
  }

  constructor() {
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GOOGLE_GEMINI_API_KEY is not set');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  // カウンセリング結果を分析してパーソナライズアドバイスを生成
  async analyzeCounseling(answers: Record<string, any>) {
    try {
      // テスト環境では、モックアドバイスを生成
      const isTestMode = process.env.NODE_ENV === 'development' && answers.name?.includes('テスト');
      
      let personalizedAdvice;
      
      if (isTestMode) {
        personalizedAdvice = this.generateStructuredMockAdvice(answers);
      } else {
        try {
          const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
          const prompt = this.buildCounselingPrompt(answers);
          const result = await model.generateContent(prompt);
          const response = await result.response;
          personalizedAdvice = this.parseGeminiResponse(response.text());
        } catch (apiError) {
          console.error('Gemini API エラー - フォールバックを使用:', apiError);
          personalizedAdvice = this.generateStructuredMockAdvice(answers);
        }
      }

      // PFC・カロリー計算
      const nutritionPlan = this.calculateNutritionPlan(answers);

      return {
        personalizedAdvice,
        nutritionPlan,
        healthGoals: this.extractHealthGoals(answers),
        riskFactors: this.identifyRiskFactors(answers),
        recommendations: this.generateRecommendations(answers),
      };
    } catch (error) {
      console.error('AI分析エラー:', error);
      // 開発環境では常にフォールバックアドバイスを使用
      return {
        personalizedAdvice: this.generateStructuredMockAdvice(answers),
        nutritionPlan: this.calculateNutritionPlan(answers),
        healthGoals: this.extractHealthGoals(answers),
        riskFactors: this.identifyRiskFactors(answers),
        recommendations: this.generateRecommendations(answers),
      };
    }
  }

  // カウンセリングプロンプトを構築
  private buildCounselingPrompt(answers: Record<string, any>): string {
    const genderText = answers.gender === 'male' ? '男性' : answers.gender === 'female' ? '女性' : 'その他';
    
    const goalText = {
      'weight_loss': '体重を落としたい',
      'healthy_beauty': '健康的にキレイになりたい',
      'weight_gain': '体重を増やしたい',
      'muscle_gain': '筋肉をつけたい',
      'lean_muscle': '筋肉をつけながら痩せたい',
      'fitness_improve': '運動不足解消・体力を助けたい',
      'other': 'その他'
    }[answers.primaryGoal] || answers.primaryGoal;

    const sleepDurationText = {
      'under_3h': '3時間未満',
      '4_5h': '4~5時間',
      '6_7h': '6~7時間', 
      '8h_plus': '8時間以上'
    }[answers.sleepDuration] || answers.sleepDuration;

    const sleepQualityText = {
      'good': '良い',
      'normal': '普通',
      'bad': '悪い'
    }[answers.sleepQuality] || answers.sleepQuality;

    const activityLevelText = {
      'low': '低い（座っていることが多い）',
      'slightly_low': 'やや低い（週1-2回軽い運動）',
      'normal': '普通（週2-3回運動）',
      'high': '高い（週3-5回運動）',
      'very_high': 'かなり高い（アスリートレベル）'
    }[answers.activityLevel] || answers.activityLevel;

    return `
あなたは経験豊富な管理栄養士・健康コンサルタントです。
以下の詳細なカウンセリング結果を分析して、個別化された健康アドバイスを日本語で生成してください。

## ユーザー情報
### 基本情報
- 名前: ${answers.name}
- 年齢: ${answers.age}歳
- 性別: ${genderText}
- 身長: ${answers.height}cm
- 現在体重: ${answers.weight}kg
- 目標体重: ${answers.targetWeight || '設定なし'}kg
- 達成希望日: ${answers.targetDate || '設定なし'}
- 主な目標: ${goalText}
- 気になる部位: ${answers.targetAreas || '特になし'}

### 睡眠状況  
- 睡眠時間: ${sleepDurationText}
- 睡眠の質: ${sleepQualityText}

### 活動・運動状況
- 活動レベル: ${activityLevelText}
- 運動習慣: ${answers.exerciseHabit === 'yes' ? 'あり' : 'なし'}
- 運動頻度: ${answers.exerciseFrequency}
- 運動環境: ${answers.exerciseEnvironment || '設定なし'}

### 食事習慣
- 食事回数: ${answers.mealFrequency}回/日
- 間食頻度: ${answers.snackFrequency}
- 飲酒頻度: ${answers.alcoholFrequency}
- 食事制限・希望: ${answers.dietaryRestrictions || 'なし'}

### 健康状態
- 持病・既往歴: ${answers.medicalConditions || 'なし'}
- アレルギー: ${answers.allergies || 'なし'}

## 指示
以下の3つのセクションに分けて、それぞれ**5行以内**で簡潔にアドバイスを作成してください：

### 良いところ（5行以内）
この人の良い習慣や取り組みを具体的に褒める

### 改善ポイント（5行以内）
最も重要な改善点を1-2つに絞って指摘する

### アドバイス（5行以内）
目標達成のための具体的で実践しやすい提案を簡潔に

**重要**: 各セクションは必ず5行以内で、簡潔で親しみやすい内容にしてください。
`;
  }

  // 栄養プランを計算
  private calculateNutritionPlan(answers: Record<string, any>) {
    const profile: UserProfile = {
      name: answers.name,
      age: answers.age,
      gender: answers.gender,
      height: answers.height,
      weight: answers.weight,
      activityLevel: answers.activityLevel,
      goals: [{ type: answers.primaryGoal, targetValue: answers.targetWeight }]
    };

    const bmi = calculateBMI(profile.weight, profile.height);
    const tdee = calculateTDEE(profile);
    const calorieTarget = calculateCalorieTarget(profile, profile.goals);
    const macroTargets = calculateMacroTargets(calorieTarget);

    return {
      bmi,
      bmiCategory: this.getBMICategory(bmi),
      tdee: Math.round(tdee),
      dailyCalories: calorieTarget,
      macros: {
        protein: macroTargets.protein,
        carbs: macroTargets.carbohydrates,
        fat: macroTargets.fat,
        fiber: macroTargets.fiber,
      },
      waterIntake: this.calculateWaterIntake(profile.weight, profile.activityLevel),
    };
  }

  // BMIカテゴリを取得
  private getBMICategory(bmi: number): string {
    if (bmi < 18.5) return '低体重';
    if (bmi < 25) return '普通体重';
    if (bmi < 30) return '過体重';
    return '肥満';
  }

  // 水分摂取量計算
  private calculateWaterIntake(weight: number, activityLevel: string): number {
    const baseIntake = weight * 35; // 基本: 35ml/kg
    const multipliers = {
      low: 1,
      slightly_low: 1.1,
      normal: 1.2,
      high: 1.3,
      very_high: 1.4,
    };
    
    const multiplier = multipliers[activityLevel as keyof typeof multipliers] || 1;
    return Math.round(baseIntake * multiplier);
  }

  // 健康目標を抽出
  private extractHealthGoals(answers: Record<string, any>) {
    const goals = [];
    
    if (answers.primaryGoal === 'weight_loss') {
      goals.push({
        type: 'weight_loss',
        title: '体重減少',
        target: answers.targetWeight ? `${answers.targetWeight}kg` : '健康的な体重',
        deadline: '3ヶ月',
      });
    } else if (answers.primaryGoal === 'muscle_gain') {
      goals.push({
        type: 'muscle_gain',
        title: '筋肉増強',
        target: '筋力向上',
        deadline: '6ヶ月',
      });
    } else if (answers.primaryGoal === 'maintenance') {
      goals.push({
        type: 'maintenance',
        title: '現状維持',
        target: '健康な生活習慣の継続',
        deadline: '継続的',
      });
    }

    return goals;
  }

  // リスクファクターを特定
  private identifyRiskFactors(answers: Record<string, any>) {
    const risks = [];
    const bmi = calculateBMI(answers.weight, answers.height);

    if (bmi >= 30) {
      risks.push({
        type: 'obesity',
        level: 'high',
        message: 'BMI値が高めです。生活習慣病のリスクが高まる可能性があります。',
      });
    }

    // 睡眠リスクの評価
    if (answers.sleepDuration === 'under_3h' || answers.sleepDuration === '4_5h') {
      risks.push({
        type: 'sleep',
        level: 'high',
        message: '睡眠時間が不足しています。質の良い睡眠を心がけましょう。',
      });
    }

    if (answers.sleepQuality === 'bad') {
      risks.push({
        type: 'sleep_quality',
        level: 'medium',
        message: '睡眠の質に問題がありそうです。睡眠環境を見直してみましょう。',
      });
    }

    // 活動レベルのリスク
    if (answers.activityLevel === 'low') {
      risks.push({
        type: 'activity',
        level: 'medium',
        message: '活動量が少ないようです。少しずつ運動を取り入れてみましょう。',
      });
    }

    // 飲酒リスク
    if (answers.alcoholFrequency === 'daily' || answers.alcoholFrequency === 'almost_daily') {
      risks.push({
        type: 'alcohol',
        level: 'medium',
        message: '飲酒頻度が高めです。適量を意識して健康的な飲酒を心がけましょう。',
      });
    }

    return risks;
  }

  // 推奨事項を生成
  private generateRecommendations(answers: Record<string, any>) {
    const recommendations = [];

    // 食事の推奨
    const nutritionItems = [];
    
    if (answers.primaryGoal === 'weight_loss') {
      nutritionItems.push(
        '野菜を食事の半分以上に',
        'タンパク質を毎食に取り入れる',
        '間食は低カロリーなものを選ぶ'
      );
    } else if (answers.primaryGoal === 'muscle_gain') {
      nutritionItems.push(
        'タンパク質を体重×1.5-2g摂取',
        '炭水化物を運動後に摂取',
        '分割食事で栄養バランス重視'
      );
    }

    if (answers.mealFrequency === '1' || answers.mealFrequency === '2') {
      nutritionItems.push('食事回数を3回以上に増やす');
    }

    if (answers.snackFrequency === 'daily' || answers.snackFrequency === 'almost_daily') {
      nutritionItems.push('間食を健康的な食品に変更');
    }

    if (nutritionItems.length > 0) {
      recommendations.push({
        category: 'nutrition',
        title: '食事管理',
        items: nutritionItems,
      });
    }

    // 運動の推奨
    const exerciseItems = [];
    
    if (answers.activityLevel === 'low') {
      exerciseItems.push(
        '1日30分のウォーキングから始める',
        '階段を積極的に使う',
        'デスクワーク中は1時間に1度立ち上がる'
      );
    } else if (answers.exerciseHabit === 'no') {
      exerciseItems.push(
        '週2-3回の軽い運動から開始',
        '自宅でできる筋トレメニューを取り入れる'
      );
    }

    if (exerciseItems.length > 0) {
      recommendations.push({
        category: 'exercise',
        title: '運動習慣',
        items: exerciseItems,
      });
    }

    // 睡眠の推奨
    const sleepItems = [];
    
    if (answers.sleepDuration === 'under_3h' || answers.sleepDuration === '4_5h') {
      sleepItems.push('睡眠時間を7-8時間確保する');
    }
    
    if (answers.sleepQuality === 'bad') {
      sleepItems.push(
        '就寝前のスマホ使用を控える',
        '寝室環境を整える（温度・明るさ）'
      );
    }

    if (sleepItems.length > 0) {
      recommendations.push({
        category: 'sleep',
        title: '睡眠改善',
        items: sleepItems,
      });
    }

    // 生活習慣の推奨
    const lifestyleItems = [
      '規則正しい食事時間を心がける',
      '十分な水分補給を意識する'
    ];

    if (answers.alcoholFrequency === 'daily' || answers.alcoholFrequency === 'almost_daily') {
      lifestyleItems.push('飲酒は適量に控える');
    }

    recommendations.push({
      category: 'lifestyle',
      title: '生活習慣',
      items: lifestyleItems,
    });

    return recommendations;
  }

  // Geminiのレスポンスをパース
  private parseGeminiResponse(responseText: string): any {
    const sections = {
      positivePoints: "",
      improvements: "",
      advice: ""
    };

    try {
      // セクションごとに分割してパース
      const positiveMatch = responseText.match(/### 良いところ[^#]*?\n([\s\S]*?)(?=###|$)/);
      const improvementsMatch = responseText.match(/### 改善ポイント[^#]*?\n([\s\S]*?)(?=###|$)/);
      const adviceMatch = responseText.match(/### アドバイス[^#]*?\n([\s\S]*?)(?=###|$)/);

      if (positiveMatch) sections.positivePoints = positiveMatch[1].trim();
      if (improvementsMatch) sections.improvements = improvementsMatch[1].trim();
      if (adviceMatch) sections.advice = adviceMatch[1].trim();

      // セクションが見つからない場合はフォールバック
      if (!sections.positivePoints || !sections.improvements || !sections.advice) {
        return {
          positivePoints: "あなたの健康への意識と取り組みは素晴らしいです。",
          improvements: "継続的な取り組みでさらに改善できそうです。",
          advice: responseText.length > 500 ? responseText.substring(0, 200) + "..." : responseText
        };
      }

      return sections;
    } catch (error) {
      console.error('Geminiレスポンス解析エラー:', error);
      return {
        positivePoints: "あなたの健康への意識と取り組みは素晴らしいです。",
        improvements: "継続的な取り組みでさらに改善できそうです。",
        advice: "健康的な生活を心がけましょう。"
      };
    }
  }

  // 構造化されたモックアドバイスを生成（Flexメッセージ用）
  private generateStructuredMockAdvice(answers: Record<string, any>): any {
    const name = answers.name || 'ユーザー';
    const bmi = calculateBMI(answers.weight, answers.height);
    const bmiCategory = this.getBMICategory(bmi);
    
    const goalText = {
      'weight_loss': '体重を落とす',
      'healthy_beauty': '健康的にキレイになる', 
      'weight_gain': '体重を増やす',
      'muscle_gain': '筋肉をつける',
      'lean_muscle': '筋肉をつけながら痩せる',
      'fitness_improve': '運動不足解消・体力向上',
      'other': 'その他の目標'
    }[answers.primaryGoal] || answers.primaryGoal;

    // 良いところを分析
    const positivePoints = this.generatePositivePoints(answers);
    
    // 改善ポイントを分析
    const improvements = this.generateImprovements(answers);
    
    // 具体的なアドバイスを生成
    const advice = this.generateSpecificAdvice(answers, goalText);

    return {
      positivePoints,
      improvements, 
      advice
    };
  }

  // 良いところを生成（5行以内）
  private generatePositivePoints(answers: Record<string, any>): string {
    const points = [];
    
    if (answers.exerciseHabit === 'yes') points.push('運動習慣を継続中');
    if (answers.mealFrequency === '3') points.push('1日3食の規則正しい食事');
    if (answers.sleepDuration === '6_7h' || answers.sleepDuration === '8h_plus') points.push('十分な睡眠時間');
    if (answers.alcoholFrequency === 'never' || answers.alcoholFrequency === 'rarely') points.push('飲酒を控えめに');

    if (points.length === 0) {
      return '健康改善への意識が高く、カウンセリングを受けることで前向きに取り組む姿勢が素晴らしいです。';
    }

    return points.slice(0, 2).join('、') + 'など、良い習慣が身についています。この調子で継続していきましょう！';
  }

  // 改善ポイントを生成（5行以内）
  private generateImprovements(answers: Record<string, any>): string {
    const improvements = [];
    
    if (answers.activityLevel === 'low') improvements.push('日常の活動量を少し増やす');
    if (answers.sleepDuration === 'under_3h' || answers.sleepDuration === '4_5h') improvements.push('睡眠時間をもう1-2時間延ばす');
    if (answers.sleepQuality === 'bad') improvements.push('睡眠環境の見直し');
    if (answers.snackFrequency === 'daily') improvements.push('間食を健康的な食品に変更');
    
    if (improvements.length === 0) {
      return '現在の生活習慣を維持しながら、週2-3回の運動を追加することで目標達成がより確実になります。';
    }

    return improvements.slice(0, 2).join('、') + 'から始めることで、着実に目標に近づけます。';
  }

  // 具体的なアドバイスを生成（5行以内）
  private generateSpecificAdvice(answers: Record<string, any>, goalText: string): string {
    if (answers.primaryGoal === 'muscle_gain' || answers.primaryGoal === 'lean_muscle') {
      return '週2回の筋トレから開始し、大きな筋肉群（胸・背中・脚）を鍛えましょう。トレーニング後30分以内にタンパク質摂取を心がけることで効率的に筋肉をつけられます。';
    } else if (answers.primaryGoal === 'weight_loss') {
      return '食事は野菜中心にして、週3回の有酸素運動から始めましょう。無理な食事制限よりも、バランスの良い食事と継続可能な運動が重要です。';
    } else {
      return 'バランスの取れた食事、適度な運動、質の良い睡眠の3つを基本とし、無理なく継続できる範囲で改善していきましょう。小さな変化の積み重ねが成功の鍵です。';
    }
  }

  // テスト用のモックアドバイスを生成（後方互換性のため残す）
  private generateMockAdvice(answers: Record<string, any>): string {
    const name = answers.name || 'ゲスト';
    const bmi = calculateBMI(answers.weight, answers.height);
    const bmiCategory = this.getBMICategory(bmi);
    
    const goalText = {
      'weight_loss': '体重を落とす',
      'healthy_beauty': '健康的にキレイになる',
      'weight_gain': '体重を増やす',
      'muscle_gain': '筋肉をつける',
      'lean_muscle': '筋肉をつけながら痩せる',
      'fitness_improve': '運動不足解消・体力向上',
      'other': 'その他の目標'
    }[answers.primaryGoal] || answers.primaryGoal;

    return `${name}さん、詳細なカウンセリングにご協力いただき、ありがとうございます！

分析結果をお伝えします。現在のBMIは${bmi.toFixed(1)}（${bmiCategory}）で、「${goalText}」という目標に向けて、以下のアドバイスをお送りします。

【食事について】
現在の食事回数は${answers.mealFrequency}回/日ということですね。バランスの良い食事を心がけ、特にタンパク質を意識的に摂取することをお勧めします。間食は${answers.snackFrequency}とのことですので、栄養価の高いものを選びましょう。

【運動について】
活動レベルは「${answers.activityLevel}」で、運動習慣は「${answers.exerciseHabit === 'yes' ? 'あり' : 'なし'}」ですね。${answers.exerciseHabit === 'yes' ? 'これまでの運動習慣を活かしつつ、' : 'まずは軽い運動から始めて、'}目標達成に向けて継続していきましょう。

【睡眠について】
睡眠時間は${answers.sleepDuration}、睡眠の質は${answers.sleepQuality}とのこと。良質な睡眠は健康管理の基本です。規則正しい生活リズムを心がけてください。

あなたの生活スタイルに合わせて、無理なく継続できる健康習慣を身につけていきましょう。一歩一歩着実に進んでいけば、必ず目標達成できます。応援しています！`;
  }


  // テキストが体重記録の意図かどうかを判定
  async analyzeWeightRecordIntent(text: string) {
    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
      
      const prompt = `
テキスト「${text}」を分析して、体重記録の意図があるかどうか以下のJSONで返してください：

{
  "isWeightRecord": boolean,
  "weight": number,
  "confidence": number
}

判定基準：
- 数値＋体重単位：「65kg」「64.5キロ」「63.2」「81.5kg」「80kg」
- 体重記録の表現：「体重65kg」「今日の体重は64キロ」「体重記録 65.5」
- 質問・相談は除外：「体重どうやって減らす？」「何キロがいい？」

例：
- 「65kg」→ isWeightRecord: true, weight: 65
- 「81.5kg」→ isWeightRecord: true, weight: 81.5
- 「体重64.5キロ」→ isWeightRecord: true, weight: 64.5
- 「今日の体重は63kg」→ isWeightRecord: true, weight: 63
- 「体重どうやって減らす？」→ isWeightRecord: false

**重要：「81.5kg」「65kg」など数値+単位の単独入力は必ず体重記録として判定してください**
`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const jsonText = response.text().replace(/```json|```/g, '').trim();
      
      return JSON.parse(jsonText);
    } catch (error) {
      console.error('体重記録意図分析エラー:', error);
      // フォールバック: 体重パターンマッチング
      const weightMatch = text.match(/(\d+(?:\.\d+)?)(?:kg|キロ|キログラム)?/);
      const hasWeightKeyword = /体重|kg|キロ|キログラム/.test(text);
      
      if (weightMatch && hasWeightKeyword) {
        const weight = parseFloat(weightMatch[1]);
        
        return {
          isWeightRecord: true,
          weight: weight,
          confidence: 0.8
        };
      }
      
      return {
        isWeightRecord: false,
        weight: null,
        confidence: 0.5
      };
    }
  }

  // テキストが食事記録の意図かどうかを判定
  async analyzeFoodRecordIntent(text: string) {
    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
      
      const prompt = `
テキスト「${text}」を分析して、食事記録の意図があるかどうか以下のJSONで返してください：

{
  "isFoodRecord": boolean,
  "isDefiniteRecord": boolean,
  "hasSpecificMealTime": boolean,
  "mealTime": string,
  "isMultipleMealTimes": boolean,
  "mealTimes": [{"mealTime": string, "foodText": string}],
  "foodText": string,
  "confidence": number
}

判定基準：
- 食べ物の名前が含まれている（例：「唐揚げ」「からあげ」「ラーメン」「らーめん」「りんご」）
- 食事に関する動詞（食べた、たべた、飲んだ、のんだ、摂取した、記録して、きろくして、記録しといて、記録しとく）※動詞なしでも食事名があれば記録可能
- 明確な記録意図：「記録して」「きろくして」「記録しといて」「記録しとく」「食べた」「たべた」「摂取した」「昼 ラーメン」「夜 カツ丼」
- **重要：一回のテキストで2つ以上の食事時間が含まれている場合は必ずisMultipleMealTimes: trueにする**
- 曖昧な表現：「食べた！」「美味しかった」「おいしかった」（確認が必要）
- 食事時間：「朝」「あさ」「昼」「ひる」「夜」「よる」「朝食」「昼食」「夕食」「朝ごはん」「朝ご飯」「昼ごはん」「昼ご飯」「夜ごはん」「夜ご飯」「晩ごはん」「晩ご飯」「間食」「おやつ」
- 質問・相談は除外：「～はダイエットに良い？」「～のカロリーは？」

**重要: foodTextには分量を含む食事部分全体を入れる**

例：
- 「唐揚げ食べた記録して」→ isFoodRecord: true, isDefiniteRecord: true, foodText: "唐揚げ"
- 「からあげたべたきろくして」→ isFoodRecord: true, isDefiniteRecord: true, foodText: "からあげ"
- 「朝にパン食べた記録して」→ hasSpecificMealTime: true, mealTime: "breakfast", foodText: "パン"
- 「あさにぱんたべた」→ hasSpecificMealTime: true, mealTime: "breakfast", foodText: "ぱん"
- 「今日唐揚げ食べた！」→ isFoodRecord: true, isDefiniteRecord: false, foodText: "唐揚げ"
- 「きょうからあげたべた」→ isFoodRecord: true, isDefiniteRecord: false, foodText: "からあげ"
- 「唐揚げとご飯100g食べた！」→ isFoodRecord: true, isDefiniteRecord: true, foodText: "唐揚げとご飯100g"
- 「昼に唐揚げ食べたから記録しといて」→ hasSpecificMealTime: true, mealTime: "lunch", foodText: "唐揚げ"
- 「ご飯100g」→ isFoodRecord: true, isDefiniteRecord: true, foodText: "ご飯100g"
- 「食パン2枚記録して」→ isFoodRecord: true, isDefiniteRecord: true, foodText: "食パン2枚"
- 「らーめん」→ isFoodRecord: true, isDefiniteRecord: true, foodText: "らーめん"
- 「昼 ラーメン」→ hasSpecificMealTime: true, mealTime: "lunch", foodText: "ラーメン"
- 「夜 カツ丼とオムライス」→ hasSpecificMealTime: true, mealTime: "dinner", foodText: "カツ丼とオムライス"
- 「今 昼 ラーメン 唐揚げ4個 チャーハン 記録」→ hasSpecificMealTime: true, mealTime: "lunch", foodText: "ラーメン 唐揚げ4個 チャーハン"
- 「朝にパンとコーヒー 昼にカツ丼 夜に納豆」→ isMultipleMealTimes: true, mealTimes: [{"mealTime": "breakfast", "foodText": "パンとコーヒー"}, {"mealTime": "lunch", "foodText": "カツ丼"}, {"mealTime": "dinner", "foodText": "納豆"}]
- 「朝に唐揚げ 夜に納豆 記録して」→ isMultipleMealTimes: true, mealTimes: [{"mealTime": "breakfast", "foodText": "唐揚げ"}, {"mealTime": "dinner", "foodText": "納豆"}]
- 「朝におにぎりと卵焼き 昼にカツ丼とラーメン 夜にヨーグルト」→ isMultipleMealTimes: true, mealTimes: [{"mealTime": "breakfast", "foodText": "おにぎりと卵焼き"}, {"mealTime": "lunch", "foodText": "カツ丼とラーメン"}, {"mealTime": "dinner", "foodText": "ヨーグルト"}]
- 「昼食でハンバーガー 間食でケーキ記録して」→ isMultipleMealTimes: true, mealTimes: [{"mealTime": "lunch", "foodText": "ハンバーガー"}, {"mealTime": "snack", "foodText": "ケーキ"}]
- 「朝 パン 夜 カツ丼」→ isMultipleMealTimes: true, mealTimes: [{"mealTime": "breakfast", "foodText": "パン"}, {"mealTime": "dinner", "foodText": "カツ丼"}]
- 「朝ごはんにパン食べた」→ hasSpecificMealTime: true, mealTime: "breakfast", foodText: "パン"
- 「昼ご飯でラーメン記録して」→ hasSpecificMealTime: true, mealTime: "lunch", foodText: "ラーメン"
- 「夜ごはんのカツ丼」→ hasSpecificMealTime: true, mealTime: "dinner", foodText: "カツ丼"
- 「晩ご飯に唐揚げ」→ hasSpecificMealTime: true, mealTime: "dinner", foodText: "唐揚げ"
`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const jsonText = response.text().replace(/```json|```/g, '').trim();
      
      return JSON.parse(jsonText);
    } catch (error) {
      console.error('食事記録意図分析エラー:', error);
      // フォールバック: 食べ物名が含まれているかチェック
      const hasFoodName = /カレー|ラーメン|うどん|そば|パン|おにぎり|弁当|サラダ|寿司|パスタ|ご飯|丼|定食|ハンバーグ|唐揚げ|焼き魚|天ぷら|味噌汁|スープ|野菜|肉|魚|卵|米|麺|牛肉|豚肉|鶏肉|りんご|バナナ|ヨーグルト|チーズ|コーヒー|紅茶/.test(text);
      const hasRecordIntent = /食べた|飲んだ|摂取|記録/.test(text);
      
      return {
        isFoodRecord: hasFoodName,
        isDefiniteRecord: hasFoodName, // 食べ物名があれば記録として扱う
        hasSpecificMealTime: false,
        mealTime: null,
        foodText: text,
        confidence: 0.5
      };
    }
  }

  // テキストから食事内容を分析
  async analyzeMealFromText(mealText: string, userId?: string) {
    try {
      // ユーザーのキャラクター設定を取得
      let characterSettings = null;
      if (userId) {
        try {
          const db = admin.firestore();
          const profileRef = db.collection(`users/${userId}/profile`).orderBy('createdAt', 'desc').limit(1);
          const profileSnap = await profileRef.get();
          if (!profileSnap.empty) {
            characterSettings = profileSnap.docs[0].data()?.aiCharacter;
          }
        } catch (error) {
          console.warn('キャラクター設定取得エラー:', error);
        }
      }

      const persona = getCharacterPersona(characterSettings);
      const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
      
      const prompt = `

あなたは「${persona.name}」として振る舞ってください。

【キャラクター設定】
性格: ${persona.personality}
口調: ${persona.tone}

【重要なLINE応答ルール】
- nutritionAdviceは1-2行の短いメッセージ
- 改行を使って読みやすく
- 句読点は最小限
- **必ず食事内容に具体的に言及する**
- **栄養バランス（良い点・改善点）を明確に指摘**
- キャラクターの口調を反映

食事内容のテキスト「${mealText}」を分析して、以下の形式のJSONで返してください。

// 多言語対応指示（一時無効化 - 将来復活予定）
// **重要**: この食事は日本語、英語、韓国語、中国語、スペイン語など任意の言語で入力されています。言語に関係なく正確な栄養分析を行い、食品名は入力された言語のまま保持してください。

複数の食事が含まれている場合：
{
  "isMultipleMeals": true,
  "meals": [
    {
      "name": "料理名1（分量込み）",
      "displayName": "ユーザーが入力した正確な表記",
      "baseFood": "基本食品名",
      "portion": "分量部分",
      "calories": 推定カロリー数値（整数）,
      "protein": タンパク質のグラム数（小数点第1位まで）,
      "carbs": 炭水化物のグラム数（小数点第1位まで）,
      "fat": 脂質のグラム数（小数点第1位まで）
    },
    {
      "name": "料理名2（分量込み）",
      "displayName": "ユーザーが入力した正確な表記",
      "baseFood": "基本食品名",
      "portion": "分量部分",
      "calories": 推定カロリー数値（整数）,
      "protein": タンパク質のグラム数（小数点第1位まで）,
      "carbs": 炭水化物のグラム数（小数点第1位まで）,
      "fat": 脂質のグラム数（小数点第1位まで）
    }
  ],
  "totalCalories": 合計カロリー（整数）,
  "totalProtein": 合計タンパク質（小数点第1位まで）,
  "totalCarbs": 合計炭水化物（小数点第1位まで）,
  "totalFat": 合計脂質（小数点第1位まで）
}

単一の食事の場合：
{
  "isMultipleMeals": false,
  "foodItems": ["食品名（分量込み）"],
  "displayName": "ユーザーが入力した正確な表記",
  "baseFood": "基本食品名",
  "portion": "分量部分",
  "calories": 推定カロリー数値（整数）,
  "protein": タンパク質のグラム数（小数点第1位まで）,
  "carbs": 炭水化物のグラム数（小数点第1位まで）,
  "fat": 脂質のグラム数（小数点第1位まで）,
  "nutritionAdvice": "キャラクターの口調で1-2行の短いアドバイス（改行含む）"
}

**重要：材料列挙は一つの料理として認識**
- 「鍋 白菜 豚肉 きのこ」→ 一つの鍋料理として分析
- 「カレー 人参 玉ねぎ 豚肉」→ 一つのカレーとして分析
- 「サラダ レタス トマト きゅうり」→ 一つのサラダとして分析
- 「ラーメン チャーシュー もやし」→ 一つのラーメンとして分析

注意：
- 「と」「、」「＋」「&」などで複数の食事が結ばれている場合は複数食事として扱う
- カロリーは整数、PFC（タンパク質・脂質・炭水化物）は小数点第1位まで正確に計算
- 単位は含めない（例：カロリー350、タンパク質23.4）
- 食品名・料理名は日本語で
// 多言語対応指示（一時無効化 - 将来復活予定）
// - **多言語対応**: 食品名・料理名は入力された言語のまま保持
//   * 英語入力 → 英語で出力 (例: "fried chicken" → name: "fried chicken")
//   * 韓国語入力 → 韓国語で出力 (例: "치킨" → name: "치킨")  
//   * 中国語入力 → 中国語で出力 (例: "炸鸡" → name: "炸鸡")
//   * 日本語以外でも正確な栄養分析を行う
- **重要: 分量が指定されている場合は必ずその分量で正確に計算する**
- **displayNameにはユーザーが入力した文字をそのまま記録（勝手に分量を追加しない）**
- **nameには基本的な食品名のみ（「(3個)」「(1人前)」などの分量表記は追加しない）**
- baseFoodは基本的な食品名、portionは分量部分を分離

**重要: 現実的なカロリー計算を行う**
- ご飯1杯(150g): 約250kcal
- ラーメン1杯: 約400-600kcal（具材により変動）
- 唐揚げ3個: 約150kcal
- 食パン1枚: 約160kcal
- バナナ1本: 約90kcal
- おにぎり1個: 約180kcal
- カツ丼1杯: 約800kcal
- サラダ(野菜のみ): 約20-50kcal
- 過大評価しない: 1000kcal超えは大盛り・高カロリー食品のみ

分量指定の例：
- 「ご飯100g」→ displayName: "ご飯100g", baseFood: "ご飯", portion: "100g"
- 「餃子5個」→ displayName: "餃子5個", baseFood: "餃子", portion: "5個"
- 「食パン2枚」→ displayName: "食パン2枚", baseFood: "食パン", portion: "2枚"
`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const jsonText = response.text().replace(/```json|```/g, '').trim();
      
      const analysis = JSON.parse(jsonText);
      
      
      return analysis;
    } catch (error) {
      console.error('食事テキスト分析エラー:', error);
      // フォールバック値を返す（現実的な値に設定）
      return {
        foodItems: [mealText],
        displayName: mealText,
        baseFood: mealText,
        portion: "",
        calories: 250, // 一般的な1食分（ご飯1杯程度）
        protein: 8.0,  // 控えめなタンパク質
        carbs: 45.0,   // 主食中心
        fat: 5.0,      // 低脂質
        nutritionAdvice: 'バランスの良い食事を心がけましょう！'
      };
    }
  }

  // 画像から食事内容を分析
  async analyzeMealFromImage(imageBuffer: Buffer, userId?: string) {
    try {
      // ユーザーのキャラクター設定を取得
      let characterSettings = null;
      if (userId) {
        try {
          const db = admin.firestore();
          const profileRef = db.collection(`users/${userId}/profile`).orderBy('createdAt', 'desc').limit(1);
          const profileSnap = await profileRef.get();
          if (!profileSnap.empty) {
            characterSettings = profileSnap.docs[0].data()?.aiCharacter;
          }
        } catch (error) {
          console.warn('キャラクター設定取得エラー:', error);
        }
      }

      const persona = getCharacterPersona(characterSettings);
      const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
      
      const prompt = `

あなたは「${persona.name}」として振る舞ってください。

【キャラクター設定】
性格: ${persona.personality}
口調: ${persona.tone}

【重要なLINE応答ルール】
- nutritionAdviceは1-2行の短いメッセージ
- 改行を使って読みやすく
- 句読点は最小限
- **必ず食事内容に具体的に言及する**
- **栄養バランス（良い点・改善点）を明確に指摘**
- キャラクターの口調を反映

この画像を分析してください。まず、この画像が食事・料理・食べ物の写真かどうかを判定してください。

**重要**: 料理名・食品名は、その料理の一般的な言語で出力してください（和食→日本語、洋食→英語、韓国料理→韓国語、中華料理→中国語など）。適切な言語がない場合は英語を使用してください。

食事・料理・食べ物の場合は、以下の形式のJSONで返してください：
{
  "isFoodImage": true,
  // 以下の分析内容
}

複数の料理が写っている場合：
{
  "isFoodImage": true,
  "isMultipleMeals": true,
  "meals": [
    {
      "name": "料理名1",
      "calories": 推定カロリー数値（整数）,
      "protein": タンパク質のグラム数（小数点第1位まで）,
      "carbs": 炭水化物のグラム数（小数点第1位まで）,
      "fat": 脂質のグラム数（小数点第1位まで）
    },
    {
      "name": "料理名2",
      "calories": 推定カロリー数値（整数）,
      "protein": タンパク質のグラム数（小数点第1位まで）,
      "carbs": 炭水化物のグラム数（小数点第1位まで）,
      "fat": 脂質のグラム数（小数点第1位まで）
    }
  ],
  "totalCalories": 合計カロリー（整数）,
  "totalProtein": 合計タンパク質（小数点第1位まで）,
  "totalCarbs": 合計炭水化物（小数点第1位まで）,
  "totalFat": 合計脂質（小数点第1位まで）
}

単一の料理の場合：
{
  "isFoodImage": true,
  "isMultipleMeals": false,
  "foodItems": ["料理名"],
  "calories": 推定カロリー数値（整数）,
  "protein": タンパク質のグラム数（小数点第1位まで）,
  "carbs": 炭水化物のグラム数（小数点第1位まで）,
  "fat": 脂質のグラム数（小数点第1位まで）,
  "nutritionAdvice": "キャラクターの口調で1-2行の短いアドバイス（改行含む）"
}

注意：
- 複数の料理が明確に分かれて写っている場合は複数食事として扱う
- 料理名は具体的に（例：「ラーメン」「チャーハン」「唐揚げ」）
- 詳細な食材名ではなく、料理の名前で答える
- **重要：材料列挙は一つの料理として判定する**
  - 「鍋 白菜 豚肉 きのこ」→ 「鍋料理（白菜、豚肉、きのこ）」として一つの食事
  - 「カレー 人参 玉ねぎ 豚肉」→ 「カレー（人参、玉ねぎ、豚肉）」として一つの食事
  - 「サラダ レタス トマト きゅうり」→ 「サラダ（レタス、トマト、きゅうり）」として一つの食事
- カロリーは整数、PFC（タンパク質・脂質・炭水化物）は小数点第1位まで正確に計算
- 単位は含めない（例：カロリー350、タンパク質23.4）
- 推定は一般的な分量で計算

**重要: 現実的なカロリー計算を行う**
- ご飯1杯(150g): 約250kcal
- ラーメン1杯: 約400-600kcal（具材により変動）
- 唐揚げ3個: 約150kcal
- 食パン1枚: 約160kcal
- バナナ1本: 約90kcal
- おにぎり1個: 約180kcal
- カツ丼1杯: 約800kcal
- サラダ(野菜のみ): 約20-50kcal
- ハンバーガー1個: 約500kcal
- パスタ1人前: 約400-600kcal
- 過大評価しない: 1000kcal超えは大盛り・高カロリー食品のみ
- 小鉢・副菜: 50-150kcal程度

食事・料理・食べ物ではない場合（風景、人物、物など）：
{
  "isFoodImage": false,
  "description": "画像の簡潔な説明（30文字以内）"
}

例：
- 空の写真 → {"isFoodImage": false, "description": "青い空と雲の風景"}
- ペットの写真 → {"isFoodImage": false, "description": "可愛い犬の写真"}
- 建物の写真 → {"isFoodImage": false, "description": "建物の外観"}
`;

      const imagePart = {
        inlineData: {
          data: imageBuffer.toString('base64'),
          mimeType: 'image/jpeg',
        },
      };

      const result = await model.generateContent([prompt, imagePart]);
      const response = await result.response;
      const jsonText = response.text().replace(/```json|```/g, '').trim();
      
      const analysis = JSON.parse(jsonText);
      
      
      return analysis;
    } catch (error) {
      console.error('食事画像分析エラー:', error);
      // フォールバック値を返す（現実的な値に設定）
      return {
        foodItems: ['食事'],
        calories: 300, // 一般的な1食分
        protein: 12.0, // 控えめなタンパク質
        carbs: 45.0,   // 主食中心
        fat: 8.0,      // 適度な脂質
        nutritionAdvice: 'バランスの良い食事を心がけましょう！'
      };
    }
  }

  // 一般的な画像内容解析（通常モード用）
  async analyzeGeneralImage(imageBuffer: Buffer): Promise<string> {
    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
      
      const prompt = `
この画像を見て、内容を簡潔に説明してください。

**重要な指示：**
- 30文字以内で簡潔に
- 何が写っているかを分かりやすく
- 食べ物、人、動物、風景、物など主要な被写体を中心に
- 具体的で親しみやすい表現で

**例：**
- "美味しそうなラーメンの写真"
- "可愛い猫が座っている様子"
- "きれいな夕焼けの空"
- "机の上にあるコーヒーカップ"

説明文のみを返してください（JSON形式ではなく、文章のみ）。
`;

      const imagePart = {
        inlineData: {
          data: imageBuffer.toString('base64'),
          mimeType: 'image/jpeg',
        },
      };

      const result = await model.generateContent([prompt, imagePart]);
      const response = await result.response;
      const description = response.text().trim();
      
      return description;
    } catch (error) {
      console.error('🖼️ 一般画像解析エラー:', error);
      return '画像の内容を認識できませんでした';
    }
  }

  // 食事写真を分析（将来の機能 - 後方互換性のため残す）
  async analyzeMealImage(imageBuffer: Buffer) {
    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
      
      const prompt = `
この食事の写真を分析して、以下の情報を日本語のJSONで返してください：
{
  "dishes": ["料理名1", "料理名2"],
  "estimatedCalories": 概算カロリー,
  "macros": {
    "protein": タンパク質(g),
    "carbs": 炭水化物(g),
    "fat": 脂質(g)
  },
  "healthiness": "健康度(1-5)",
  "suggestions": ["改善提案1", "改善提案2"]
}
`;

      const imagePart = {
        inlineData: {
          data: imageBuffer.toString('base64'),
          mimeType: 'image/jpeg',
        },
      };

      const result = await model.generateContent([prompt, imagePart]);
      const response = await result.response;
      
      return JSON.parse(response.text());
    } catch (error) {
      console.error('食事画像分析エラー:', error);
      throw new Error('食事画像の分析に失敗しました');
    }
  }

  // レシピ質問かどうかを判定
  async isRecipeQuestion(userMessage: string): Promise<boolean> {
    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
      
      const prompt = `
「${userMessage}」がレシピや作り方を求めているかどうか判定してください。

判定基準：
- 「レシピ」「作り方」「どう作る」が含まれる
- 具体的な料理の作成方法を求めている
- 食材を使ったレシピ要求

true または false で回答してください。`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text().trim().toLowerCase();
      
      return text.includes('true');
    } catch (error) {
      console.error('レシピ判定エラー:', error);
      return false;
    }
  }

  // レシピ生成とFlexメッセージ作成
  async generateRecipeWithFlex(userMessage: string, userId?: string): Promise<{ textResponse: string; flexMessage?: any }> {
    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
      
      // 会話履歴を取得
      const history = userId ? await this.getConversationHistory(userId) : [];
      const conversationHistory = this.formatConversationHistory(history);

      const prompt = `
「${userMessage}」に対して、健康的なレシピを提案してください。

以下のJSON形式で返答：${conversationHistory}

\`\`\`json
{
  "recipeName": "料理名",
  "textResponse": "ユーザーの表現に合わせた雰囲気で親しみやすく説明",
  "ingredients": ["材料1", "材料2", "材料3"],
  "instructions": ["手順1", "手順2", "手順3"],
  "cookingInfo": {
    "cookingTime": "調理時間（例：30分）",
    "servings": "人数（例：1人分）",
    "calories": "カロリー（例：約400kcal）"
  },
  "healthTips": "この料理・食材の健康効果や栄養的メリットを親しみやすく説明"
}
\`\`\`

条件: 
- ユーザーのニュアンスに合わせたレシピ選択
- 材料12個以内、手順12ステップ以内
- 親しみやすい口調、敬語なし
- 栄養バランス重視`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      
      try {
        // マークダウン記号を除去してJSONを抽出
        let responseText = response.text();
        
        console.log('🔍 レシピAI生成結果（生データ）:', responseText.substring(0, 300));
        
        // JSONブロックを探す（より堅牢に）
        let jsonString = '';
        
        // ```json...``` パターンをチェック
        const jsonBlockMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonBlockMatch) {
          jsonString = jsonBlockMatch[1].trim();
        } else {
          // { ... } パターンを探す
          const jsonMatch = responseText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            jsonString = jsonMatch[0].trim();
          } else {
            // JSON形式が見つからない場合
            throw new Error('JSON形式のレスポンスが見つかりません');
          }
        }
        
        console.log('🔍 抽出されたJSON:', jsonString.substring(0, 200));
        
        const jsonResponse = JSON.parse(jsonString);
        
        // Flexメッセージを生成
        const { createRecipeFlexMessage } = await import('./flexMessageTemplates');
        const flexMessage = createRecipeFlexMessage(
          jsonResponse.recipeName,
          jsonResponse.ingredients,
          jsonResponse.instructions,
          jsonResponse.cookingInfo,
          jsonResponse.healthTips
        );
        
        return {
          textResponse: jsonResponse.textResponse,
          flexMessage: flexMessage
        };
      } catch (parseError) {
        console.error('レシピJSON解析エラー:', parseError);
        // フォールバック: 通常のテキストレスポンス
        return {
          textResponse: await this.generateAdvancedResponse(userMessage, userId)
        };
      }
    } catch (error) {
      console.error('レシピ生成エラー:', error);
      return {
        textResponse: 'すみません、レシピの生成で問題が発生しました。もう一度お試しください。'
      };
    }
  }

  // 高性能な会話レスポンスを生成（通常モード用・専門的なパーソナルトレーナー）
  async generateAdvancedResponse(userMessage: string, userId?: string): Promise<string> {
    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
      
      // 会話履歴を取得
      const history = userId ? await this.getConversationHistory(userId) : [];
      const conversationHistory = this.formatConversationHistory(history);
      
      const prompt = `
あなたは「ヘルシーくん」という親しみやすく経験豊富なパーソナルトレーナー兼栄養管理士です。
タメ口で親しみやすい自然な口調で、友達感覚で話してください。

**重要な応答ルール：
- キャラクター名で始めない
- ユーザーの質問をオウム返ししない
- 回答内容から直接始める**

## 応答スタイル
- **軽い会話・挨拶**: 短く自然に
- **情報質問**: 簡潔にポイントを
- **相談・悩み**: 共感して具体的な解決策を提供

## 専門知識
栄養学、筋トレ、有酸素運動、ダイエット、生活習慣、健康管理、体型改善、レシピ・料理、食事プランニング

## 話し方
- 自然で親しみやすい標準語（敬語なし）
- 質問に応じて適切な長さで回答
- 常にユーザーに寄り添い共感を示す
- 断定的で具体的な表現を使用
- あらゆる話題で健康的な視点を提供
- プレーンテキストで返答（マークダウン不使用）${conversationHistory}

ユーザー: ${userMessage}
返答:`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      
      // 最小限のクリーニング
      let cleanText = response.text().trim();
      
      return cleanText;
    } catch (error) {
      console.error('高性能会話AI エラー:', error);
      return 'すみません、現在詳細なアドバイスができません。少し時間をおいてもう一度お試しください。';
    }
  }

  // テキストが運動記録の意図かどうかを判定
  async analyzeExerciseRecordIntent(text: string) {
    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
      
      const prompt = `
「${text}」が運動記録かどうか判定し、以下のJSON形式で返してください：

単一運動: {
  "isExerciseRecord": boolean,
  "isMultipleExercises": false,
  "exerciseType": string,
  "exerciseName": string,
  "displayName": string,
  "duration": number,
  "sets": number,
  "reps": number,
  "weight": number,
  "distance": number,
  "confidence": number
}

複数運動: {"isExerciseRecord": true, "isMultipleExercises": true, "exercises": [...]}

運動タイプ: strength(筋トレ), cardio(有酸素), sports(スポーツ), water(水泳), martial_arts(格闘技), dance(ダンス), winter(ウィンター), flexibility(ストレッチ), daily(日常活動)

判定条件: 運動名 + 過去形動詞（した、やった、行った等）
`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const jsonText = response.text().replace(/```json|```/g, '').trim();
      
      return JSON.parse(jsonText);
    } catch (error) {
      console.error('運動記録意図分析エラー:', error);
      // フォールバック: 基本的な運動関連キーワードをチェック（短縮名・カタカナ表記対応）
      const exerciseKeywords = /野球|サッカー|テニス|バスケ|バレー|ランニング|ジョギング|ウォーキング|散歩|筋トレ|ジム|ヨガ|ピラティス|ストレッチ|腹筋|腕立て|背筋|スクワット|ベンチプレス|ベンチ|デッド|デッドリフト|泳|水泳|サイクリング|自転車|踊|ダンス|階段|掃除|キロ|セット|した|やった|行った|練習|鍛え|走っ|歩い|泳い|踊っ/;
      const hasExerciseKeyword = exerciseKeywords.test(text);
      const hasPastTense = /した|やった|行った|練習した|鍛えた|走った|歩いた|泳いだ|踊った/.test(text);
      
      if (hasExerciseKeyword && hasPastTense) {
        // 簡単な運動タイプ判定
        let exerciseType = "daily";
        let exerciseName = "運動";
        
        if (/野球|サッカー|テニス|バスケ|バレー/.test(text)) {
          exerciseType = "sports";
          exerciseName = text.match(/野球|サッカー|テニス|バスケ|バレー/)?.[0] || "スポーツ";
        } else if (/ランニング|ジョギング|ウォーキング|散歩|走っ|歩い/.test(text)) {
          exerciseType = "cardio";
          exerciseName = "ランニング";
        } else if (/筋トレ|ジム|腹筋|腕立て|背筋|スクワット|ベンチプレス|ベンチ|デッド|デッドリフト|鍛え/.test(text)) {
          exerciseType = "strength";
          // 短縮名を正式名称に変換
          if (/腕立て/.test(text)) {
            exerciseName = "腕立て伏せ";
          } else if (/腹筋/.test(text)) {
            exerciseName = "腹筋運動";
          } else if (/背筋/.test(text)) {
            exerciseName = "背筋運動";
          } else if (/ベンチ/.test(text)) {
            exerciseName = "ベンチプレス";
          } else if (/デッド/.test(text)) {
            exerciseName = "デッドリフト";
          } else {
            exerciseName = "筋トレ";
          }
        } else if (/ヨガ|ピラティス|ストレッチ/.test(text)) {
          exerciseType = "flexibility";
          exerciseName = text.match(/ヨガ|ピラティス|ストレッチ/)?.[0] || "ストレッチ";
        }
        
        return {
          isExerciseRecord: true,
          isMultipleExercises: false,
          exerciseType,
          exerciseName,
          duration: 0, // デフォルト値は設定しない
          intensity: null, // デフォルト値は設定しない
          hasSpecificDetails: false,
          sets: 0,
          reps: 0,
          weight: 0,
          distance: 0,
          confidence: 0.7
        };
      }
      
      return {
        isExerciseRecord: false,
        isMultipleExercises: false,
        exerciseType: null,
        exerciseName: null,
        duration: 0,
        intensity: null,
        hasSpecificDetails: false,
        sets: 0,
        reps: 0,
        weight: 0,
        distance: 0,
        confidence: 0.5
      };
    }
  }

  // 一般会話機能（エラー時フォールバック用）
  async generateGeneralResponse(userMessage: string, userId?: string, characterSettings?: any): Promise<string> {
    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
      
      // キャラクターのペルソナと言語を取得
      console.log('🎭 AIサービス - 受信キャラクター設定:', characterSettings);
      const persona = getCharacterPersona(characterSettings);
      console.log('🎭 AIサービス - 使用ペルソナ:', { 
        name: persona.name, 
        personality: persona.personality.substring(0, 50) + '...',
        tone: persona.tone.substring(0, 30) + '...'
      });
      
      // 会話履歴を取得
      const history = userId ? await this.getConversationHistory(userId) : [];
      const conversationHistory = this.formatConversationHistory(history);
      
      const prompt = `
あなたは「${persona.name}」として振る舞ってください。

## キャラクター設定
- 性格: ${persona.personality}
- 口調: ${persona.tone}
- 専門分野: 健康・栄養・運動

## 重要なルール
- キャラクター名で始めない
- ユーザーの質問をオウム返ししない
- 直接答えから始める
- ${persona.name}の口調を維持
- あらゆる話題に柔軟に対応
- プレーンテキストで返答（マークダウン不使用）${conversationHistory}

ユーザー: ${userMessage}
返答:`;


      const result = await model.generateContent(prompt);
      const response = await result.response;
      
      // 最小限のクリーニング
      let cleanText = response.text().trim();
      
      return cleanText;
    } catch (error) {
      console.error('一般会話AI エラー:', error);
      return 'お話ありがとうございます！何か健康管理でお手伝いできることがあれば、お気軽にお声がけください！';
    }
  }

  // 会話履歴を保存
  async saveConversation(userId: string, userMessage: string, aiResponse: string) {
    try {
      const db = admin.firestore();
      await db
        .collection('users')
        .doc(userId)
        .collection('conversations')
        .add({
          userMessage,
          aiResponse,
          timestamp: admin.FieldValue.serverTimestamp(),
        });

      // 古い会話を削除（直近10件だけ保持）
      await this.cleanupOldConversations(userId);
    } catch (error) {
      console.error('会話履歴保存エラー:', error);
      // エラーが発生しても会話は続行
    }
  }

  // 会話履歴を取得
  async getConversationHistory(userId: string): Promise<Array<{userMessage: string, aiResponse: string}>> {
    try {
      const db = admin.firestore();
      const querySnapshot = await db
        .collection('users')
        .doc(userId)
        .collection('conversations')
        .orderBy('timestamp', 'desc')
        .limit(8) // 直近8回分取得
        .get();
      
      const conversations: Array<{userMessage: string, aiResponse: string}> = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        conversations.push({
          userMessage: data.userMessage,
          aiResponse: data.aiResponse
        });
      });
      
      // 時系列順に並び替え（古い順）
      return conversations.reverse();
    } catch (error) {
      console.error('会話履歴取得エラー:', error);
      return [];
    }
  }

  // 古い会話を削除
  private async cleanupOldConversations(userId: string) {
    try {
      const db = admin.firestore();
      const querySnapshot = await db
        .collection('users')
        .doc(userId)
        .collection('conversations')
        .orderBy('timestamp', 'desc')
        .get();
      
      const docs = querySnapshot.docs;
      
      // 10件以上ある場合、古いものを削除
      if (docs.length > 10) {
        const docsToDelete = docs.slice(10); // 11番目以降を削除対象
        for (const docToDelete of docsToDelete) {
          await docToDelete.ref.delete();
        }
      }
    } catch (error) {
      console.error('古い会話削除エラー:', error);
    }
  }

  // 食事記録完了時の管理栄養士レベルパーソナルアドバイス生成
  async generateMealAdvice(
    mealAnalysis: any,
    mealType: string,
    userId: string,
    userProfile?: any,
    dailyProgress?: any,
    characterSettings?: any
  ) {
    try {
      console.log('🧠 パーソナル食事アドバイス生成開始:', { userId, mealType });
      
      const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
      
      // キャラクター設定とデータの準備
      const persona = getCharacterPersona(characterSettings);
      
      const mealTimeJa = {
        'breakfast': '朝食',
        'lunch': '昼食', 
        'dinner': '夕食',
        'snack': '間食'
      }[mealType] || '食事';
      
      const mealInfo = mealAnalysis.isMultipleMeals ? 
        `複数食事: ${mealAnalysis.meals.map((meal: any) => `${meal.displayName}(${meal.calories}kcal)`).join('、')}` :
        `単一食事: ${mealAnalysis.displayName || mealAnalysis.foodItems?.[0] || '不明'}(${mealAnalysis.calories || 0}kcal)`;

      const prompt = `
あなたは「${persona.name}」として、この${mealTimeJa}の栄養アドバイスを提供してください。

## キャラクター設定
- 性格: ${persona.personality}
- 口調: ${persona.tone}

## 記録された食事
- ${mealInfo}
- カロリー: ${mealAnalysis.calories || mealAnalysis.totalCalories || 0}kcal
- タンパク質: ${mealAnalysis.protein || mealAnalysis.totalProtein || 0}g
- 脂質: ${mealAnalysis.fat || mealAnalysis.totalFat || 0}g
- 炭水化物: ${mealAnalysis.carbs || mealAnalysis.totalCarbs || 0}g

## アドバイス要件
- 栄養バランスの評価
- 食材の栄養価について
- 改善提案があれば簡潔に
- ${persona.name}の口調を維持
- 1段落、3-5行程度で回答
- プレーンテキストで返答

健康的な食事は積極的に褒め、問題がある場合のみ具体的な改善案を提示してください。
      `;
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      let adviceText = response.text().trim();
      
      // 複数行や箇条書きを1つの段落にまとめる
      adviceText = adviceText
        .replace(/\n+/g, ' ')  // 改行を削除
        .replace(/[・•\-\*]\s*/g, '')  // 箇条書き記号を削除
        .replace(/\s+/g, ' ')  // 複数スペースを1つに
        .trim();
      
      // 長すぎる場合は適切な長さに調整（約200文字程度）
      if (adviceText.length > 200) {
        const sentences = adviceText.split(/[。！？]/);
        let truncated = '';
        for (const sentence of sentences) {
          if ((truncated + sentence + '。').length > 200) break;
          truncated += sentence + '。';
        }
        adviceText = truncated || adviceText.substring(0, 200) + '...';
      }
      
      const finalAdvice = adviceText;
      
      console.log('✅ パーソナル食事アドバイス生成完了:', finalAdvice);
      
      return finalAdvice;
      
    } catch (error) {
      console.error('❌ パーソナル食事アドバイス生成エラー:', error);
      
      // フォールバック: 食事内容特化型アドバイス
      const calories = mealAnalysis.calories || mealAnalysis.totalCalories || 0;
      const protein = mealAnalysis.protein || mealAnalysis.totalProtein || 0;
      const carbs = mealAnalysis.carbs || mealAnalysis.totalCarbs || 0;
      
      let fallbackAdvice = '';
      
      // 食事タイプと栄養内容に基づいたフォールバック
      if (mealType === 'breakfast') {
        fallbackAdvice = carbs > 30 ? 
          '朝の炭水化物は脳のエネルギー源として完璧！今日1日のパフォーマンスが上がるね。' :
          '朝食はもう少し炭水化物が欲しいかも。脳のエネルギー源としてご飯やパンを追加してみよう。';
      } else if (mealType === 'dinner') {
        fallbackAdvice = calories > 600 ? 
          '夜にこの量は消化に時間がかかるかも。野菜中心の軽めの食事にすると睡眠の質が上がるよ。' :
          '夜は適量で消化に優しい食事だね。タンパク質もしっかり摂れていて、筋肉の回復にも良いよ。';
      } else {
        fallbackAdvice = protein > 15 ? 
          'タンパク質がしっかり摂れていて良い感じ！筋肉の維持・合成に必要な量だね。' :
          'タンパク質がもう少し欲しいかも。卵、豆腐、魚、肉類などを追加するとバランスが良くなるよ。';
      }
      
      return fallbackAdvice;
    }
  }

}

export default AIHealthService;