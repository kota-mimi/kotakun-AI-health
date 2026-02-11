import { NextRequest, NextResponse } from 'next/server';
import { admin } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  try {
    // 固定のユーザーIDをリセット
    const userIds = [
      'U7fd12476d6263912e0d9c99fc3a6bef9', // 開発者ID
      'U3a6b36f77d71d0ee539347f4fe1d6424'  // せいたさんID
    ];

    console.log('🔄 ユーザーリセット開始:', userIds);

    const db = admin.firestore();
    const results = [];

    for (const userId of userIds) {
      console.log(`\n🔄 ${userId} をリセット中...`);
      const resetResult = { userId, success: true, errors: [] };
      
      // 1. usersコレクション削除
      try {
        const userDoc = await db.collection('users').doc(userId).get();
        if (userDoc.exists) {
          await db.collection('users').doc(userId).delete();
          console.log('✅ usersコレクション削除完了');
        } else {
          console.log('ℹ️ usersコレクションにデータなし');
        }
      } catch (error: any) {
        console.log('⚠️ usersコレクション削除エラー:', error.message);
        resetResult.errors.push('users deletion failed');
      }

      // 2. userStatesコレクション削除
      try {
        const stateDoc = await db.collection('userStates').doc(userId).get();
        if (stateDoc.exists) {
          await db.collection('userStates').doc(userId).delete();
          console.log('✅ userStatesコレクション削除完了');
        } else {
          console.log('ℹ️ userStatesコレクションにデータなし');
        }
      } catch (error: any) {
        console.log('⚠️ userStatesコレクション削除エラー:', error.message);
        resetResult.errors.push('userStates deletion failed');
      }

      // 3. usage_trackingのサブコレクション削除
      try {
        const usageTrackingRef = db.collection('usage_tracking').doc(userId);
        const dailyCollection = usageTrackingRef.collection('daily');
        const dailyDocs = await dailyCollection.get();
        
        if (!dailyDocs.empty) {
          const batch = db.batch();
          dailyDocs.docs.forEach(doc => {
            batch.delete(doc.ref);
          });
          await batch.commit();
          console.log(`✅ usage_tracking/daily削除完了: ${dailyDocs.docs.length}件`);
        } else {
          console.log('ℹ️ usage_tracking/dailyにデータなし');
        }

        // usage_trackingドキュメント自体も削除
        const usageDoc = await usageTrackingRef.get();
        if (usageDoc.exists) {
          await usageTrackingRef.delete();
          console.log('✅ usage_trackingドキュメント削除完了');
        }
      } catch (error: any) {
        console.log('⚠️ usage_tracking削除エラー:', error.message);
        resetResult.errors.push('usage_tracking deletion failed');
      }

      // 4. pendingTrialsから該当ユーザーを削除
      try {
        const pendingTrialsQuery = await db.collection('pendingTrials')
          .where('userId', '==', userId)
          .get();
        
        if (!pendingTrialsQuery.empty) {
          const deleteBatch = db.batch();
          pendingTrialsQuery.docs.forEach(doc => {
            deleteBatch.delete(doc.ref);
          });
          await deleteBatch.commit();
          console.log(`✅ pendingTrials削除完了: ${pendingTrialsQuery.docs.length}件`);
        } else {
          console.log('ℹ️ pendingTrialsにデータなし');
        }
      } catch (error: any) {
        console.log('⚠️ pendingTrials削除エラー:', error.message);
        resetResult.errors.push('pendingTrials deletion failed');
      }

      console.log(`✅ ${userId} のリセット完了！`);
      results.push(resetResult);
    }

    console.log('🎉 全ユーザーのリセット完了！');
    
    return NextResponse.json({
      success: true,
      message: '🎉 2つのユーザーIDを完全に新規状態にリセットしました！',
      resetUsers: userIds,
      results,
      resetItems: [
        'users コレクション削除',
        'userStates コレクション削除', 
        'usage_tracking 全データ削除',
        'pendingTrials 関連データ削除'
      ],
      nextStep: '新規ユーザーとしてトライアル登録をテストできます'
    });

  } catch (error: any) {
    console.error('❌ リセットエラー:', error);
    return NextResponse.json({
      error: error.message || 'ユーザーリセットに失敗しました'
    }, { status: 500 });
  }
}