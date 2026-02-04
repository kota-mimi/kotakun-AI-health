// 現在のユーザーのcurrentPlanを正しく設定

async function fixCurrentUserPlan() {
  const userId = 'U7fd12476d6263912e0d9c99fc3a6bef9';
  
  try {
    console.log('🔧 現在のユーザープランを修正中...', userId);
    
    // 半年プランで決済したと仮定して修正
    const response = await fetch('https://healthy-kun.com/api/admin/fix-user-plan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        userId: userId,
        currentPlan: '半年プラン'
      })
    });
    
    const result = await response.json();
    console.log('結果:', result);
    
    if (result.success) {
      console.log('✅ プラン修正完了');
    } else {
      console.log('❌ 修正失敗:', result.error);
    }
    
  } catch (error) {
    console.error('❌ 修正エラー:', error);
  }
}

fixCurrentUserPlan();