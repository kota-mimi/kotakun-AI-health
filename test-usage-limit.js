// 利用制限チェックのテスト
const testUsageLimit = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/plan/current?userId=U7fd12476d6263912e0d9c99fc3a6bef9');
    const planData = await response.json();
    
    console.log('📊 プランデータ:', planData);
    
    // 使用量リミットを手動でテスト
    console.log('🔍 使用量制限テスト開始...');
    
    // AI会話制限テスト（4回目で制限にかかるはず）
    for (let i = 1; i <= 4; i++) {
      console.log(`\n--- AI会話テスト ${i}回目 ---`);
      
      const testMessage = {
        "events": [
          {
            "type": "message",
            "replyToken": `test-reply-token-${i}`,
            "source": {
              "userId": "U7fd12476d6263912e0d9c99fc3a6bef9",
              "type": "user"
            },
            "message": {
              "type": "text",
              "text": `テストメッセージ ${i}回目`
            }
          }
        ]
      };
      
      const webhookResponse = await fetch('http://localhost:3000/api/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-line-signature': 'test-signature'
        },
        body: JSON.stringify(testMessage)
      });
      
      console.log(`Response status: ${webhookResponse.status}`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
};

testUsageLimit();