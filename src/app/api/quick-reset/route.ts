import { NextResponse } from 'next/server';
import { admin } from '@/lib/firebase-admin';

export async function GET() {
  try {
    console.log('🔄 緊急ユーザーリセット実行中...');
    
    const userIds = [
      'U7fd12476d6263912e0d9c99fc3a6bef9', // 開発者ID
      'U3a6b36f77d71d0ee539347f4fe1d6424'  // せいたさんID
    ];

    const db = admin.firestore();
    const results = [];

    for (const userId of userIds) {
      console.log(`🔄 ${userId} リセット開始`);
      
      // 一括削除バッチ
      const batch = db.batch();
      let deleteCount = 0;

      // 1. users削除
      const userRef = db.collection('users').doc(userId);
      batch.delete(userRef);
      deleteCount++;

      // 2. userStates削除
      const stateRef = db.collection('userStates').doc(userId);
      batch.delete(stateRef);
      deleteCount++;

      // 3. usage_tracking削除  
      const usageRef = db.collection('usage_tracking').doc(userId);
      batch.delete(usageRef);
      deleteCount++;

      // バッチ実行
      await batch.commit();
      
      // 4. pendingTrials個別削除
      const pendingQuery = await db.collection('pendingTrials')
        .where('userId', '==', userId)
        .get();
      
      if (!pendingQuery.empty) {
        const pendingBatch = db.batch();
        pendingQuery.docs.forEach(doc => {
          pendingBatch.delete(doc.ref);
          deleteCount++;
        });
        await pendingBatch.commit();
      }

      console.log(`✅ ${userId} 削除完了: ${deleteCount}件`);
      results.push({ userId, deletedItems: deleteCount });
    }

    return NextResponse.json({
      success: true,
      message: '🎉 完全リセット成功！',
      userIds,
      results,
      deletedCollections: [
        'users',
        'userStates', 
        'usage_tracking',
        'pendingTrials'
      ],
      nextStep: '新規ユーザーとしてトライアル登録可能！'
    });

  } catch (error: any) {
    console.error('❌ リセット失敗:', error);
    return NextResponse.json({
      error: `リセット失敗: ${error.message}`,
      success: false
    }, { status: 500 });
  }
}