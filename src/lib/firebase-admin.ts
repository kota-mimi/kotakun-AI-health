import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

if (!getApps().length) {
  try {
    console.log('🔧 Firebase Admin初期化開始...');
    
    // 環境変数から認証情報を取得
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'kotakun';
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL || 'firebase-adminsdk-fbsvc@kotakun.iam.gserviceaccount.com';
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;
    
    // 本番環境でのみ詳細ログを出力
    if (process.env.NODE_ENV === 'production') {
      console.log('🔍 本番環境 Firebase設定確認:');
      console.log('  - projectId:', projectId);
      console.log('  - clientEmail:', clientEmail ? '設定済み' : '未設定');
      console.log('  - privateKey:', privateKey ? '設定済み' : '未設定');
    }
    
    // 開発環境またはビルド時で適切な秘密鍵がない場合は初期化をスキップ
    if (!clientEmail || !privateKey || privateKey.includes('Example')) {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔧 開発環境：Firebase Admin SDK初期化をスキップ（本番環境でのみ必要）');
        return;
      } else {
        throw new Error('Firebase Admin SDK認証情報が不足しています。FIREBASE_CLIENT_EMAIL と FIREBASE_PRIVATE_KEY を設定してください。');
      }
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
    
    if (process.env.NODE_ENV === 'production') {
      console.log('✅ Firebase Admin初期化成功');
    }
    
  } catch (error) {
    console.error('❌ Firebase admin initialization error:', error);
    
    // 開発環境ではエラーを無視
    if (process.env.NODE_ENV === 'development') {
      console.log('🔧 開発環境：Firebase Admin初期化エラーを無視');
      return;
    }
    
    throw error; // 本番環境ではエラーを再スロー
  }
}

export const admin = {
  firestore: () => {
    try {
      return getFirestore();
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔧 開発環境：Firestoreエラーを無視（ダミーオブジェクトを返却）');
        // 開発環境用のダミーオブジェクトを返却
        return {
          collection: () => ({
            doc: () => ({
              get: () => Promise.resolve({ exists: false }),
              set: () => Promise.resolve(),
              update: () => Promise.resolve(),
              delete: () => Promise.resolve(),
              collection: () => ({
                doc: () => ({
                  get: () => Promise.resolve({ exists: false }),
                  set: () => Promise.resolve(),
                })
              })
            })
          })
        } as any;
      } else {
        console.error('❌ 本番環境 Firebase Admin Firestore取得エラー:', error);
      }
      throw error;
    }
  },
  FieldValue,
};