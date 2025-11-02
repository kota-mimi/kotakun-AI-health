import { NextRequest, NextResponse } from 'next/server';
import { admin } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    console.log(`🗑️ テストデータ削除開始 - ユーザーID: ${userId}`);

    const firestore = admin.firestore();
    const deletedCollections: string[] = [];

    // 1. usersコレクションからユーザーデータを削除
    try {
      const userRef = firestore.collection('users').doc(userId);
      const userDoc = await userRef.get();
      
      if (userDoc.exists) {
        await userRef.delete();
        deletedCollections.push('users');
        console.log('✅ users コレクションから削除完了');
      } else {
        console.log('ℹ️ users コレクションにデータなし');
      }
    } catch (error) {
      console.error('❌ users削除エラー:', error);
    }

    // 2. counselingResultsコレクションから削除
    try {
      const counselingQuery = firestore.collection('counselingResults')
        .where('lineUserId', '==', userId);
      const counselingSnapshot = await counselingQuery.get();
      
      if (!counselingSnapshot.empty) {
        const batch = firestore.batch();
        counselingSnapshot.docs.forEach(doc => {
          batch.delete(doc.ref);
        });
        await batch.commit();
        deletedCollections.push('counselingResults');
        console.log(`✅ counselingResults コレクションから${counselingSnapshot.size}件削除完了`);
      } else {
        console.log('ℹ️ counselingResults コレクションにデータなし');
      }
    } catch (error) {
      console.error('❌ counselingResults削除エラー:', error);
    }

    // 3. paymentsコレクションから削除
    try {
      const paymentsQuery = firestore.collection('payments')
        .where('userId', '==', userId);
      const paymentsSnapshot = await paymentsQuery.get();
      
      if (!paymentsSnapshot.empty) {
        const batch = firestore.batch();
        paymentsSnapshot.docs.forEach(doc => {
          batch.delete(doc.ref);
        });
        await batch.commit();
        deletedCollections.push('payments');
        console.log(`✅ payments コレクションから${paymentsSnapshot.size}件削除完了`);
      } else {
        console.log('ℹ️ payments コレクションにデータなし');
      }
    } catch (error) {
      console.error('❌ payments削除エラー:', error);
    }

    // 4. dateBasedDataコレクションから削除（日別データ）
    try {
      const dateDataQuery = firestore.collection('dateBasedData')
        .where('userId', '==', userId);
      const dateDataSnapshot = await dateDataQuery.get();
      
      if (!dateDataSnapshot.empty) {
        const batch = firestore.batch();
        dateDataSnapshot.docs.forEach(doc => {
          batch.delete(doc.ref);
        });
        await batch.commit();
        deletedCollections.push('dateBasedData');
        console.log(`✅ dateBasedData コレクションから${dateDataSnapshot.size}件削除完了`);
      } else {
        console.log('ℹ️ dateBasedData コレクションにデータなし');
      }
    } catch (error) {
      console.error('❌ dateBasedData削除エラー:', error);
    }

    console.log(`🎉 テストデータ削除完了 - 削除されたコレクション: ${deletedCollections.join(', ')}`);

    return NextResponse.json({
      success: true,
      message: `ユーザー ${userId} のデータを削除しました`,
      deletedCollections,
      instruction: 'ブラウザのLocalStorageも手動でクリアしてください (F12 → Application → Local Storage)'
    });

  } catch (error) {
    console.error('❌ データ削除API エラー:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to delete user data',
        details: error.message 
      },
      { status: 500 }
    );
  }
}