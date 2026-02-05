import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();
    
    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    console.log(`🔥 完全リセット開始: ${userId}`);

    try {
      const { admin } = await import('@/lib/firebase-admin');
      
      // 全てのコレクションから完全削除
      const userDocId = `firebase_${userId}`;
      
      // users コレクション
      await admin.firestore().collection('users').doc(userDocId).delete();
      await admin.firestore().collection('users').doc(userId).delete();
      
      // pendingTrials コレクション
      const pendingQuery = await admin.firestore()
        .collection('pendingTrials')
        .where('userId', '==', userId)
        .get();
      
      const deletePromises = pendingQuery.docs.map(doc => doc.ref.delete());
      await Promise.all(deletePromises);

      console.log(`✅ 完全リセット完了: ${userId}`);

      return NextResponse.json({ 
        success: true, 
        message: `${userId} を完全に新規状態にしました`,
        deletedRecords: deletePromises.length + 2
      });

    } catch (error) {
      console.error('❌ Reset error:', error);
      return NextResponse.json({ 
        error: 'Reset failed', 
        details: error.message 
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ Complete reset error:', error);
    return NextResponse.json({ error: 'Reset failed' }, { status: 500 });
  }
}