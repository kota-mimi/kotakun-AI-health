import { NextRequest, NextResponse } from 'next/server';
import { admin } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    console.log(`🗑️ ユーザーデータ完全削除開始: ${userId}`);

    const db = admin.firestore();

    // 削除するコレクション一覧
    const collectionsToDelete = [
      'users',
      'usage_tracking',
      'userStates'
    ];

    const deletionResults = [];

    // 1. メインユーザードキュメントとサブコレクション削除
    const userRef = db.collection('users').doc(userId);
    
    // サブコレクション削除
    const subCollections = ['counseling', 'profileHistory', 'dailyRecords'];
    
    for (const subCollection of subCollections) {
      try {
        const subCollectionRef = userRef.collection(subCollection);
        const snapshot = await subCollectionRef.get();
        
        if (!snapshot.empty) {
          const batch = db.batch();
          snapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
          });
          await batch.commit();
          deletionResults.push(`✅ ${subCollection}: ${snapshot.docs.length}件削除`);
        } else {
          deletionResults.push(`ℹ️ ${subCollection}: データなし`);
        }
      } catch (error) {
        console.error(`❌ ${subCollection}削除エラー:`, error);
        deletionResults.push(`❌ ${subCollection}: 削除エラー`);
      }
    }

    // メインユーザードキュメント削除
    const userDoc = await userRef.get();
    if (userDoc.exists) {
      await userRef.delete();
      deletionResults.push('✅ ユーザードキュメント: 削除完了');
    } else {
      deletionResults.push('ℹ️ ユーザードキュメント: 存在せず');
    }

    // 2. usage_tracking削除
    try {
      const usageTrackingRef = db.collection('usage_tracking').doc(userId);
      const usageDoc = await usageTrackingRef.get();
      
      if (usageDoc.exists) {
        // daily サブコレクション削除
        const dailyRef = usageTrackingRef.collection('daily');
        const dailySnapshot = await dailyRef.get();
        
        if (!dailySnapshot.empty) {
          const batch = db.batch();
          dailySnapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
          });
          await batch.commit();
          deletionResults.push(`✅ usage_tracking/daily: ${dailySnapshot.docs.length}件削除`);
        }
        
        // メインdoc削除
        await usageTrackingRef.delete();
        deletionResults.push('✅ usage_tracking: 削除完了');
      } else {
        deletionResults.push('ℹ️ usage_tracking: 存在せず');
      }
    } catch (error) {
      console.error('❌ usage_tracking削除エラー:', error);
      deletionResults.push('❌ usage_tracking: 削除エラー');
    }

    // 3. userStates削除
    try {
      const userStateRef = db.collection('userStates').doc(userId);
      const userStateDoc = await userStateRef.get();
      
      if (userStateDoc.exists) {
        await userStateRef.delete();
        deletionResults.push('✅ userStates: 削除完了');
      } else {
        deletionResults.push('ℹ️ userStates: 存在せず');
      }
    } catch (error) {
      console.error('❌ userStates削除エラー:', error);
      deletionResults.push('❌ userStates: 削除エラー');
    }

    console.log('🗑️ ユーザーデータ削除完了:', deletionResults);

    return NextResponse.json({
      success: true,
      message: `User ${userId} - 全データ削除完了`,
      deletionResults,
      userId
    });

  } catch (error) {
    console.error('❌ Complete user deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete all user data' },
      { status: 500 }
    );
  }
}