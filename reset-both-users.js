const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(require('./serviceAccountKey.json')),
  });
}

const resetBothUsers = async () => {
  try {
    const userIds = [
      'U7fd12476d6263912e0d9c99fc3a6bef9', // 開発者ID
      'U3a6b36f77d71d0ee539347f4fe1d6424'  // せいたさんID
    ];

    const db = admin.firestore();

    for (const userId of userIds) {
      console.log(`\n🔄 ${userId} をリセット中...`);
      
      // 1. usersコレクション削除
      try {
        await db.collection('users').doc(userId).delete();
        console.log('✅ usersコレクション削除完了');
      } catch (error) {
        console.log('⚠️ usersコレクション削除エラー:', error.message);
      }

      // 2. userStatesコレクション削除
      try {
        await db.collection('userStates').doc(userId).delete();
        console.log('✅ userStatesコレクション削除完了');
      } catch (error) {
        console.log('⚠️ userStatesコレクション削除エラー:', error.message);
      }

      // 3. usage_trackingのサブコレクション削除
      try {
        const usageTrackingRef = db.collection('usage_tracking').doc(userId);
        const dailyCollection = usageTrackingRef.collection('daily');
        const dailyDocs = await dailyCollection.get();
        
        const batch = db.batch();
        dailyDocs.docs.forEach(doc => {
          batch.delete(doc.ref);
        });
        
        if (!dailyDocs.empty) {
          await batch.commit();
          console.log(`✅ usage_tracking/daily削除完了: ${dailyDocs.docs.length}件`);
        }

        // usage_trackingドキュメント自体も削除
        await usageTrackingRef.delete();
        console.log('✅ usage_trackingドキュメント削除完了');
      } catch (error) {
        console.log('⚠️ usage_tracking削除エラー:', error.message);
      }

      // 4. pendingTrialsから該当ユーザーを削除
      try {
        const pendingTrialsQuery = await db.collection('pendingTrials')
          .where('userId', '==', userId)
          .get();
        
        const deleteBatch = db.batch();
        pendingTrialsQuery.docs.forEach(doc => {
          deleteBatch.delete(doc.ref);
        });
        
        if (!pendingTrialsQuery.empty) {
          await deleteBatch.commit();
          console.log(`✅ pendingTrials削除完了: ${pendingTrialsQuery.docs.length}件`);
        } else {
          console.log('ℹ️ pendingTrialsにデータなし');
        }
      } catch (error) {
        console.log('⚠️ pendingTrials削除エラー:', error.message);
      }

      console.log(`✅ ${userId} のリセット完了！`);
    }

    console.log('\n🎉 両方のユーザーIDのリセット完了！');
    console.log('\n📝 リセット内容:');
    console.log('- users コレクション削除');
    console.log('- userStates コレクション削除'); 
    console.log('- usage_tracking 全データ削除');
    console.log('- pendingTrials 関連データ削除');
    console.log('\n✨ これで完全に新規ユーザー状態になりました！');
    
  } catch (error) {
    console.error('❌ リセットエラー:', error);
  }
  
  process.exit(0);
};

resetBothUsers();