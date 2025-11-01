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

    console.log(`🔄 プラン解約処理開始 - ユーザーID: ${userId}`);

    // Firestoreでユーザーのプラン情報を無料プランに更新
    const userRef = admin.firestore().collection('users').doc(userId);
    
    await userRef.set({
      userId: userId,
      subscriptionStatus: 'cancelled',
      currentPlan: null,
      cancelledAt: new Date(),
      updatedAt: new Date()
    }, { merge: true });

    console.log('✅ プラン解約完了');

    return NextResponse.json({
      success: true,
      message: 'プランを解約しました'
    });

  } catch (error) {
    console.error('❌ プラン解約エラー:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'プラン解約に失敗しました' 
      },
      { status: 500 }
    );
  }
}