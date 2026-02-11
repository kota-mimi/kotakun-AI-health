import { NextRequest, NextResponse } from 'next/server';
import { admin } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const { userIds } = await request.json();
    
    if (!userIds || !Array.isArray(userIds)) {
      return NextResponse.json({ error: 'userIds array required' }, { status: 400 });
    }

    console.log('🔄 ユーザーリセット開始:', userIds);

    const db = admin.firestore();
    const results = [];

    for (const userId of userIds) {
      console.log(`\n🔄 ${userId} をリセット中...`);
      const resetResult = { userId, success: true, errors: [] };
      
      // 1. usersコレクション削除
      try {
        await db.collection('users').doc(userId).delete();
        console.log('✅ usersコレクション削除完了');
      } catch (error: any) {
        console.log('⚠️ usersコレクション削除エラー:', error.message);
        resetResult.errors.push('users deletion failed');
      }

      // 2. userStatesコレクション削除
      try {
        await db.collection('userStates').doc(userId).delete();
        console.log('✅ userStatesコレクション削除完了');
      } catch (error: any) {
        console.log('⚠️ userStatesコレクション削除エラー:', error.message);
        resetResult.errors.push('userStates deletion failed');
      }

      // 3. usage_trackingのサブコレクション削除
      try {
        const usageTrackingRef = db.collection('usage_tracking').doc(userId);
        const dailyCollection = usageTrackingRef.collection('daily');
        const dailyDocs = await dailyCollection.get();
        
        const batch = db.batch();
        dailyDocs.docs.forEach(doc => {
          batch.delete(doc.ref);
        });
        
        if (!dailyDocs.empty) {
          await batch.commit();
          console.log(`✅ usage_tracking/daily削除完了: ${dailyDocs.docs.length}件`);
        }

        // usage_trackingドキュメント自体も削除
        await usageTrackingRef.delete();
        console.log('✅ usage_trackingドキュメント削除完了');
      } catch (error: any) {
        console.log('⚠️ usage_tracking削除エラー:', error.message);
        resetResult.errors.push('usage_tracking deletion failed');
      }

      // 4. pendingTrialsから該当ユーザーを削除
      try {
        const pendingTrialsQuery = await db.collection('pendingTrials')
          .where('userId', '==', userId)
          .get();
        
        const deleteBatch = db.batch();
        pendingTrialsQuery.docs.forEach(doc => {
          deleteBatch.delete(doc.ref);
        });
        
        if (!pendingTrialsQuery.empty) {
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
      message: 'ユーザーリセット完了',
      results,
      resetItems: [
        'users コレクション削除',
        'userStates コレクション削除', 
        'usage_tracking 全データ削除',
        'pendingTrials 関連データ削除'
      ]
    });

  } catch (error: any) {
    console.error('❌ リセットエラー:', error);
    return NextResponse.json({
      error: error.message || 'ユーザーリセットに失敗しました'
    }, { status: 500 });
  }
}