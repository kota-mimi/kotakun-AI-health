import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

// Firebase Admin初期化関数
function initializeFirebaseAdmin() {
  if (getApps().length) {
    return; // 既に初期化済み
  }

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
      console.log('🔧 Firebase Admin SDK初期化をスキップ（認証情報不足）');
      return;
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
      storageBucket: `${projectId}.appspot.com`,
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

// 初期化を実行
initializeFirebaseAdmin();

// Firestoreインスタンスを格納する変数
let firestoreInstance: any = null;

// 初期化が完了した後にFirestoreインスタンスを取得
try {
  if (getApps().length > 0) {
    firestoreInstance = getFirestore();
  }
} catch (error) {
  console.log('🔧 Firestore初期化時エラー:', error);
}

export const admin = {
  firestore: () => {
    if (firestoreInstance) {
      return firestoreInstance;
    }
    
    try {
      firestoreInstance = getFirestore();
      return firestoreInstance;
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
  storage: () => {
    try {
      return getStorage();
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔧 開発環境：Storage エラーを無視');
        return null;
      } else {
        console.error('❌ 本番環境 Firebase Admin Storage取得エラー:', error);
      }
      throw error;
    }
  },
  FieldValue,
};