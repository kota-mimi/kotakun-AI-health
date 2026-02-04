// 手動でFirestoreのcurrentPlanを修正
const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

async function fixUserPlan() {
  try {
    // Firebase Admin初期化（環境変数から）
    if (getApps().length === 0) {
      // 開発環境なので環境変数なしで実行（エラー想定）
      console.log('⚠️ Firebase環境変数なしで実行 - 手動修正が必要');
      return;
    }
    
    const firestore = getFirestore();
    const userId = 'U7fd12476d6263912e0d9c99fc3a6bef9';
    
    console.log('🔧 Firestoreでプランを半年プランに修正中...', userId);
    
    await firestore.collection('users').doc(userId).update({
      currentPlan: '半年プラン',
      updatedAt: new Date()
    });
    
    console.log('✅ 修正完了: currentPlan = "半年プラン"');
    
  } catch (error) {
    console.error('❌ 修正エラー:', error);
    console.log('\n🔧 手動修正が必要です:');
    console.log('1. Firebaseコンソールにログイン');
    console.log('2. healthy-kun プロジェクト → Firestore');
    console.log('3. users コレクション → U7fd12476d6263912e0d9c99fc3a6bef9');
    console.log('4. currentPlan フィールドを "半年プラン" に変更');
  }
}

fixUserPlan();