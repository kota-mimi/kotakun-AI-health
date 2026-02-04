const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

async function checkFirestoreData() {
  try {
    console.log('🔍 Firestoreのユーザーデータを確認...');
    
    // Firebase Admin初期化
    if (getApps().length === 0) {
      const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'healthy-kun';
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL || 'firebase-adminsdk-fbsvc@healthy-kun.iam.gserviceaccount.com';
      const privateKey = process.env.FIREBASE_PRIVATE_KEY;
      
      if (!privateKey) {
        console.error('❌ FIREBASE_PRIVATE_KEY環境変数が設定されていません');
        return;
      }
      
      const formattedPrivateKey = privateKey.replace(/\\n/g, '\n');
      
      initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey: formattedPrivateKey,
        }),
        projectId,
      });
    }
    
    const firestore = getFirestore();
    
    // 全ユーザーを取得して確認
    const usersSnapshot = await firestore.collection('users').get();
    
    usersSnapshot.forEach(doc => {
      const data = doc.data();
      console.log('📄 ユーザーID:', doc.id);
      console.log('   currentPlan:', JSON.stringify(data.currentPlan));
      console.log('   subscriptionStatus:', JSON.stringify(data.subscriptionStatus));
      console.log('   currentPeriodEnd:', data.currentPeriodEnd?.toDate?.());
      console.log('   stripeSubscriptionId:', JSON.stringify(data.stripeSubscriptionId));
      console.log('---');
    });
    
  } catch (error) {
    console.error('❌ Firestore確認エラー:', error);
  }
}

checkFirestoreData();