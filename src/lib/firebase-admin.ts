import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

if (!getApps().length) {
  try {
    console.log('🔧 Firebase Admin初期化開始...');
    
    // 環境変数から認証情報を取得
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'kotakun';
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;
    
    if (!clientEmail || !privateKey) {
      throw new Error('Firebase Admin SDK認証情報が不足しています');
    }
    
    // 正式な認証情報で初期化
    initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey: privateKey.replace(/\\n/g, '\n'), // \nを実際の改行に変換
      }),
      projectId,
    });
    
    console.log('✅ Firebase Admin初期化成功（認証情報あり）');
    
  } catch (error) {
    console.error('❌ Firebase admin initialization error:', error);
    // フォールバック: 簡易設定（読み取り専用）
    try {
      initializeApp({
        projectId: 'kotakun',
      });
      console.log('⚠️ Firebase Admin初期化成功（簡易設定 - 読み取り専用）');
    } catch (fallbackError) {
      console.error('❌ フォールバック初期化も失敗:', fallbackError);
    }
  }
}

export const admin = {
  firestore: () => getFirestore(),
};