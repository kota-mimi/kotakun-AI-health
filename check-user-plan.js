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

async function checkUserPlan() {
  const userId = 'U7fd12476d6263912e0d9c99fc3a6bef9';
  const db = admin.firestore();
  
  console.log(`🔍 ユーザー ${userId} のプラン状況を確認中...`);
  console.log('');

  try {
    // ユーザーデータを取得
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (userDoc.exists) {
      const userData = userDoc.data();
      
      console.log('📊 Firestoreのユーザーデータ:');
      console.log('- currentPlan:', userData.currentPlan || '未設定');
      console.log('- subscriptionStatus:', userData.subscriptionStatus || '未設定');
      console.log('- currentPeriodEnd:', userData.currentPeriodEnd ? userData.currentPeriodEnd.toDate() : '未設定');
      console.log('- stripeSubscriptionId:', userData.stripeSubscriptionId || '未設定');
      console.log('- createdAt:', userData.createdAt ? userData.createdAt.toDate() : '未設定');
      console.log('- updatedAt:', userData.updatedAt ? userData.updatedAt.toDate() : '未設定');
      console.log('');
      
      // APIレスポンス形式で表示
      let plan = 'free';
      let planName = '無料プラン';
      const currentPlan = userData?.currentPlan;
      const subscriptionStatus = userData?.subscriptionStatus || 'inactive';
      
      if (subscriptionStatus === 'active' || subscriptionStatus === 'cancel_at_period_end') {
        if (currentPlan === '月額プラン') {
          plan = 'monthly';
          planName = '月額プラン';
        } else if (currentPlan === '半年プラン') {
          plan = 'biannual';
          planName = '半年プラン';
        }
      }
      
      console.log('🎯 APIで返されるプラン情報:');
      console.log('- plan:', plan);
      console.log('- planName:', planName);
      console.log('- status:', subscriptionStatus);
      console.log('');
      
      // 支払い履歴も確認
      console.log('💰 支払い履歴確認中...');
      const paymentsQuery = db.collection('payments').where('userId', '==', userId);
      const paymentsSnapshot = await paymentsQuery.get();
      
      if (!paymentsSnapshot.empty) {
        console.log(`📝 支払い履歴 (${paymentsSnapshot.docs.length}件):` );
        paymentsSnapshot.docs.forEach((doc, index) => {
          const paymentData = doc.data();
          console.log(`${index + 1}. ${paymentData.planName || 'プラン名なし'} - ¥${paymentData.amount} - ${paymentData.createdAt?.toDate?.() || '日付なし'}`);
        });
      } else {
        console.log('支払い履歴なし');
      }
      
    } else {
      console.log('❌ ユーザードキュメントが存在しません');
    }
    
  } catch (error) {
    console.error('❌ エラー:', error);
  }
}

checkUserPlan().then(() => {
  console.log('🏁 確認完了');
  process.exit(0);
}).catch((error) => {
  console.error('💥 処理失敗:', error);
  process.exit(1);
});