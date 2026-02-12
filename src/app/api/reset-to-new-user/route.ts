import { NextResponse } from 'next/server';
import { admin } from '@/lib/firebase-admin';

export async function GET() {
  try {
    const userId = 'U7fd12476d6263912e0d9c99fc3a6bef9'; // あなたのID
    
    console.log('🔄 ユーザーを新規状態にリセット中...');
    
    // 1. ユーザーデータを完全削除
    await admin.firestore().collection('users').doc(userId).delete();
    console.log('✅ ユーザーデータ削除完了');
    
    // 2. usage_tracking削除
    await admin.firestore().collection('usage_tracking').doc(userId).delete();
    console.log('✅ 利用制限データ削除完了');
    
    // 3. pendingTrials削除（もしあれば）
    const pendingTrialsRef = admin.firestore().collection('pendingTrials');
    const pendingQuery = await pendingTrialsRef.where('userId', '==', userId).get();
    
    const batch = admin.firestore().batch();
    pendingQuery.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();
    console.log('✅ pendingTrials削除完了');
    
    // 4. notification_history削除（もしあれば）
    const today = new Date().toISOString().split('T')[0];
    const notificationRef = admin.firestore()
      .collection('notification_history')
      .doc(`${userId}_trial_${today}`);
    
    try {
      await notificationRef.delete();
      console.log('✅ 通知履歴削除完了');
    } catch (e) {
      console.log('ℹ️ 通知履歴はありませんでした');
    }
    
    return NextResponse.json({
      success: true,
      message: '🎉 完全リセット完了！',
      userId,
      status: [
        'ユーザーデータ: 存在しない（新規ユーザー状態）',
        '利用制限: なし',
        'トライアル履歴: なし', 
        '通知履歴: なし'
      ],
      nextStep: '完全に新規ユーザーと同じ状態になりました！LINEでトライアル登録をテストできます。'
    });

  } catch (error: any) {
    console.error('❌ リセットエラー:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}