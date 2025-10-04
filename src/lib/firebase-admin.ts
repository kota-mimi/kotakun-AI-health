import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

if (!getApps().length) {
  try {
    console.log('🔧 Firebase Admin初期化開始...');
    
    // 一時的に簡単な設定でテスト
    initializeApp({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'kotakun',
    });
    console.log('✅ Firebase Admin初期化成功（簡易設定）');
    
  } catch (error) {
    console.error('❌ Firebase admin initialization error:', error);
    // フォールバック: 基本設定
    try {
      initializeApp({
        projectId: 'kotakun',
      });
      console.log('✅ Firebase Admin初期化成功（フォールバック）');
    } catch (fallbackError) {
      console.error('❌ フォールバック初期化も失敗:', fallbackError);
    }
  }
}

export const admin = {
  firestore: () => getFirestore(),
};