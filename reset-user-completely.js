const admin = require('firebase-admin');

// Firebase Admin初期化
if (!admin.apps.length) {
  const serviceAccount = require('./src/lib/firebaseServiceAccount.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

async function resetUserCompletely() {
  const userId = 'U7fd12476d6263912e0d9c99fc3a6bef9';
  
  try {
    console.log(`🔄 ユーザー完全リセット開始: ${userId}`);
    
    // Firestoreからユーザーデータを完全削除して新しく作成
    const userRef = admin.firestore().collection('users').doc(userId);
    
    // 完全に新しいユーザーとして設定
    const resetData = {
      userId,
      subscriptionStatus: 'inactive',
      currentPlan: 'free',
      hasUsedTrial: false, // トライアル利用履歴をリセット
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await userRef.set(resetData);
    
    console.log('✅ ユーザー完全リセット完了');
    console.log('新しいデータ:', resetData);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ リセットエラー:', error);
    process.exit(1);
  }
}

resetUserCompletely();