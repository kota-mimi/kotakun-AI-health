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

    const db = admin.firestore();
    
    // ユーザードキュメントを削除（無料ユーザーにリセット）
    await db.collection('users').doc(userId).delete();
    console.log(`✅ User ${userId} reset to free plan`);

    // 支払い履歴も削除
    const paymentsRef = db.collection('payments');
    const snapshot = await paymentsRef.where('userId', '==', userId).get();
    
    const batch = db.batch();
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();
    console.log(`✅ Payment history cleared for ${userId}`);

    return NextResponse.json({
      success: true,
      message: `User ${userId} has been reset to free plan`
    });

  } catch (error) {
    console.error('❌ Reset user error:', error);
    return NextResponse.json(
      { error: 'Failed to reset user' },
      { status: 500 }
    );
  }
}