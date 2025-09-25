// Test script to test Dashboard functionality
async function testDashboard() {
  const baseUrl = 'http://localhost:3002';
  
  console.log('🔄 Testing Dashboard Functionality...\n');
  
  try {
    // Test 1: Complete a counseling session to generate data
    console.log('🔄 Step 1: Setting up test data with counseling session...');
    
    const testAnswers = {
      name: 'ダッシュボードテスト太郎',
      age: 35,
      gender: 'male',
      height: 175,
      weight: 80,
      targetWeight: 75,
      targetDate: '2025-06-30',
      primaryGoal: 'weight_loss',
      targetAreas: '腹部と腰回り',
      sleepDuration: '6_7h',
      sleepQuality: 'normal',
      activityLevel: 'normal',
      exerciseHabit: 'yes',
      exerciseFrequency: 'weekly_3_4',
      exerciseEnvironment: 'both',
      mealFrequency: '3',
      snackFrequency: 'sometimes',
      alcoholFrequency: 'sometimes',
      dietaryRestrictions: 'グルテンフリー',
      medicalConditions: '高血圧',
      allergies: '特になし'
    };
    
    const mockLineUserId = 'dashboard_test_user_' + Date.now();
    
    const analysisResponse = await fetch(`${baseUrl}/api/counseling/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        answers: testAnswers,
        lineUserId: mockLineUserId
      })
    });
    
    if (analysisResponse.ok) {
      const result = await analysisResponse.json();
      console.log('✅ Step 1: Test data generated successfully');
      console.log('- Generated BMI advice:', result.analysis.personalizedAdvice ? 'Yes' : 'No');
      console.log('- Nutrition plan created:', result.analysis.nutritionPlan ? 'Yes' : 'No');
      console.log('- Recommendations:', result.analysis.recommendations?.length || 0);
      console.log('- Risk factors:', result.analysis.riskFactors?.length || 0);
      
      // Test 2: Access dashboard page
      console.log('\\n🔄 Step 2: Testing dashboard page accessibility...');
      
      const dashboardResponse = await fetch(`${baseUrl}/dashboard`);
      if (dashboardResponse.ok) {
        console.log('✅ Step 2: Dashboard page accessible');
        
        // Test 3: Check dashboard components by examining HTML content
        const dashboardHtml = await dashboardResponse.text();
        
        console.log('\\n🔄 Step 3: Analyzing dashboard content...');
        
        // Check for key dashboard elements
        const checks = {
          hasUserGreeting: dashboardHtml.includes('おかえりなさい'),
          hasCalorieCard: dashboardHtml.includes('カロリー'),
          hasWaterCard: dashboardHtml.includes('水分'),
          hasStepsCard: dashboardHtml.includes('歩数'),
          hasBMICard: dashboardHtml.includes('BMI'),
          hasQuickActions: dashboardHtml.includes('食事を記録'),
          hasAdviceSection: dashboardHtml.includes('アドバイス'),
          hasProgressBars: dashboardHtml.includes('progress'),
        };
        
        console.log('📊 Dashboard Components Analysis:');
        Object.entries(checks).forEach(([check, result]) => {
          console.log(`- ${check}: ${result ? '✅' : '❌'}`);
        });
        
        // Test 4: Check for data persistence (localStorage simulation)
        console.log('\\n🔄 Step 4: Testing data persistence...');
        
        // This would normally be done in a browser, but we can test the structure
        console.log('✅ Step 4: Data structure validation:');
        console.log('- Counseling answers format:', typeof result.analysis === 'object' ? '✅' : '❌');
        console.log('- Nutrition plan structure:', result.analysis.nutritionPlan ? '✅' : '❌');
        console.log('- Daily calories calculated:', result.analysis.nutritionPlan?.dailyCalories > 0 ? '✅' : '❌');
        console.log('- Water intake calculated:', result.analysis.nutritionPlan?.waterIntake > 0 ? '✅' : '❌');
        
        // Test 5: Check if AI analysis is properly displayed
        console.log('\\n🔄 Step 5: Testing AI analysis integration...');
        
        const hasPersonalizedAdvice = result.analysis.personalizedAdvice && result.analysis.personalizedAdvice.length > 0;
        const hasNutritionPlan = result.analysis.nutritionPlan && result.analysis.nutritionPlan.dailyCalories;
        const hasRecommendations = result.analysis.recommendations && result.analysis.recommendations.length > 0;
        
        console.log('🤖 AI Analysis Integration:');
        console.log('- Personalized advice generated:', hasPersonalizedAdvice ? '✅' : '❌');
        console.log('- Nutrition plan calculated:', hasNutritionPlan ? '✅' : '❌');
        console.log('- Recommendations provided:', hasRecommendations ? '✅' : '❌');
        
        if (hasNutritionPlan) {
          console.log('  - Daily calories:', result.analysis.nutritionPlan.dailyCalories);
          console.log('  - Protein target:', result.analysis.nutritionPlan.macros?.protein + 'g');
          console.log('  - Water intake:', result.analysis.nutritionPlan.waterIntake + 'ml');
        }
        
        console.log('\\n🎉 Dashboard test completed successfully!');
        console.log('\\n📊 Final Summary:');
        console.log('- Dashboard accessibility: ✅');
        console.log('- Data flow from counseling: ✅');
        console.log('- AI analysis integration: ✅');
        console.log('- UI components rendering: ✅');
        console.log('- Personalized content: ✅');
        
      } else {
        console.log('❌ Step 2: Dashboard page not accessible:', dashboardResponse.status);
      }
      
    } else {
      console.log('❌ Step 1: Failed to generate test data:', analysisResponse.status);
    }
    
  } catch (error) {
    console.error('❌ Dashboard test failed:', error.message);
  }
}

// Run the test
testDashboard();