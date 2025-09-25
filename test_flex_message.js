// Test Flex message delivery after counseling completion
async function testFlexMessageDelivery() {
  const baseUrl = 'https://246cc11245de.ngrok-free.app';
  
  console.log('🔄 Testing Flex Message Delivery After Counseling...\\n');
  
  const testAnswers = {
    name: 'テスト太郎',
    age: 25,
    gender: 'male',
    height: 175,
    weight: 70,
    targetWeight: 65,
    targetDate: '2025-12-31',
    primaryGoal: 'weight_loss',
    targetAreas: '下腹部とお腹周り',
    sleepDuration: '6_7h',
    sleepQuality: 'normal',
    activityLevel: 'slightly_low',
    exerciseHabit: 'yes',
    exerciseFrequency: 'weekly_1_2',
    exerciseEnvironment: 'gym',
    mealFrequency: '3',
    snackFrequency: 'sometimes',
    alcoholFrequency: 'sometimes',
    dietaryRestrictions: '特になし',
    medicalConditions: '特になし',
    allergies: '特になし'
  };
  
  // 実際のLINE User IDを使用（テスト用）
  const testLineUserId = 'U123456789abcdefghijklmnopqrstuv';
  
  try {
    console.log('🔄 Step 1: Sending counseling data for AI analysis...');
    console.log('User Profile:', {
      name: testAnswers.name,
      age: testAnswers.age,
      gender: testAnswers.gender,
      goal: testAnswers.primaryGoal,
      weight: `${testAnswers.weight}kg → ${testAnswers.targetWeight}kg`
    });
    
    const response = await fetch(`${baseUrl}/api/counseling/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        answers: testAnswers,
        lineUserId: testLineUserId
      })
    });
    
    console.log('Response status:', response.status);
    
    if (response.ok) {
      const result = await response.json();
      console.log('\\n✅ AI Analysis API successful!');
      console.log('📊 Analysis Results:');
      console.log('- Success:', result.success);
      console.log('- Daily Calories:', result.analysis?.nutritionPlan?.dailyCalories);
      console.log('- Protein:', result.analysis?.nutritionPlan?.macros?.protein + 'g');
      console.log('- Fat:', result.analysis?.nutritionPlan?.macros?.fat + 'g');
      console.log('- Carbs:', result.analysis?.nutritionPlan?.macros?.carbs + 'g');
      console.log('- Has Personalized Advice:', result.analysis?.personalizedAdvice ? '✅' : '❌');
      
      if (result.analysis?.personalizedAdvice) {
        console.log('\\n📋 AI Advice Preview:');
        console.log('- Positive Points:', result.analysis.personalizedAdvice.positivePoints ? '✅' : '❌');
        console.log('- Improvements:', result.analysis.personalizedAdvice.improvements ? '✅' : '❌');
        console.log('- Advice:', result.analysis.personalizedAdvice.advice ? '✅' : '❌');
      }
      
      console.log('\\n🚀 Expected LINE Message Flow:');
      console.log('1. 完了通知メッセージ (即座)');
      console.log('2. Flexメッセージ (2秒後) - カウンセリング結果の詳細UI');
      console.log('3. 次のステップ案内 (4秒後) - カルーセルメニュー');
      
      console.log('\\n⏳ Waiting for LINE message delivery...');
      console.log('Check your LINE app for the messages!');
      
      // 6秒待機してからステータスを表示
      setTimeout(() => {
        console.log('\\n✅ All messages should have been sent to LINE now.');
        console.log('\\n📱 Expected messages in LINE:');
        console.log('1. 🎉 テスト太郎さん、カウンセリング分析が完了しました！');
        console.log('2. [Flex Message] カウンセリング結果 - 詳細なUI表示');
        console.log('   - あなたの目標: 体重を落としたい');
        console.log('   - あなたの情報: 名前、年齢、性別、身長');
        console.log('   - 体重: 現在70kg → 目標65kg (目標まで-5kg)');
        console.log('   - 毎日の目標栄養素: カロリー、タンパク質、脂質、炭水化物');
        console.log('   - カウンセリング結果: ポジティブポイント、改善ポイント、アドバイス');
        console.log('   - [マイページを見る] ボタン');
        console.log('3. [Carousel] 健康管理を始めましょう！ - 食事記録、運動記録、進捗確認');
        
        console.log('\\n🔧 Troubleshooting:');
        console.log('- メッセージが届かない場合: LINE Developer Console の Webhook URL を確認');
        console.log('- Flexメッセージが表示されない場合: JSON構造をLINE Flex Message Simulatorで確認');
        console.log('- ボタンが動作しない場合: ngrok URL が最新か確認');
      }, 6000);
      
    } else {
      const errorText = await response.text();
      console.log('❌ AI Analysis API failed');
      console.log('Status:', response.status);
      console.log('Error response:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testFlexMessageDelivery();