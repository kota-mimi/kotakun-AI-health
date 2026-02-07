async function testFixUsers() {
  try {
    console.log('🔧 影響を受けたユーザーの確認開始...');
    
    const response = await fetch('http://localhost:3000/api/fix-affected-users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    console.log('Response status:', response.status);
    const responseText = await response.text();
    console.log('Response text:', responseText);
    
    if (response.ok) {
      const result = JSON.parse(responseText);
      console.log('✅ 確認完了:');
      console.log('  - 総アクティブユーザー:', result.totalActiveUsers);
      console.log('  - 影響を受けたユーザー:', result.affectedUsers);
      console.log('  - メッセージ:', result.message);
      
      if (result.affectedUserDetails && result.affectedUserDetails.length > 0) {
        console.log('\n影響ユーザー詳細:');
        result.affectedUserDetails.forEach((user, index) => {
          console.log(`  ${index + 1}. ${user.userId}`);
          console.log(`     現在のプラン: ${user.currentPlan}`);
          console.log(`     ステータス: ${user.subscriptionStatus}`);
          console.log(`     サブスク ID: ${user.stripeSubscriptionId}`);
        });
      }
    } else {
      console.error('❌ エラー:', responseText);
    }
    
  } catch (error) {
    console.error('❌ リクエストエラー:', error);
  }
}

testFixUsers();