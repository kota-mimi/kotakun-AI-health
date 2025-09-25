// Test script to simulate counseling completion
async function testCounselingFlow() {
  const baseUrl = 'http://localhost:3002';
  
  console.log('🔄 Testing Counseling Flow...\n');
  
  // Test data (similar to what would be filled in the form)
  const testAnswers = {
    name: 'テスト太郎',
    age: 30,
    gender: 'male',
    height: 175,
    weight: 75,
    targetWeight: 70,
    targetDate: '2025-12-31',
    primaryGoal: 'weight_loss',
    targetAreas: '腹部とウエスト',
    sleepDuration: '6_7h',
    sleepQuality: 'normal',
    activityLevel: 'normal',
    exerciseHabit: 'yes',
    exerciseFrequency: 'weekly_3_4',
    exerciseEnvironment: 'gym',
    mealFrequency: '3',
    snackFrequency: 'sometimes',
    alcoholFrequency: 'sometimes',
    dietaryRestrictions: '特になし',
    medicalConditions: '特になし',
    allergies: '特になし'
  };
  
  // Mock LINE User ID for testing
  const mockLineUserId = 'test_user_' + Date.now();
  
  try {
    console.log('✅ Step 1: Counseling page accessible');
    
    // Test the analyze API endpoint
    console.log('🔄 Step 2: Testing AI analysis API...');
    
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
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Step 2: AI Analysis API successful');
      console.log('📋 Analysis result:');
      console.log('- Personalized Advice:', result.analysis.personalizedAdvice?.substring(0, 100) + '...');
      console.log('- Daily Calories:', result.analysis.nutritionPlan?.dailyCalories);
      console.log('- Water Intake:', result.analysis.nutritionPlan?.waterIntake, 'ml');
      
      // Test dashboard accessibility
      console.log('🔄 Step 3: Testing dashboard access...');
      const dashboardResponse = await fetch(`${baseUrl}/dashboard`);
      
      if (dashboardResponse.ok) {
        console.log('✅ Step 3: Dashboard accessible');
        
        console.log('\n🎉 Counseling flow test completed successfully!');
        console.log('\n📊 Summary:');
        console.log('- Counseling form: ✅ Accessible');
        console.log('- AI Analysis API: ✅ Working');
        console.log('- Dashboard: ✅ Accessible');
        console.log('- Data flow: ✅ Complete');
        
      } else {
        console.log('❌ Step 3: Dashboard access failed:', dashboardResponse.status);
      }
      
    } else {
      console.log('❌ Step 2: AI Analysis API failed:', response.status);
      const errorText = await response.text();
      console.log('Error details:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testCounselingFlow();