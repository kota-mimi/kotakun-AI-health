require('dotenv').config({ path: '.env.local' });
const admin = require('firebase-admin');

// Firebase Admin初期化（firebase-admin.tsの設定と同じ）
if (!admin.apps.length) {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'kotakun';
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  
  if (clientEmail && privateKey && !privateKey.includes('Example')) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey: privateKey.replace(/\\n/g, '\n'),
      }),
      projectId,
    });
    console.log('✅ Firebase Admin初期化完了');
  } else {
    console.log('❌ Firebase認証情報が不足');
    process.exit(1);
  }
}

const TEST_USER_ID = 'U7fd12476d6263912e0d9c99fc3a6bef9';

async function testPlanDisplay() {
  console.log(`🧪 プラン表示テスト開始 - ユーザーID: ${TEST_USER_ID}`);
  
  const testCases = [
    {
      name: '月額プラン（active）- 解約ボタン表示確認',
      data: {
        currentPlan: '月額プラン',
        subscriptionStatus: 'active',
        currentPeriodEnd: new Date('2024-03-15'), // 未来の日付
        stripeSubscriptionId: 'sub_test_active',
        updatedAt: new Date()
      }
    },
    {
      name: '解約済み（cancel_at_period_end）- 期限表示確認', 
      data: {
        currentPlan: '月額プラン',
        subscriptionStatus: 'cancel_at_period_end',
        currentPeriodEnd: new Date('2024-03-15'), // 未来の日付
        stripeSubscriptionId: 'sub_test_cancelled',
        cancelledAt: new Date(),
        updatedAt: new Date()
      }
    },
    {
      name: '完全解約（cancelled）- 無料プラン扱い確認',
      data: {
        currentPlan: '月額プラン',
        subscriptionStatus: 'cancelled',
        currentPeriodEnd: new Date('2024-01-15'), // 過去の日付
        stripeSubscriptionId: 'sub_test_expired',
        cancelledAt: new Date(),
        updatedAt: new Date()
      }
    }
  ];

  try {
    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      console.log(`\n📝 テストケース ${i + 1}: ${testCase.name}`);
      
      // Firestoreにテストデータを設定
      const userRef = admin.firestore().collection('users').doc(TEST_USER_ID);
      await userRef.set(testCase.data, { merge: true });
      
      console.log('✅ テストデータ設定完了');
      console.log('📊 設定されたデータ:');
      console.log(`- currentPlan: ${testCase.data.currentPlan}`);
      console.log(`- subscriptionStatus: ${testCase.data.subscriptionStatus}`);
      console.log(`- currentPeriodEnd: ${testCase.data.currentPeriodEnd.toLocaleDateString('ja-JP')}`);
      
      // APIレスポンスを確認
      console.log('\n🎯 API応答確認:');
      try {
        const response = await fetch(`http://localhost:3000/api/plan/current?userId=${TEST_USER_ID}`);
        if (response.ok) {
          const apiData = await response.json();
          console.log('API結果:', JSON.stringify(apiData, null, 2));
          
          // UI表示条件を計算
          console.log('\n🖥️ UI表示判定:');
          const status = apiData.status;
          const plan = apiData.plan;
          
          // 解約ボタン表示条件
          const shouldShowCancelButton = (status === 'active' || status === 'trial') && 
                                         plan !== 'free' && 
                                         status !== 'lifetime' && 
                                         !plan?.startsWith('crowdfund');
          
          console.log(`- 解約ボタン表示: ${shouldShowCancelButton}`);
          
          // 期限表示条件
          let periodDisplay = 'なし';
          if (apiData.currentPeriodEnd) {
            if (status === 'active' && !plan?.startsWith('crowdfund')) {
              periodDisplay = `📅 次回更新日: ${new Date(apiData.currentPeriodEnd).toLocaleDateString('ja-JP')}`;
            } else if (status === 'cancel_at_period_end') {
              periodDisplay = `⏰ 利用終了日: ${new Date(apiData.currentPeriodEnd).toLocaleDateString('ja-JP')}`;
            }
          }
          console.log(`- 期限表示: ${periodDisplay}`);
          
        } else {
          console.log('❌ API呼び出し失敗:', response.status);
        }
      } catch (apiError) {
        console.error('❌ API呼び出しエラー:', apiError.message);
      }
      
      console.log('\n⏰ 10秒待機（手動確認用）...');
      console.log(`🔗 ブラウザで確認: http://localhost:3000 (${testCase.name})`);
      
      if (i < testCases.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
    }
    
    console.log('\n✅ 全テストケース完了');
    
  } catch (error) {
    console.error('❌ テストエラー:', error);
  }
}

testPlanDisplay();