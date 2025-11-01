import { NextRequest, NextResponse } from 'next/server';
import { admin } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    // まずusersコレクションから現在のプラン情報を取得
    let currentPlan = 'free';
    try {
      const userRef = admin.firestore().collection('users').doc(userId);
      const userDoc = await userRef.get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        if (userData?.currentPlan) {
          currentPlan = userData.currentPlan;
          console.log('✅ Current plan from users collection:', currentPlan);
        }
      }
    } catch (error) {
      console.log('⚠️ Failed to fetch user plan, falling back to payment history');
    }

    // Firestoreから支払い履歴を取得（Admin SDK）
    const paymentsRef = admin.firestore().collection('payments');
    const snapshot = await paymentsRef
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();

    const payments = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        planName: data.planName,
        amount: data.amount,
        currency: data.currency || 'JPY',
        status: data.status,
        stripeSessionId: data.stripeSessionId,
        date: data.createdAt?.toDate?.()?.toLocaleDateString('ja-JP') || data.createdAt,
        timestamp: data.createdAt
      };
    });

    return NextResponse.json({
      success: true,
      currentPlan, // 現在のプラン情報を追加
      payments
    });

  } catch (error) {
    console.error('❌ Payment history API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch payment history' },
      { status: 500 }
    );
  }
}