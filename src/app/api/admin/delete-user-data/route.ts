import { NextRequest, NextResponse } from 'next/server';
import { admin } from '@/lib/firebase-admin';

// 開発者専用データ削除API
export async function POST(request: NextRequest) {
  try {
    const { userId, adminKey } = await request.json();

    // 管理者キーの確認
    if (adminKey !== process.env.ADMIN_DELETE_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 開発者IDまたは指定ユーザーIDの確認
    const allowedUserIds = [
      process.env.DEVELOPER_LINE_ID,
      'U7fd12476d6263912e0d9c99fc3a6bef9' // 一時的に追加
    ].filter(Boolean);
    
    if (!allowedUserIds.includes(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 403 });
    }

    const db = admin.firestore();
    const batch = db.batch();

    console.log(`🗑️ ユーザーデータ削除開始: ${userId}`);

    // 1. ユーザードキュメント削除
    const userRef = db.collection('users').doc(userId);
    batch.delete(userRef);

    // 2. 支払い記録削除
    const paymentsSnapshot = await db.collection('payments')
      .where('userId', '==', userId)
      .get();
    
    paymentsSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    // 3. 使用量追跡データ削除
    const usageRef = db.collection('usage_tracking').doc(userId);
    batch.delete(usageRef);
    
    // 使用量の日次データも削除
    const dailyUsageSnapshot = await usageRef.collection('daily').get();
    dailyUsageSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    // 4. 食事記録削除
    const mealsSnapshot = await db.collection('meals')
      .where('lineUserId', '==', userId)
      .get();
    
    mealsSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    // 5. 体重記録削除
    const weightSnapshot = await db.collection('weight')
      .where('lineUserId', '==', userId)
      .get();
    
    weightSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    // 6. 運動記録削除
    const exerciseSnapshot = await db.collection('exercises')
      .where('lineUserId', '==', userId)
      .get();
    
    exerciseSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    // 7. フィードバック記録削除
    const feedbackSnapshot = await db.collection('feedback')
      .where('lineUserId', '==', userId)
      .get();
    
    feedbackSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    // 8. カウンセリング記録削除
    const counselingSnapshot = await db.collection('counseling')
      .where('lineUserId', '==', userId)
      .get();
    
    counselingSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    // 9. プロフィール履歴削除
    const profileSnapshot = await db.collection('profile_history')
      .where('lineUserId', '==', userId)
      .get();
    
    profileSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    // 10. ユーザーサブコレクション削除 (dailyRecords, counseling, profileHistory)
    const userDoc = db.collection('users').doc(userId);
    
    // dailyRecords サブコレクション
    const dailyRecordsSnapshot = await userDoc.collection('dailyRecords').get();
    dailyRecordsSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    // counseling サブコレクション
    const userCounselingSnapshot = await userDoc.collection('counseling').get();
    userCounselingSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    // profileHistory サブコレクション
    const userProfileHistorySnapshot = await userDoc.collection('profileHistory').get();
    userProfileHistorySnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    // 11. ユーザーステート削除
    const userStateRef = db.collection('userStates').doc(userId);
    batch.delete(userStateRef);

    // バッチ実行
    await batch.commit();

    console.log(`✅ ユーザーデータ削除完了: ${userId}`);

    return NextResponse.json({
      success: true,
      message: 'ユーザーデータが完全に削除されました',
      deletedCollections: [
        'users', 'payments', 'usage_tracking', 'meals', 
        'weight', 'exercises', 'feedback', 'counseling', 'profile_history',
        'users/[userId]/dailyRecords', 'users/[userId]/counseling', 
        'users/[userId]/profileHistory', 'userStates'
      ]
    });

  } catch (error) {
    console.error('❌ データ削除エラー:', error);
    return NextResponse.json(
      { error: 'データ削除に失敗しました' },
      { status: 500 }
    );
  }
}