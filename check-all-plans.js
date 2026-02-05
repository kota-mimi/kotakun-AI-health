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

async function checkAllPlans() {
  try {
    console.log('🔍 全ユーザーのプラン状況を確認中...');
    
    const db = admin.firestore();
    
    // 全ユーザーを取得
    const usersRef = db.collection('users');
    const snapshot = await usersRef.get();
    
    if (snapshot.empty) {
      console.log('❌ ユーザーが見つかりませんでした');
      return;
    }
    
    console.log(`✅ 総ユーザー数: ${snapshot.size}人\n`);
    
    const planStats = {};
    const statusStats = {};
    
    snapshot.forEach(doc => {
      const data = doc.data();
      const plan = data.currentPlan || 'undefined';
      const status = data.subscriptionStatus || 'undefined';
      
      // プラン統計
      planStats[plan] = (planStats[plan] || 0) + 1;
      
      // ステータス統計
      statusStats[status] = (statusStats[status] || 0) + 1;
      
      console.log(`👤 ${doc.id.substring(0, 20)}...`);
      console.log(`   プラン: ${plan}`);
      console.log(`   ステータス: ${status}`);
      if (data.currentPeriodEnd) {
        console.log(`   期限: ${new Date(data.currentPeriodEnd.seconds * 1000).toLocaleDateString('ja-JP')}`);
      }
      if (data.stripeSubscriptionId) {
        console.log(`   Stripe ID: ${data.stripeSubscriptionId}`);
      }
      console.log('');
    });
    
    console.log('\n📊 プラン統計:');
    Object.entries(planStats).forEach(([plan, count]) => {
      console.log(`   ${plan}: ${count}人`);
    });
    
    console.log('\n📊 ステータス統計:');
    Object.entries(statusStats).forEach(([status, count]) => {
      console.log(`   ${status}: ${count}人`);
    });
    
  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
  } finally {
    process.exit(0);
  }
}

checkAllPlans();