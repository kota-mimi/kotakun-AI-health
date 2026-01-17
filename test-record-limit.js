// 記録制限のテスト
const testRecordLimit = async () => {
  try {
    const userId = 'U7fd12476d6263912e0d9c99fc3a6bef9';
    
    console.log('🔍 記録制限テスト開始...');
    console.log('記録制限: 1日1回まで（無料プラン）');
    
    // 現在の使用状況を確認
    console.log('\n=== 使用状況確認 ===');
    const planResponse = await fetch(`http://localhost:3000/api/plan/current?userId=${userId}`);
    const planData = await planResponse.json();
    console.log('📊 プランデータ:', planData);
    
    // 1回目の記録テスト
    console.log('\n=== 1回目の記録テスト ===');
    const firstRecordMessage = {
      "events": [
        {
          "type": "message",
          "replyToken": "test-reply-token-record-1",
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
    
    const firstResponse = await fetch('http://localhost:3000/api/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-line-signature': 'test-signature'
      },
      body: JSON.stringify(firstRecordMessage)
    });
    
    console.log(`1回目 Response status: ${firstResponse.status}`);
    
    // 少し待機
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 2回目の記録テスト（制限にかかるはず）
    console.log('\n=== 2回目の記録テスト（制限予想） ===');
    const secondRecordMessage = {
      "events": [
        {
          "type": "message",
          "replyToken": "test-reply-token-record-2",
          "source": {
            "userId": userId,
            "type": "user"
          },
          "message": {
            "type": "text",
            "text": "昼食を記録"
          }
        }
      ]
    };
    
    const secondResponse = await fetch('http://localhost:3000/api/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-line-signature': 'test-signature'
      },
      body: JSON.stringify(secondRecordMessage)
    });
    
    console.log(`2回目 Response status: ${secondResponse.status}`);
    
    console.log('\n✅ 記録制限テスト完了');
    console.log('期待される結果:');
    console.log('- 1回目: 成功（記録される）');
    console.log('- 2回目: 制限Flexメッセージが送信される');
    
  } catch (error) {
    console.error('Error:', error);
  }
};

testRecordLimit();