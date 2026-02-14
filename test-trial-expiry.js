// トライアル期間終了のテストスクリプト
const admin = require('firebase-admin');

// Firebase Admin初期化（環境変数から）
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    })
  });
}

async function testTrialExpiry() {
  const userId = 'U7fd12476d6263912e0d9c99fc3a6bef9'; // あなたのID
  
  try {
    console.log('🔍 現在のユーザーデータ確認...');
    const userDoc = await admin.firestore().collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      console.log('❌ ユーザーが見つかりません');
      return;
    }
    
    const userData = userDoc.data();
    console.log('📊 現在のデータ:', {
      subscriptionStatus: userData.subscriptionStatus,
      currentPlan: userData.currentPlan,
      trialEndDate: userData.trialEndDate?.toDate(),
      currentPeriodEnd: userData.currentPeriodEnd?.toDate()
    });
    
    // トライアル期間を過去の日付に設定（1時間前）
    const pastDate = new Date();
    pastDate.setHours(pastDate.getHours() - 1);
    
    console.log('⏰ トライアル終了日を過去に設定:', pastDate);
    
    await admin.firestore().collection('users').doc(userId).update({
      trialEndDate: pastDate,
      updatedAt: new Date()
    });
    
    console.log('✅ 更新完了！');
    console.log('🧪 テスト方法:');
    console.log('1. プラン管理ページにアクセス');
    console.log('2. 「無料プラン」表示になるかチェック');
    console.log('3. 利用制限が復活しているかチェック');
    
  } catch (error) {
    console.error('❌ エラー:', error);
  }
}

testTrialExpiry();