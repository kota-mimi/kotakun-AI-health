// カウンセリング状況の詳細確認
const checkCounseling = async () => {
  try {
    const userId = 'U7fd12476d6263912e0d9c99fc3a6bef9';
    
    console.log('🔍 カウンセリング状況を確認中...');
    
    // 1. プラン状況確認
    console.log('\n=== プラン状況 ===');
    const planResponse = await fetch(`http://localhost:3000/api/plan/current?userId=${userId}`);
    const planData = await planResponse.json();
    console.log('📊 プランデータ:', planData);
    
    // 2. テスト用に食事記録を試行
    console.log('\n=== 食事記録テスト ===');
    const mealTestMessage = {
      "events": [
        {
          "type": "message",
          "replyToken": "test-reply-token-meal",
          "source": {
            "userId": userId,
            "type": "user"
          },
          "message": {
            "type": "text",
            "text": "朝食を記録"
          }
        }
      ]
    };
    
    // 署名検証をスキップするため、テスト環境での処理確認
    console.log('テストメッセージ:', JSON.stringify(mealTestMessage, null, 2));
    
    // カウンセリング完了状況を間接的に確認
    console.log('\n=== 推測される状況 ===');
    if (planData.plan === 'free' && planData.status === 'inactive') {
      console.log('❌ カウンセリング未完了または初期状態');
      console.log('💡 食事記録には事前にカウンセリング完了が必要');
      console.log('🎯 カウンセリングを完了してからもう一度お試しください');
    } else {
      console.log('✅ カウンセリング完了状態');
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
};

checkCounseling();