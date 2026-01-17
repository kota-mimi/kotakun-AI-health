// 利用回数チェックのデバッグ
const testUsageCheck = async () => {
  try {
    const userId = 'U7fd12476d6263912e0d9c99fc3a6bef9';
    
    console.log('🔍 利用回数チェックテスト開始...');
    
    // 現在の利用回数を確認するAPIを作成してテスト
    const testCheckLimit = async (type) => {
      const response = await fetch('http://localhost:3000/api/webhook', {
        method: 'POST', 
        headers: {
          'Content-Type': 'application/json',
          'x-line-signature': 'test-signature'
        },
        body: JSON.stringify({
          events: [{
            type: 'message',
            replyToken: 'test-token',
            source: { userId, type: 'user' },
            message: { 
              type: 'text', 
              text: type === 'record' ? '朝食を記録' : 'こんにちは' 
            }
          }]
        })
      });
      
      console.log(`${type} テスト - Status: ${response.status}`);
      return response.status;
    };
    
    // AI会話テスト
    console.log('\n=== AI会話制限テスト ===');
    for (let i = 1; i <= 5; i++) {
      console.log(`${i}回目のAI会話...`);
      const status = await testCheckLimit('ai');
      if (status !== 200) {
        console.log(`❌ ${i}回目で失敗: ${status}`);
        break;
      }
      console.log(`✅ ${i}回目成功`);
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // 記録制限テスト  
    console.log('\n=== 記録制限テスト ===');
    for (let i = 1; i <= 3; i++) {
      console.log(`${i}回目の記録...`);
      const status = await testCheckLimit('record');
      if (status !== 200) {
        console.log(`❌ ${i}回目で失敗: ${status}`);
        break;
      }
      console.log(`✅ ${i}回目成功`);
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
};

testUsageCheck();