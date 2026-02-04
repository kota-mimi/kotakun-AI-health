require('dotenv').config({ path: './.env.local' });
const admin = require('firebase-admin');

// Firebase Admin SDK初期化
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: "kotakun",
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    })
  });
}

async function deleteUserData() {
  try {
    const userId = 'U7fd12476d6263912e0d9c99fc3a6bef9';
    const db = admin.firestore();
    
    console.log('🗑️ ユーザーデータを削除中...', userId);
    
    // usersコレクションから削除
    await db.collection('users').doc(userId).delete();
    
    console.log('✅ ユーザーデータ削除完了！');
    console.log('🎯 これで新規ユーザーとして再開始できます');
    
    // プロセス終了
    process.exit(0);
    
  } catch (error) {
    console.error('❌ 削除エラー:', error.message);
    process.exit(1);
  }
}

deleteUserData();