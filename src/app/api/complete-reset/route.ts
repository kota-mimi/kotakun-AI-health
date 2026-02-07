import { NextRequest, NextResponse } from 'next/server';
import { admin } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();
    
    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    console.log(`🔥 完全リセット開始: ${userId}`);

    const db = admin.firestore();
    
    // users コレクションから削除
    const userDocId = `firebase_${userId}`;
    await db.collection('users').doc(userDocId).delete();
    await db.collection('users').doc(userId).delete();
    
    // pendingTrials コレクション
    const pendingQuery = await db
      .collection('pendingTrials')
      .where('userId', '==', userId)
      .get();
    
    const deletePromises = pendingQuery.docs.map(doc => doc.ref.delete());
    await Promise.all(deletePromises);

    // usage_tracking コレクションも削除
    const today = new Date().toISOString().split('T')[0];
    const usageRef = db.collection('usage_tracking')
      .doc(userId)
      .collection('daily')
      .doc(today);
    await usageRef.delete();

    console.log(`✅ 完全リセット完了: ${userId}`);

    return NextResponse.json({ 
      success: true, 
      message: `${userId} を完全に新規状態にしました`,
      deletedRecords: deletePromises.length + 3
    });

  } catch (error) {
    console.error('❌ Complete reset error:', error);
    return NextResponse.json({ 
      error: 'Reset failed', 
      details: error.message 
    }, { status: 500 });
  }
}