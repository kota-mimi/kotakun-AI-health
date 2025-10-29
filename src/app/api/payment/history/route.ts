import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';

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

    // Firestoreから支払い履歴を取得
    const paymentsRef = collection(db, 'payments');
    const q = query(
      paymentsRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);

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