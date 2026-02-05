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

async function simpleSearch() {
  try {
    const email = process.argv[2] || 'cyu.ra98@gmail.com';
    console.log(`🔍 ${email} を検索中...`);
    
    const db = admin.firestore();
    
    // 1. email完全一致で検索
    const emailSnapshot = await db.collection('users')
      .where('email', '==', email)
      .get();
    
    if (!emailSnapshot.empty) {
      console.log(`✅ Email完全一致で発見!`);
      emailSnapshot.forEach(doc => {
        const data = doc.data();
        console.log(`👤 ユーザーID: ${doc.id}`);
        console.log(`   Email: ${data.email}`);
        console.log(`   プラン: ${data.currentPlan || 'N/A'}`);
        console.log(`   ステータス: ${data.subscriptionStatus || 'N/A'}`);
        
        // 半年プランに更新
        updateUser(doc.id);
      });
      return;
    }
    
    console.log('❌ Email完全一致なし。全ユーザーから部分検索...');
    
    // 2. 全ユーザーから部分検索
    const allUsers = await db.collection('users').limit(100).get();
    const matches = [];
    
    allUsers.forEach(doc => {
      const data = doc.data();
      if (data.email && data.email.includes('cyu.ra98')) {
        matches.push({ id: doc.id, data });
      }
    });
    
    if (matches.length > 0) {
      console.log(`✅ 部分一致で${matches.length}件発見:`);
      matches.forEach(match => {
        console.log(`👤 ${match.id} - ${match.data.email}`);
      });
      
      // 最初のマッチを更新
      if (matches.length === 1) {
        await updateUser(matches[0].id);
      }
    } else {
      console.log('❌ 該当ユーザーが見つかりませんでした');
      
      // 最近登録したユーザーを表示
      console.log('\n📋 最近のユーザー (参考):');
      const recentUsers = await db.collection('users')
        .orderBy('createdAt', 'desc')
        .limit(10)
        .get();
      
      recentUsers.forEach(doc => {
        const data = doc.data();
        if (data.email) {
          console.log(`  ${doc.id.substring(0, 20)}... - ${data.email} - ${data.createdAt ? new Date(data.createdAt.seconds * 1000).toLocaleDateString('ja-JP') : 'N/A'}`);
        }
      });
    }
    
  } catch (error) {
    console.error('❌ エラー:', error);
  } finally {
    process.exit(0);
  }
}

async function updateUser(userId) {
  try {
    console.log(`\n💾 ${userId} を半年プランに更新中...`);
    
    const db = admin.firestore();
    const updateData = {
      currentPlan: '半年プラン',
      subscriptionStatus: 'active',
      stripeCustomerId: 'cus_Tu2WpSx3Heg6DH', // 本番環境のcustomer ID
      currentPeriodEnd: new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000), // 6ヶ月後
      updatedAt: new Date(),
    };
    
    await db.collection('users').doc(userId).update(updateData);
    console.log(`✅ ユーザー ${userId} を半年プランに更新完了!`);
    
  } catch (error) {
    console.error('❌ 更新エラー:', error);
  }
}

simpleSearch();