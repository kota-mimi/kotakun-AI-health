const admin = require('firebase-admin');
const Stripe = require('stripe');

// Stripe初期化
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-11-20.acacia',
});

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

async function fixStripeCustomer() {
  try {
    const customerId = 'cus_Tu2WpSx3Heg6DH';
    
    console.log(`🔍 Customer情報を取得中: ${customerId}`);
    
    // 1. Stripe Customerを取得
    const customer = await stripe.customers.retrieve(customerId);
    console.log('Customer:', {
      id: customer.id,
      email: customer.email,
      metadata: customer.metadata,
      created: new Date(customer.created * 1000).toLocaleString('ja-JP')
    });
    
    // 2. Customerのサブスクリプションを取得
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'all',
      limit: 10
    });
    
    console.log(`\n📋 サブスクリプション数: ${subscriptions.data.length}`);
    
    for (const subscription of subscriptions.data) {
      console.log('\n🔸 サブスクリプション詳細:');
      console.log(`  ID: ${subscription.id}`);
      console.log(`  ステータス: ${subscription.status}`);
      console.log(`  現在期間: ${new Date(subscription.current_period_start * 1000).toLocaleDateString('ja-JP')} - ${new Date(subscription.current_period_end * 1000).toLocaleDateString('ja-JP')}`);
      console.log(`  トライアル終了: ${subscription.trial_end ? new Date(subscription.trial_end * 1000).toLocaleDateString('ja-JP') : 'なし'}`);
      console.log(`  メタデータ:`, subscription.metadata);
      
      // 価格情報
      if (subscription.items.data.length > 0) {
        const item = subscription.items.data[0];
        console.log(`  価格ID: ${item.price.id}`);
        console.log(`  金額: ¥${item.price.unit_amount}`);
        console.log(`  間隔: ${item.price.recurring.interval_count} ${item.price.recurring.interval}`);
      }
    }
    
    // 3. このcustomerのuserIdを探す
    let userId = null;
    
    // metadataから取得
    if (customer.metadata && customer.metadata.userId) {
      userId = customer.metadata.userId;
      console.log(`\n✅ Customer metadataからuserID発見: ${userId}`);
    } 
    // サブスクリプションのmetadataから取得
    else {
      for (const subscription of subscriptions.data) {
        if (subscription.metadata && subscription.metadata.userId) {
          userId = subscription.metadata.userId;
          console.log(`\n✅ Subscription metadataからuserID発見: ${userId}`);
          break;
        }
      }
    }
    
    if (!userId) {
      console.log('\n❌ userIDが見つかりません。manual lookupが必要です。');
      
      // 手動でuserIDを指定（必要に応じて）
      console.log('\n🔍 最近のpending trialsを確認...');
      const db = admin.firestore();
      const pendingTrialsSnapshot = await db.collection('pendingTrials')
        .orderBy('createdAt', 'desc')
        .limit(5)
        .get();
      
      if (!pendingTrialsSnapshot.empty) {
        console.log('\n📋 最近のpending trials:');
        pendingTrialsSnapshot.forEach(doc => {
          const data = doc.data();
          console.log(`  ${data.userId} - ${data.planType} - ${new Date(data.createdAt.seconds * 1000).toLocaleString('ja-JP')}`);
        });
      }
      return;
    }
    
    // 4. Firestoreを更新
    console.log(`\n💾 Firestoreを更新中: ${userId}`);
    
    const activeSubscription = subscriptions.data.find(sub => sub.status === 'active' || sub.status === 'trialing');
    if (!activeSubscription) {
      console.log('❌ アクティブなサブスクリプションが見つかりません');
      return;
    }
    
    // プラン名を判定
    const priceId = activeSubscription.items.data[0]?.price?.id;
    let currentPlan = '半年プラン'; // ¥3,000なので半年プラン
    
    const isTrialActive = activeSubscription.trial_end && activeSubscription.trial_end > Date.now() / 1000;
    const subscriptionStatus = isTrialActive ? 'trial' : 'active';
    
    const updateData = {
      subscriptionStatus: subscriptionStatus,
      currentPlan: currentPlan,
      stripeSubscriptionId: activeSubscription.id,
      stripeCustomerId: customer.id,
      currentPeriodEnd: new Date(activeSubscription.current_period_end * 1000),
      trialEndDate: activeSubscription.trial_end ? new Date(activeSubscription.trial_end * 1000) : null,
      updatedAt: new Date(),
    };
    
    console.log('更新データ:', updateData);
    
    const db = admin.firestore();
    await db.collection('users').doc(userId).update(updateData);
    
    console.log(`✅ ユーザー ${userId} のFirestoreデータを更新しました！`);
    
  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
  } finally {
    process.exit(0);
  }
}

fixStripeCustomer();