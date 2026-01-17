import { NextRequest, NextResponse } from 'next/server';
import { admin } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const { userId, createPayment } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const db = admin.firestore();
    
    if (createPayment) {
      // テスト用支払い履歴を作成
      const paymentRecord = {
        stripeSessionId: 'test_session_' + Date.now(),
        stripeCustomerId: 'test_customer',
        userId: userId,
        planName: '月額プラン',
        priceId: 'test_price',
        amount: 790,
        currency: 'JPY',
        status: 'completed',
        stripeStatus: 'paid',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await db.collection('payments').add(paymentRecord);
      console.log(`✅ Test payment created for ${userId}`);

      return NextResponse.json({
        success: true,
        message: `Test payment created for ${userId}`
      });
    } else {
      // 支払い履歴を削除
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
        message: `Payment history cleared for ${userId}`
      });
    }

  } catch (error) {
    console.error('❌ Test payment error:', error);
    return NextResponse.json(
      { error: 'Failed to manage test payment' },
      { status: 500 }
    );
  }
}