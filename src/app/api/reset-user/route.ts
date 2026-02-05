import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();
    
    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    console.log(`🔄 ユーザー完全リセット開始: ${userId}`);

    try {
      const { admin } = await import('@/lib/firebase-admin');
      
      // ユーザーを新規状態にリセット
      const resetData = {
        userId,
        subscriptionStatus: 'inactive',
        currentPlan: 'free',
        hasUsedTrial: false, // トライアル利用履歴をクリア
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await admin.firestore().collection('users').doc(userId).set(resetData);
      
      console.log('✅ ユーザー完全リセット完了:', resetData);

      return NextResponse.json({ 
        success: true, 
        message: 'ユーザーを新規状態にリセットしました',
        resetData
      });
    } catch (firebaseError) {
      console.error('❌ Firebase error:', firebaseError);
      return NextResponse.json({ 
        error: 'Firebase error', 
        details: firebaseError.message 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('❌ Reset user error:', error);
    return NextResponse.json({ error: 'Reset failed' }, { status: 500 });
  }
}