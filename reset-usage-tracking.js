// 使用回数トラッキングデータをリセット
const admin = require('firebase-admin');

// 環境変数から設定を読み込み
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const resetUsageTracking = async () => {
  try {
    const userId = 'U7fd12476d6263912e0d9c99fc3a6bef9';
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD形式
    
    console.log('🔄 使用回数トラッキングリセット開始...');
    console.log('📅 対象日:', today);
    console.log('👤 ユーザーID:', userId);
    
    const db = admin.firestore();
    
    // 今日の使用回数データを削除
    const usageRef = db.collection('usage_tracking')
      .doc(userId)
      .collection('daily')
      .doc(today);
    
    const usageDoc = await usageRef.get();
    
    if (usageDoc.exists) {
      console.log('📊 現在の使用回数:', usageDoc.data());
      await usageRef.delete();
      console.log('✅ 使用回数データを削除しました');
    } else {
      console.log('ℹ️ 使用回数データは存在しませんでした');
    }
    
    // リセット後の確認
    const checkUsageRef = db.collection('usage_tracking')
      .doc(userId)
      .collection('daily')
      .doc(today);
    
    const checkDoc = await checkUsageRef.get();
    if (!checkDoc.exists) {
      console.log('✅ 使用回数リセット完了: 0/0');
    } else {
      console.log('⚠️ まだデータが残っています:', checkDoc.data());
    }
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ リセットエラー:', error);
    process.exit(1);
  }
};

resetUsageTracking();