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

    // Webhook署名検証を完全無効化
    try {
      event = JSON.parse(body);
      console.log('🔄 Webhook received:', event.type);
    } catch (err) {
      console.error('❌ Webhook parsing failed:', err);
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    console.log('✅ Stripe webhook:', event.type);
    console.log('📊 Full event data:', JSON.stringify(event, null, 2));
    
    if (event.type === 'invoice.payment_succeeded') {
      console.log('💰 invoice.payment_succeeded イベント開始');
    }

    // トライアル開始 or 課金開始
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      
      // ユーザーIDを取得（複数の方法で試行）
      let userId = session.metadata?.userId || session.client_reference_id;
      
      // CustomerからuserIdを取得（事前作成したCustomerの場合）
      if (!userId && session.customer) {
        try {
          const customer = await stripe.customers.retrieve(session.customer as string);
          console.log('🔍 Customer metadata:', customer.metadata);
          if (customer && !customer.deleted && customer.metadata?.userId) {
            userId = customer.metadata.userId;
            console.log(`💰 userId found in customer metadata: ${userId}`);
          } else {
            console.log('❌ No userId in customer metadata');
          }
        } catch (err) {
          console.error('Failed to retrieve customer:', err);
        }
      }

      // DBから pending trials を検索（PaymentLinks用の代替手段）
      if (!userId) {
        try {
          console.log('🔍 Searching for pending trials in DB...');
          const pendingTrialsSnapshot = await admin.firestore()
            .collection('pendingTrials')
            .where('status', '==', 'pending')
            .orderBy('createdAt', 'desc')
            .limit(10)
            .get();
          
          if (!pendingTrialsSnapshot.empty) {
            // 最新のpending trialを使用（簡単な実装）
            const latestTrial = pendingTrialsSnapshot.docs[0];
            const trialData = latestTrial.data();
            userId = trialData.userId;
            
            // pending trial を completed に更新
            await latestTrial.ref.update({ status: 'completed' });
            console.log(`💰 userId found from pending trial: ${userId}`);
          }
        } catch (err) {
          console.error('Failed to retrieve pending trials:', err);
        }
      }

      if (!userId) {
        console.error('❌ No userId found in session, customer, metadata, or pending trials');
        console.error('Session customer:', session.customer);
        console.error('Session client_reference_id:', session.client_reference_id);
        console.error('Session metadata:', session.metadata);
        return NextResponse.json({ error: 'No userId' }, { status: 400 });
      }

      console.log(`💰 checkout開始 - userId: ${userId}`);

      // サブスクリプション情報を取得
      const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
      const isTrialActive = subscription.trial_end && subscription.trial_end > Date.now() / 1000;

      // metadataからplanIdを取得してプラン名を決定
      const planId = session.metadata?.planId;
      let currentPlan = '月額プラン'; // デフォルト
      
      if (planId === 'biannual') {
        currentPlan = '半年プラン';
      } else if (planId === 'monthly') {
        currentPlan = '月額プラン';
      }
      
      console.log(`💰 checkout完了 - planId: ${planId}, プラン: ${currentPlan}`);

      await admin.firestore().collection('users').doc(userId).update({
        subscriptionStatus: isTrialActive ? 'trial' : 'active',
        currentPlan: currentPlan,
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