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

async function findRealBiannualUser() {
  const db = admin.firestore();
  
  console.log('🔍 半年プランで課金したユーザーを検索中...');
  console.log('');

  try {
    // 半年プランのユーザーを検索
    const usersQuery = db.collection('users').where('currentPlan', '==', '半年プラン');
    const usersSnapshot = await usersQuery.get();
    
    console.log(`📊 半年プランユーザー: ${usersSnapshot.docs.length}人`);
    console.log('');
    
    usersSnapshot.docs.forEach((doc, index) => {
      const userData = doc.data();
      const userId = doc.id;
      
      console.log(`${index + 1}. ユーザーID: ${userId}`);
      console.log(`   - プラン: ${userData.currentPlan}`);
      console.log(`   - ステータス: ${userData.subscriptionStatus}`);
      console.log(`   - 期限: ${userData.currentPeriodEnd ? userData.currentPeriodEnd.toDate() : '未設定'}`);
      console.log(`   - Stripe ID: ${userData.stripeSubscriptionId || '未設定'}`);
      console.log(`   - 作成日: ${userData.createdAt ? userData.createdAt.toDate() : '未設定'}`);
      
      // 実際のStripe IDかチェック
      const isRealStripeId = userData.stripeSubscriptionId && 
        userData.stripeSubscriptionId.startsWith('sub_') && 
        !userData.stripeSubscriptionId.includes('test') &&
        !userData.stripeSubscriptionId.includes('dev');
      
      console.log(`   - 実際の課金: ${isRealStripeId ? '✅' : '❌'}`);
      console.log('');
    });
    
    // 支払い履歴も確認
    console.log('💰 半年プランの支払い履歴を確認中...');
    const paymentsQuery = db.collection('payments').where('planName', '==', '半年プラン');
    const paymentsSnapshot = await paymentsQuery.get();
    
    console.log(`📝 半年プランの支払い履歴: ${paymentsSnapshot.docs.length}件`);
    console.log('');
    
    paymentsSnapshot.docs.forEach((doc, index) => {
      const paymentData = doc.data();
      
      console.log(`${index + 1}. 支払い記録:`);
      console.log(`   - ユーザーID: ${paymentData.userId}`);
      console.log(`   - 金額: ¥${paymentData.amount}`);
      console.log(`   - 日付: ${paymentData.createdAt ? paymentData.createdAt.toDate() : '未設定'}`);
      console.log(`   - Stripe セッションID: ${paymentData.stripeSessionId || '未設定'}`);
      console.log(`   - Stripe カスタマーID: ${paymentData.stripeCustomerId || '未設定'}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ エラー:', error);
  }
}

findRealBiannualUser().then(() => {
  console.log('🏁 検索完了');
  process.exit(0);
}).catch((error) => {
  console.error('💥 処理失敗:', error);
  process.exit(1);
});