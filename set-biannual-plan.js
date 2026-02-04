const dotenv = require('dotenv');
const admin = require('firebase-admin');

// .env.localファイルを読み込み
dotenv.config({ path: '.env.local' });

// Firebase Admin初期化
if (!admin.apps.length) {
  try {
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'healthy-kun';
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
      projectId,
    });

    console.log('✅ Firebase Admin初期化完了');
  } catch (error) {
    console.error('❌ Firebase初期化エラー:', error);
    process.exit(1);
  }
}

async function setBiannualPlan() {
  const userId = 'U7fd12476d6263912e0d9c99fc3a6bef9';
  const db = admin.firestore();
  
  console.log(`🔄 ユーザー ${userId} を半年プランに設定中...`);
  
  try {
    // 6ヶ月後の日付を計算
    const currentPeriodEnd = new Date();
    currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 6);
    
    // 半年プランのデータを設定
    const biannualData = {
      currentPlan: '半年プラン',
      subscriptionStatus: 'active',
      currentPeriodEnd: currentPeriodEnd,
      currentPeriodStart: new Date(),
      stripeSubscriptionId: 'sub_test_biannual_dev',
      updatedAt: new Date()
    };
    
    // ユーザーデータを更新
    const userRef = db.collection('users').doc(userId);
    await userRef.update(biannualData);
    
    console.log('✅ 半年プランに設定完了！');
    console.log('- プラン: 半年プラン');
    console.log('- ステータス: active');
    console.log('- 期限:', currentPeriodEnd.toLocaleDateString('ja-JP'));
    console.log('');
    
    // 設定後の確認
    const userDoc = await userRef.get();
    const userData = userDoc.data();
    
    console.log('📊 設定後のFirestoreデータ:');
    console.log('- currentPlan:', userData.currentPlan);
    console.log('- subscriptionStatus:', userData.subscriptionStatus);
    console.log('- currentPeriodEnd:', userData.currentPeriodEnd?.toDate());
    console.log('');
    
    // APIで返される値をシミュレート
    let plan = 'free';
    let planName = '無料プラン';
    
    if (userData.subscriptionStatus === 'active' && userData.currentPlan === '半年プラン') {
      plan = 'biannual';
      planName = '半年プラン';
    }
    
    console.log('🎯 アプリで表示される内容:');
    console.log('- plan:', plan);
    console.log('- planName:', planName);
    console.log('- status:', userData.subscriptionStatus);
    console.log('- currentPeriodEnd:', userData.currentPeriodEnd?.toDate());
    
  } catch (error) {
    console.error('❌ エラー:', error);
  }
}

setBiannualPlan().then(() => {
  console.log('🏁 設定完了');
  process.exit(0);
}).catch((error) => {
  console.error('💥 処理失敗:', error);
  process.exit(1);
});