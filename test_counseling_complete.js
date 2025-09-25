// Test to verify counseling completion and AI analysis
async function testCounselingCompletion() {
  const baseUrl = 'https://bfb18f5e53c5.ngrok-free.app';
  
  console.log('🔄 Testing Counseling Completion...\n');
  
  const testAnswers = {
    name: 'テスト花子',
    age: 28,
    gender: 'female',
    height: 160,
    weight: 55,
    targetWeight: 50,
    targetDate: '2025-12-31',
    primaryGoal: 'weight_loss',
    targetAreas: '下腹部',
    sleepDuration: '6_7h',
    sleepQuality: 'normal',
    activityLevel: 'slightly_low',
    exerciseHabit: 'no',
    exerciseFrequency: 'none',
    exerciseEnvironment: 'home',
    mealFrequency: '3',
    snackFrequency: 'sometimes',
    alcoholFrequency: 'sometimes',
    dietaryRestrictions: '特になし',
    medicalConditions: '特になし',
    allergies: '特になし'
  };
  
  const mockLineUserId = 'test_user_' + Date.now();
  
  try {
    console.log('🔄 Step 1: Testing AI analysis API...');
    
    const response = await fetch(`${baseUrl}/api/counseling/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        answers: testAnswers,
        lineUserId: mockLineUserId
      })
    });
    
    console.log('Response status:', response.status);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ AI Analysis API successful!');
      console.log('📋 Analysis result:');
      console.log('- Success:', result.success);
      console.log('- Personalized advice:', result.analysis?.personalizedAdvice ? 'Generated' : 'Missing');
      console.log('- Nutrition plan:', result.analysis?.nutritionPlan ? 'Created' : 'Missing');
      console.log('- Daily calories:', result.analysis?.nutritionPlan?.dailyCalories);
      console.log('- Recommendations:', result.analysis?.recommendations?.length || 0);
      
      // Test dashboard after analysis
      console.log('\\n🔄 Step 2: Testing dashboard with analysis data...');
      const dashboardResponse = await fetch(`${baseUrl}/dashboard`);
      
      if (dashboardResponse.ok) {
        const dashboardHtml = await dashboardResponse.text();
        const hasUserData = dashboardHtml.includes('おかえりなさい');
        const hasLoadingState = dashboardHtml.includes('データを読み込み中');
        
        console.log('📊 Dashboard Status:');
        console.log('- Has user greeting:', hasUserData ? '✅' : '❌');
        console.log('- Still loading:', hasLoadingState ? '⚠️' : '✅');
        
        if (hasLoadingState) {
          console.log('\\n💡 Dashboard is showing loading state. This means:');
          console.log('1. localStorage might not have counseling data');
          console.log('2. The data flow from counseling completion to localStorage may be broken');
          console.log('3. Check browser console for JavaScript errors');
        }
      }
      
    } else {
      const errorText = await response.text();
      console.log('❌ AI Analysis API failed');
      console.log('Error response:', errorText);
    }
    
    console.log('\\n🔧 Debugging suggestions:');
    console.log('1. Check browser console for JavaScript errors during counseling submission');
    console.log('2. Verify localStorage has "counselingAnswers" and "aiAnalysis" keys');
    console.log('3. Try completing counseling again with browser dev tools open');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testCounselingCompletion();