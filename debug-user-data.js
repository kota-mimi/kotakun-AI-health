// ユーザーデータをデバッグ表示
const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,  
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const debugUserData = async () => {
  try {
    const userId = 'U7fd12476d6263912e0d9c99fc3a6bef9';
    const db = admin.firestore();
    
    console.log('🔍 ユーザーデータ詳細確認:', userId);
    
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (userDoc.exists) {
      const userData = userDoc.data();
      console.log('📊 ユーザーデータ:');
      console.log(JSON.stringify(userData, null, 2));
      
      console.log('\n🔍 トライアル関連フィールド:');
      console.log('- subscriptionStatus:', userData.subscriptionStatus);
      console.log('- currentPlan:', userData.currentPlan);
      console.log('- trialEndDate:', userData.trialEndDate);
      console.log('- hasTrialHistory:', userData.hasTrialHistory);
      console.log('- cancelledAt:', userData.cancelledAt);
    } else {
      console.log('❌ ユーザードキュメントが見つかりません');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

debugUserData();