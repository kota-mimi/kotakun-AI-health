import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

if (!getApps().length) {
  try {
    // 本番環境用Firebase Admin SDK設定
    console.log('🔧 Firebase Admin初期化開始...');
    
    if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
      // Service Account認証で初期化
      initializeApp({
        credential: cert({
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      });
      console.log('✅ Firebase Admin初期化成功（Service Account）');
    } else {
      // 環境変数が不足している場合
      console.error('❌ Firebase Admin環境変数が不足:', {
        hasPrivateKey: !!process.env.FIREBASE_PRIVATE_KEY,
        hasClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
      });
      throw new Error('Firebase Admin環境変数が設定されていません');
    }
  } catch (error) {
    console.error('❌ Firebase admin initialization error:', error);
    throw error;
  }
}

export const admin = {
  firestore: () => getFirestore(),
};