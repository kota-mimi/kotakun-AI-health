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

async function checkStripeCustomers() {
  try {
    console.log('🔍 Stripe IDを持つユーザーを検索中...');
    
    const db = admin.firestore();
    
    // Stripe IDを持つユーザーを検索
    const usersRef = db.collection('users');
    const snapshot = await usersRef
      .where('stripeSubscriptionId', '!=', null)
      .get();
    
    console.log(`✅ Stripe契約者: ${snapshot.size}人\n`);
    
    if (snapshot.empty) {
      console.log('❌ Stripe契約者が見つかりませんでした');
      return;
    }
    
    snapshot.forEach(doc => {
      const data = doc.data();
      console.log(`👤 ユーザーID: ${doc.id}`);
      console.log(`   プラン: ${data.currentPlan || 'N/A'}`);
      console.log(`   ステータス: ${data.subscriptionStatus || 'N/A'}`);
      console.log(`   Stripe ID: ${data.stripeSubscriptionId}`);
      console.log(`   Customer: ${data.stripeCustomerId || 'N/A'}`);
      if (data.currentPeriodEnd) {
        console.log(`   期限: ${new Date(data.currentPeriodEnd.seconds * 1000).toLocaleDateString('ja-JP')}`);
      }
      if (data.createdAt) {
        console.log(`   登録日: ${new Date(data.createdAt.seconds * 1000).toLocaleDateString('ja-JP')}`);
      }
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
  } finally {
    process.exit(0);
  }
}

checkStripeCustomers();