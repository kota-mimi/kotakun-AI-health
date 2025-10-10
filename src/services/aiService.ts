import { GoogleGenerativeAI } from '@google/generative-ai';
import { calculateBMI, calculateTDEE, calculateCalorieTarget, calculateMacroTargets } from '@/utils/calculations';
import type { UserProfile, CounselingAnswer } from '@/types';

class AIHealthService {
  private genAI: GoogleGenerativeAI;

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
          const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash-preview-05-20' });
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
  "hasBodyFat": boolean,
  "bodyFat": number,
  "confidence": number
}

判定基準：
- 数値＋体重単位：「65kg」「64.5キロ」「63.2」
- 体重記録の表現：「体重65kg」「今日の体重は64キロ」「体重記録 65.5」
- 体脂肪率：「体脂肪15%」「体脂肪率20.5%」
- 複合記録：「体重65kg 体脂肪18%」
- 質問・相談は除外：「体重どうやって減らす？」「何キロがいい？」

例：
- 「65kg」→ isWeightRecord: true, weight: 65
- 「体重64.5キロ」→ isWeightRecord: true, weight: 64.5
- 「今日の体重は63kg 体脂肪17%」→ isWeightRecord: true, weight: 63, hasBodyFat: true, bodyFat: 17
- 「体重どうやって減らす？」→ isWeightRecord: false
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
      const hasBodyFatKeyword = /体脂肪|体脂肪率|%/.test(text);
      
      if (weightMatch && hasWeightKeyword) {
        const weight = parseFloat(weightMatch[1]);
        const bodyFatMatch = text.match(/(\d+(?:\.\d+)?)%/);
        
        return {
          isWeightRecord: true,
          weight: weight,
          hasBodyFat: hasBodyFatKeyword && bodyFatMatch,
          bodyFat: bodyFatMatch ? parseFloat(bodyFatMatch[1]) : null,
          confidence: 0.8
        };
      }
      
      return {
        isWeightRecord: false,
        weight: null,
        hasBodyFat: false,
        bodyFat: null,
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
- 食事時間：「朝」「あさ」「昼」「ひる」「夜」「よる」「朝食」「昼食」「夕食」「間食」「おやつ」
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
  async analyzeMealFromText(mealText: string) {
    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
      
      const prompt = `
食事内容のテキスト「${mealText}」を分析して、以下の形式のJSONで返してください：

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
  "totalFat": 合計脂質（小数点第1位まで）,
  "advice": "この食事に対する栄養士からの簡潔なアドバイス（50文字以内）"
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
  "advice": "この食事に対する栄養士からの簡潔なアドバイス（50文字以内）"
}

注意：
- 「と」「、」「＋」「&」などで複数の食事が結ばれている場合は複数食事として扱う
- カロリーは整数、PFC（タンパク質・脂質・炭水化物）は小数点第1位まで正確に計算
- 単位は含めない（例：カロリー350、タンパク質23.4）
- 食品名・料理名は日本語で
- **重要: 分量が指定されている場合は必ずその分量で正確に計算する**
- **displayNameにはユーザーが入力した文字をそのまま記録（勝手に分量を追加しない）**
- **nameには基本的な食品名のみ（「(3個)」「(1人前)」などの分量表記は追加しない）**
- baseFoodは基本的な食品名、portionは分量部分を分離
- アドバイスは栄養バランスや改善点を含める

分量指定の例：
- 「ご飯100g」→ displayName: "ご飯100g", baseFood: "ご飯", portion: "100g"
- 「餃子5個」→ displayName: "餃子5個", baseFood: "餃子", portion: "5個"
- 「食パン2枚」→ displayName: "食パン2枚", baseFood: "食パン", portion: "2枚"
`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const jsonText = response.text().replace(/```json|```/g, '').trim();
      
      return JSON.parse(jsonText);
    } catch (error) {
      console.error('食事テキスト分析エラー:', error);
      // フォールバック値を返す
      return {
        foodItems: [mealText],
        displayName: mealText,
        baseFood: mealText,
        portion: "",
        calories: 400,
        protein: 20.0,
        carbs: 50.0,
        fat: 15.0,
        advice: "バランスの良い食事を心がけましょう"
      };
    }
  }

  // 画像から食事内容を分析
  async analyzeMealFromImage(imageBuffer: Buffer) {
    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
      
      const prompt = `
この画像を分析してください。まず、この画像が食事・料理・食べ物の写真かどうかを判定してください。

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
  "totalFat": 合計脂質（小数点第1位まで）,
  "advice": "この食事に対する栄養士からの簡潔なアドバイス（50文字以内）"
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
  "advice": "この食事に対する栄養士からの簡潔なアドバイス（50文字以内）"
}

注意：
- 複数の料理が明確に分かれて写っている場合は複数食事として扱う
- 料理名は具体的に（例：「ラーメン」「チャーハン」「唐揚げ」）
- 詳細な食材名ではなく、料理の名前で答える
- カロリーは整数、PFC（タンパク質・脂質・炭水化物）は小数点第1位まで正確に計算
- 単位は含めない（例：カロリー350、タンパク質23.4）
- 推定は一般的な分量で計算

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
      
      return JSON.parse(jsonText);
    } catch (error) {
      console.error('食事画像分析エラー:', error);
      // フォールバック値を返す
      return {
        foodItems: ['食事'],
        calories: 400,
        protein: 20.0,
        carbs: 50.0,
        fat: 15.0,
        advice: "バランスの良い食事を心がけましょう"
      };
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

  // 高性能な会話レスポンスを生成（AIアドバイスモード用）
  async generateAdvancedResponse(userMessage: string): Promise<string> {
    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash-preview-05-20' });
      
      const prompt = `
あなたは「こたくん」という健康管理の優しい先生です。
ユーザーの「${userMessage}」に対して、優しく親しみやすく答えてください。

専門知識：
- 栄養学：カロリー、PFC、ビタミン・ミネラル、食品栄養価
- 運動：筋トレ、有酸素運動、ストレッチ、消費カロリー
- ダイエット：基礎代謝、体重管理、食事制限、運動療法
- 健康管理：睡眠、ストレス、生活習慣病予防、メンタルヘルス

話し方：
- 敬語なし、親しみやすく優しい口調
- 50-80文字程度で適度な長さ
- 健康知識を活かした的確なアドバイス
- 励ましや気遣いを含める

例：
- 「ラーメンのカロリー教えて」→「ラーメンは約500-800kcalだよ。スープを残すと200kcal減らせるよ！」
- 「疲れた」→「お疲れ様！しっかり睡眠とって、ビタミンB群を摂ると疲労回復に効果的だよ」
- 「ダイエットしたい」→「基礎代謝を上げる筋トレと、カロリー収支を意識した食事が大切だね！」

返答:`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      
      // マークダウン記号を除去してプレーンテキストに変換
      let cleanText = response.text();
      cleanText = cleanText.replace(/\*\*/g, '');
      cleanText = cleanText.replace(/\*/g, '');
      cleanText = cleanText.replace(/#{1,6}\s*/g, '');
      cleanText = cleanText.replace(/`{1,3}/g, '');
      cleanText = cleanText.replace(/^\s*[-\*\+]\s*/gm, '');
      cleanText = cleanText.replace(/^\s*\d+\.\s*/gm, '');
      cleanText = cleanText.replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1');
      cleanText = cleanText.replace(/\n\s*\n/g, '\n');
      cleanText = cleanText.trim();
      
      return cleanText;
    } catch (error) {
      console.error('高性能会話AI エラー:', error);
      return 'すみません、現在詳細なアドバイスができません。少し時間をおいてもう一度お試しください。';
    }
  }

  // 一般会話機能
  async generateGeneralResponse(userMessage: string): Promise<string> {
    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
      
      const prompt = `
あなたは「こたくん」という健康管理の優しい先生です。
ユーザーの「${userMessage}」に対して、優しく親しみやすく答えてください。

専門知識：
- 栄養学：カロリー、PFC、ビタミン・ミネラル、食品栄養価
- 運動：筋トレ、有酸素運動、ストレッチ、消費カロリー
- ダイエット：基礎代謝、体重管理、食事制限、運動療法
- 健康管理：睡眠、ストレス、生活習慣病予防、メンタルヘルス

話し方：
- 敬語なし、親しみやすく優しい口調
- 50-80文字程度で適度な長さ
- 健康知識を活かした的確なアドバイス
- 励ましや気遣いを含める

例：
- 「ラーメンのカロリー教えて」→「ラーメンは約500-800kcalだよ。スープを残すと200kcal減らせるよ！」
- 「疲れた」→「お疲れ様！しっかり睡眠とって、ビタミンB群を摂ると疲労回復に効果的だよ」
- 「ダイエットしたい」→「基礎代謝を上げる筋トレと、カロリー収支を意識した食事が大切だね！」

返答:`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      
      // マークダウン記号を除去してプレーンテキストに変換
      let cleanText = response.text();
      cleanText = cleanText.replace(/\*\*/g, ''); // **太字**を除去
      cleanText = cleanText.replace(/\*/g, ''); // *斜体*を除去
      cleanText = cleanText.replace(/#{1,6}\s*/g, ''); // # ヘッダーを除去
      cleanText = cleanText.replace(/`{1,3}/g, ''); // ```コード```を除去
      cleanText = cleanText.replace(/^\s*[-\*\+]\s*/gm, ''); // - リストマーカーを除去
      cleanText = cleanText.replace(/^\s*\d+\.\s*/gm, ''); // 1. 番号リストを除去
      cleanText = cleanText.replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1'); // [リンクテキスト](URL)をテキストのみに
      cleanText = cleanText.replace(/\n\s*\n/g, '\n'); // 空行を単一改行に
      cleanText = cleanText.trim();
      
      return cleanText;
    } catch (error) {
      console.error('一般会話AI エラー:', error);
      return 'お話ありがとうございます！何か健康管理でお手伝いできることがあれば、お気軽にお声がけください！';
    }
  }
}

export default AIHealthService;