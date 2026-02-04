const admin = require('firebase-admin');

// Firebase Admin初期化
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: "kotakun",
      clientEmail: "firebase-adminsdk-fbsvc@kotakun.iam.gserviceaccount.com",
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
    projectId: 'kotakun'
  });
}

const db = admin.firestore();

async function resetUserPlan() {
  try {
    const userId = 'U7fd12476d6263912e0d9c99fc3a6bef9';
    
    console.log('🔄 ユーザープランを初期化中...', userId);
    
    await db.collection('users').doc(userId).update({
      plan: 'free',
      subscriptionStatus: 'inactive',
      stripeSubscriptionId: admin.firestore.FieldValue.delete(),
      currentPeriodEnd: admin.firestore.FieldValue.delete(),
      trialEnd: admin.firestore.FieldValue.delete()
    });
    
    console.log('✅ ユーザープラン初期化完了！');
    console.log('🆓 プランが無料プランにリセットされました');
    
  } catch (error) {
    console.error('❌ 初期化エラー:', error);
  }
}

resetUserPlan();