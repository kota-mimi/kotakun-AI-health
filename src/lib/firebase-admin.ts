import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

if (!getApps().length) {
  try {
    console.log('🔧 Firebase Admin初期化開始...');
    
    // 環境変数から認証情報を取得
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'kotakun';
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL || 'firebase-adminsdk-fbsvc@kotakun.iam.gserviceaccount.com';
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;
    
    console.log('🔍 環境変数確認:');
    console.log('  - projectId:', projectId);
    console.log('  - clientEmail:', clientEmail ? '設定済み' : '未設定');
    console.log('  - privateKey:', privateKey ? '設定済み' : '未設定');
    
    if (!clientEmail || !privateKey) {
      throw new Error('Firebase Admin SDK認証情報が不足しています。FIREBASE_CLIENT_EMAIL と FIREBASE_PRIVATE_KEY を設定してください。');
    }
    
    // Private Key の改行文字を正しく処理
    const formattedPrivateKey = privateKey.replace(/\\n/g, '\n');
    
    // 認証情報で初期化
    initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey: formattedPrivateKey,
      }),
      projectId,
    });
    
    console.log('✅ Firebase Admin初期化成功');
    
  } catch (error) {
    console.error('❌ Firebase admin initialization error:', error);
    throw error; // エラーを再スローして明確にする
  }
}

export const admin = {
  firestore: () => getFirestore(),
  FieldValue,
};