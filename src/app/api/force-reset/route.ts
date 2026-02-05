import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();
    
    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    console.log(`🔥 強制リセット開始: ${userId}`);

    try {
      const { admin } = await import('@/lib/firebase-admin');
      
      // Firestoreから完全削除
      const userRef = admin.firestore().collection('users').doc(`firebase_${userId}`);
      await userRef.delete();
      console.log(`🗑️ ユーザーデータ完全削除: firebase_${userId}`);

      // pendingTrialsも削除
      const pendingQuery = await admin.firestore()
        .collection('pendingTrials')
        .where('userId', '==', userId)
        .get();
      
      const deletePromises = pendingQuery.docs.map(doc => doc.ref.delete());
      await Promise.all(deletePromises);

      console.log(`✅ 強制リセット完了: ${userId}`);

      return NextResponse.json({ 
        success: true, 
        message: `${userId} を完全にリセットしました`,
        deletedRecords: deletePromises.length + 1
      });

    } catch (error) {
      console.error('❌ Reset error:', error);
      return NextResponse.json({ 
        error: 'Reset failed', 
        details: error.message 
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ Force reset error:', error);
    return NextResponse.json({ error: 'Reset failed' }, { status: 500 });
  }
}