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

async function findAllPaidUsers() {
  const db = admin.firestore();
  
  console.log('🔍 課金ユーザーを全検索中...');
  console.log('');

  try {
    // まず支払い履歴から探す
    console.log('💰 支払い履歴から課金ユーザーを検索中...');
    const paymentsSnapshot = await db.collection('payments').get();
    
    console.log(`📝 支払い履歴: ${paymentsSnapshot.docs.length}件`);
    
    if (paymentsSnapshot.docs.length > 0) {
      const userPayments = {};
      
      paymentsSnapshot.docs.forEach((doc) => {
        const paymentData = doc.data();
        const userId = paymentData.userId;
        
        if (!userPayments[userId]) {
          userPayments[userId] = [];
        }
        userPayments[userId].push(paymentData);
      });
      
      console.log(`👥 支払いしたユーザー数: ${Object.keys(userPayments).length}人`);
      console.log('');
      
      // 各ユーザーの詳細を確認
      for (const [userId, payments] of Object.entries(userPayments)) {
        console.log(`🔍 ユーザーID: ${userId}`);
        console.log(`   支払い回数: ${payments.length}回`);
        
        // 最新の支払い
        const latestPayment = payments.sort((a, b) => 
          (b.createdAt?.toDate?.() || new Date(b.createdAt || 0)) - 
          (a.createdAt?.toDate?.() || new Date(a.createdAt || 0))
        )[0];
        
        console.log(`   最新プラン: ${latestPayment.planName || '不明'}`);
        console.log(`   最新金額: ¥${latestPayment.amount || '不明'}`);
        console.log(`   最新日付: ${latestPayment.createdAt ? latestPayment.createdAt.toDate() : '不明'}`);
        
        // 実際のユーザーデータを確認
        try {
          const userDoc = await db.collection('users').doc(userId).get();
          if (userDoc.exists) {
            const userData = userDoc.data();
            console.log(`   現在のプラン: ${userData.currentPlan || '未設定'}`);
            console.log(`   現在のステータス: ${userData.subscriptionStatus || '未設定'}`);
            console.log(`   Stripe ID: ${userData.stripeSubscriptionId || '未設定'}`);
            
            // 実際のStripe IDかチェック
            const isRealStripeId = userData.stripeSubscriptionId && 
              userData.stripeSubscriptionId.startsWith('sub_') && 
              !userData.stripeSubscriptionId.includes('test') &&
              !userData.stripeSubscriptionId.includes('dev');
            
            console.log(`   実際の課金: ${isRealStripeId ? '✅ YES' : '❌ NO'}`);
          } else {
            console.log(`   ユーザーデータ: 見つからず`);
          }
        } catch (error) {
          console.log(`   ユーザーデータ取得エラー: ${error.message}`);
        }
        
        console.log('');
      }
    }
    
    // アクティブなサブスクリプションユーザーも確認
    console.log('📋 アクティブなサブスクリプションユーザーを確認中...');
    const activeUsersSnapshot = await db.collection('users')
      .where('subscriptionStatus', '==', 'active')
      .get();
    
    console.log(`👤 アクティブユーザー数: ${activeUsersSnapshot.docs.length}人`);
    console.log('');
    
    activeUsersSnapshot.docs.forEach((doc) => {
      const userData = doc.data();
      const userId = doc.id;
      
      console.log(`📊 アクティブユーザー: ${userId}`);
      console.log(`   プラン: ${userData.currentPlan}`);
      console.log(`   期限: ${userData.currentPeriodEnd ? userData.currentPeriodEnd.toDate() : '未設定'}`);
      console.log(`   Stripe ID: ${userData.stripeSubscriptionId || '未設定'}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ エラー:', error);
  }
}

findAllPaidUsers().then(() => {
  console.log('🏁 検索完了');
  process.exit(0);
}).catch((error) => {
  console.error('💥 処理失敗:', error);
  process.exit(1);
});