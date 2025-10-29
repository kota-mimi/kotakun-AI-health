import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { admin } from '@/lib/firebase-admin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headersList = headers();
    const signature = headersList.get('stripe-signature')!;

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('❌ Webhook signature verification failed:', err);
      return NextResponse.json(
        { error: 'Webhook signature verification failed' },
        { status: 400 }
      );
    }

    console.log('✅ Stripe webhook received:', event.type);

    // 決済完了イベントを処理
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      
      console.log('💰 Processing payment completion:', {
        sessionId: session.id,
        customerId: session.customer,
        amount: session.amount_total,
        currency: session.currency
      });

      // セッションの詳細情報を取得
      const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
      const priceId = lineItems.data[0]?.price?.id;
      
      // プラン名を決定
      let planName = 'Unknown Plan';
      if (priceId === process.env.STRIPE_MONTHLY_PRICE_ID) {
        planName = '月額プラン';
      } else if (priceId === process.env.STRIPE_QUARTERLY_PRICE_ID) {
        planName = '3ヶ月プラン';
      }

      // 支払い記録をFirestoreに保存
      const paymentRecord = {
        stripeSessionId: session.id,
        stripeCustomerId: session.customer,
        userId: session.metadata?.userId || 'unknown', // チェックアウト時にmetadataで渡す必要
        planName,
        priceId,
        amount: session.amount_total! / 100, // セントから円に変換
        currency: session.currency?.toUpperCase() || 'JPY',
        status: 'completed',
        stripeStatus: session.payment_status,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await admin.firestore().collection('payments').add(paymentRecord);
      
      console.log('✅ Payment record saved to Firestore:', paymentRecord);

      // ユーザーのサブスクリプション状態を更新
      if (paymentRecord.userId !== 'unknown') {
        const userRef = admin.firestore().collection('users').doc(paymentRecord.userId);
        await userRef.update({
          subscriptionStatus: 'active',
          currentPlan: planName,
          subscriptionStartDate: new Date(),
          updatedAt: new Date()
        });
        
        console.log('✅ User subscription status updated');
      }
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}