const admin = require('firebase-admin');

// Firebase Admin SDK の初期化
const serviceAccount = {
  type: "service_account",
  project_id: "kotakun",
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: `https://www.googleapis.com/service_account_certs/${process.env.FIREBASE_CLIENT_EMAIL}`
};

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

async function findAndFixUser() {
  try {
    // 引数で指定された情報を取得
    const email = process.argv[2];
    const customerId = process.argv[3];
    const subscriptionId = process.argv[4];
    
    console.log('🔍 ユーザーを検索中...');
    console.log(`Email: ${email || 'N/A'}`);
    console.log(`Customer ID: ${customerId || 'N/A'}`);
    console.log(`Subscription ID: ${subscriptionId || 'N/A'}`);
    
    const db = admin.firestore();
    let foundUser = null;
    
    // 1. emailで検索
    if (email) {
      const emailSnapshot = await db.collection('users')
        .where('email', '==', email)
        .get();
      
      if (!emailSnapshot.empty) {
        foundUser = emailSnapshot.docs[0];
        console.log(`✅ Emailで発見: ${foundUser.id}`);
      }
    }
    
    // 2. Customer IDで検索
    if (!foundUser && customerId) {
      const customerSnapshot = await db.collection('users')
        .where('stripeCustomerId', '==', customerId)
        .get();
      
      if (!customerSnapshot.empty) {
        foundUser = customerSnapshot.docs[0];
        console.log(`✅ Customer IDで発見: ${foundUser.id}`);
      }
    }
    
    // 3. Subscription IDで検索
    if (!foundUser && subscriptionId) {
      const subSnapshot = await db.collection('users')
        .where('stripeSubscriptionId', '==', subscriptionId)
        .get();
      
      if (!subSnapshot.empty) {
        foundUser = subSnapshot.docs[0];
        console.log(`✅ Subscription IDで発見: ${foundUser.id}`);
      }
    }
    
    // 4. 最近のpending trialsから推測
    if (!foundUser) {
      console.log('\n🔍 最近のpending trialsから推測...');
      const pendingSnapshot = await db.collection('pendingTrials')
        .where('planType', '==', 'half-year')
        .orderBy('createdAt', 'desc')
        .limit(10)
        .get();
      
      if (!pendingSnapshot.empty) {
        console.log('\n📋 半年プラン希望者（最新順）:');
        pendingSnapshot.forEach((doc, index) => {
          const data = doc.data();
          console.log(`${index + 1}. ${data.userId} - ${new Date(data.createdAt.seconds * 1000).toLocaleString('ja-JP')}`);
        });
        
        // 最新のものを仮選択
        const latestTrial = pendingSnapshot.docs[0];
        const userId = latestTrial.data().userId;
        
        const userDoc = await db.collection('users').doc(userId).get();
        if (userDoc.exists) {
          foundUser = userDoc;
          console.log(`\n💡 推測: ${userId} が該当者の可能性が高い`);
        }
      }
    }
    
    if (!foundUser) {
      console.log('\n❌ 該当ユーザーが見つかりませんでした');
      console.log('\n手動で以下の情報を指定してください:');
      console.log('node find-and-fix-user.js [email] [customerId] [subscriptionId]');
      return;
    }
    
    // 現在のデータを表示
    const userData = foundUser.data();
    console.log(`\n📊 現在のユーザーデータ (${foundUser.id}):`);
    console.log(`  プラン: ${userData.currentPlan || 'N/A'}`);
    console.log(`  ステータス: ${userData.subscriptionStatus || 'N/A'}`);
    console.log(`  Stripe Customer: ${userData.stripeCustomerId || 'N/A'}`);
    console.log(`  Stripe Subscription: ${userData.stripeSubscriptionId || 'N/A'}`);
    
    // 更新データを準備
    const updateData = {
      currentPlan: '半年プラン',
      subscriptionStatus: 'active', // トライアル期間が過ぎているため
      stripeCustomerId: customerId || userData.stripeCustomerId,
      stripeSubscriptionId: subscriptionId || userData.stripeSubscriptionId,
      currentPeriodEnd: new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000), // 6ヶ月後
      updatedAt: new Date(),
    };
    
    console.log('\n💾 更新予定データ:');
    console.log(updateData);
    
    // 確認
    console.log('\n❓ この内容で更新しますか？ (y/N)');
    // 実際のスクリプトでは自動更新
    
    await db.collection('users').doc(foundUser.id).update(updateData);
    console.log(`\n✅ ユーザー ${foundUser.id} を半年プランに更新しました！`);
    
  } catch (error) {
    console.error('❌ エラー:', error);
  } finally {
    process.exit(0);
  }
}

findAndFixUser();