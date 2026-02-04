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

async function fixUserPlan() {
  const userId = 'U495bd12b195b7be12845147ebcafb316';
  const db = admin.firestore();
  
  console.log('🔍 課金ユーザーのプラン表示を修正中...');
  console.log(`ユーザーID: ${userId}`);
  console.log('');

  try {
    // 現在の状況を確認
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (userDoc.exists) {
      const userData = userDoc.data();
      console.log('📊 現在のユーザーデータ:');
      console.log('- currentPlan:', userData.currentPlan);
      console.log('- subscriptionStatus:', userData.subscriptionStatus);
      console.log('- currentPeriodEnd:', userData.currentPeriodEnd?.toDate());
      console.log('- stripeSubscriptionId:', userData.stripeSubscriptionId);
      console.log('');
      
      // 支払い情報を確認
      const paymentsQuery = db.collection('payments').where('userId', '==', userId);
      const paymentsSnapshot = await paymentsQuery.get();
      
      console.log('💰 支払い履歴:');
      paymentsSnapshot.docs.forEach((doc, index) => {
        const paymentData = doc.data();
        console.log(`${index + 1}. プラン: ${paymentData.planName}, 金額: ¥${paymentData.amount}, 日付: ${paymentData.createdAt?.toDate()}`);
        console.log(`   priceId: ${paymentData.priceId || '未設定'}`);
      });
      console.log('');
      
      // 環境変数の Price ID を確認
      console.log('🔧 環境変数の Price ID:');
      console.log('- STRIPE_MONTHLY_PRICE_ID:', process.env.STRIPE_MONTHLY_PRICE_ID);
      console.log('- STRIPE_BIANNUAL_PRICE_ID:', process.env.STRIPE_BIANNUAL_PRICE_ID);
      console.log('');
      
      // 期限から判断（6ヶ月後なら半年プラン、1ヶ月後なら月額プラン）
      const periodEnd = userData.currentPeriodEnd?.toDate();
      const createdAt = userData.createdAt?.toDate() || userData.updatedAt?.toDate();
      
      let correctPlan = '月額プラン';
      if (periodEnd && createdAt) {
        const monthsDiff = Math.round((periodEnd - createdAt) / (1000 * 60 * 60 * 24 * 30));
        console.log(`📅 期間分析: 作成日から ${monthsDiff} ヶ月後に期限`);
        
        if (monthsDiff >= 5) {  // 5ヶ月以上なら半年プラン
          correctPlan = '半年プラン';
        }
      }
      
      console.log(`🎯 推定される正しいプラン: ${correctPlan}`);
      console.log('');
      
      // プラン名を修正
      console.log('🔧 プラン名を修正中...');
      await userRef.update({
        currentPlan: correctPlan,
        updatedAt: new Date()
      });
      
      // 支払い履歴のプラン名も修正
      for (const doc of paymentsSnapshot.docs) {
        await doc.ref.update({
          planName: correctPlan,
          updatedAt: new Date()
        });
      }
      
      console.log('✅ プラン名修正完了！');
      console.log(`   ${userData.currentPlan} → ${correctPlan}`);
      console.log('');
      
      // 修正後の確認
      const updatedUserDoc = await userRef.get();
      const updatedUserData = updatedUserDoc.data();
      
      console.log('📊 修正後のユーザーデータ:');
      console.log('- currentPlan:', updatedUserData.currentPlan);
      console.log('- subscriptionStatus:', updatedUserData.subscriptionStatus);
      console.log('- currentPeriodEnd:', updatedUserData.currentPeriodEnd?.toDate());
      
      // APIで返される値をシミュレート
      let apiPlan = 'free';
      let apiPlanName = '無料プラン';
      
      if (updatedUserData.subscriptionStatus === 'active') {
        if (updatedUserData.currentPlan === '月額プラン') {
          apiPlan = 'monthly';
          apiPlanName = '月額プラン';
        } else if (updatedUserData.currentPlan === '半年プラン') {
          apiPlan = 'biannual';
          apiPlanName = '半年プラン';
        }
      }
      
      console.log('');
      console.log('🎯 アプリで表示される内容:');
      console.log('- plan:', apiPlan);
      console.log('- planName:', apiPlanName);
      console.log('- status:', updatedUserData.subscriptionStatus);
      
    } else {
      console.log('❌ ユーザーが見つかりません');
    }
    
  } catch (error) {
    console.error('❌ エラー:', error);
  }
}

fixUserPlan().then(() => {
  console.log('🏁 修正完了');
  process.exit(0);
}).catch((error) => {
  console.error('💥 処理失敗:', error);
  process.exit(1);
});