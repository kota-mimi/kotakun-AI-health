import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { admin } from '@/lib/firebase-admin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headersList = headers();
    const signature = headersList.get('stripe-signature')!;

    let event: Stripe.Event;

    // Webhook署名検証
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (err) {
      console.error('❌ Webhook signature verification failed:', err);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    console.log('✅ Stripe webhook:', event.type);

    // トライアル開始 or 課金開始
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;

      if (!userId) {
        console.error('❌ No userId in metadata');
        return NextResponse.json({ error: 'No userId' }, { status: 400 });
      }

      // サブスクリプション情報を取得
      const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
      const isTrialActive = subscription.trial_end && subscription.trial_end > Date.now() / 1000;

      await admin.firestore().collection('users').doc(userId).update({
        subscriptionStatus: isTrialActive ? 'trial' : 'active',
        currentPlan: '月額プラン',
        stripeSubscriptionId: subscription.id,
        stripeCustomerId: session.customer,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        trialEndDate: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
        updatedAt: new Date(),
      });

      console.log('✅ User updated:', userId, isTrialActive ? 'trial' : 'active');
    }

    // サブスクリプション更新（期間更新など）
    if (event.type === 'invoice.payment_succeeded') {
      const invoice = event.data.object as Stripe.Invoice;
      
      if (!invoice.subscription) {
        console.log('⚠️ subscription ID not found in invoice');
        return NextResponse.json({ received: true });
      }
      
      const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
      
      // subscription.metadataからuserIdを取得（決済時に設定）
      const userId = subscription.metadata?.userId;
      
      if (userId) {
        // 価格IDから正しいプラン名を判定
        const priceId = subscription.items.data[0]?.price?.id;
        let currentPlan = '月額プラン'; // デフォルト
        
        if (priceId === process.env.STRIPE_BIANNUAL_PRICE_ID || priceId === 'price_1SxAFxHAuO7vhfyIs3ZQfnfi') {
          currentPlan = '半年プラン';
        } else if (priceId === process.env.STRIPE_MONTHLY_PRICE_ID || priceId === 'price_1SxAFZHAuO7vhfyIhLShYjMX') {
          currentPlan = '月額プラン';
        }
        
        console.log(`💰 決済成功 - プラン: ${currentPlan}, priceId: ${priceId}`);
        
        await admin.firestore().collection('users').doc(userId).update({
          subscriptionStatus: 'active',
          currentPlan: currentPlan,
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          stripeSubscriptionId: subscription.id,
          updatedAt: new Date(),
        });
        
        console.log('✅ Subscription renewed:', userId, currentPlan);
      }
    }

    // サブスクリプション解約
    if (event.type === 'customer.subscription.updated') {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata?.userId;

      if (userId && subscription.cancel_at_period_end) {
        await admin.firestore().collection('users').doc(userId).update({
          subscriptionStatus: 'cancel_at_period_end',
          cancelledAt: new Date(),
          updatedAt: new Date(),
        });

        console.log('✅ Subscription set to cancel:', userId);
      }
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    return NextResponse.json({ error: 'Webhook failed' }, { status: 500 });
  }
}