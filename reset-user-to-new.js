// あなたのIDを完全に新規ユーザー状態にリセット
const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    })
  });
}

async function resetUserToNew() {
  const userId = 'U7fd12476d6263912e0d9c99fc3a6bef9';
  
  try {
    console.log('🔄 ユーザーを新規状態にリセット中...');
    
    // 1. ユーザーデータを完全削除
    await admin.firestore().collection('users').doc(userId).delete();
    console.log('✅ ユーザーデータ削除完了');
    
    // 2. usage_tracking削除
    await admin.firestore().collection('usage_tracking').doc(userId).delete();
    console.log('✅ 利用制限データ削除完了');
    
    // 3. pendingTrials削除（もしあれば）
    const pendingTrialsRef = admin.firestore().collection('pendingTrials');
    const pendingQuery = await pendingTrialsRef.where('userId', '==', userId).get();
    
    const batch = admin.firestore().batch();
    pendingQuery.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();
    console.log('✅ pendingTrials削除完了');
    
    // 4. notification_history削除（もしあれば）
    const today = new Date().toISOString().split('T')[0];
    const notificationRef = admin.firestore()
      .collection('notification_history')
      .doc(`${userId}_trial_${today}`);
    
    try {
      await notificationRef.delete();
      console.log('✅ 通知履歴削除完了');
    } catch (e) {
      console.log('ℹ️ 通知履歴はありませんでした');
    }
    
    console.log('');
    console.log('🎉 完全リセット完了！');
    console.log('');
    console.log('📋 現在の状態:');
    console.log('- ユーザーデータ: 存在しない（新規ユーザー状態）');
    console.log('- 利用制限: なし');
    console.log('- トライアル履歴: なし');
    console.log('- 通知履歴: なし');
    console.log('');
    console.log('✅ 完全に新規ユーザーと同じ状態になりました！');
    
  } catch (error) {
    console.error('❌ リセットエラー:', error);
  }
}

resetUserToNew();