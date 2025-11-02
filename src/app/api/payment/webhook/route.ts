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

    // 新規決済完了イベントを処理
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
      
      // サブスクリプション情報を取得
      let subscriptionInfo = null;
      if (session.subscription) {
        try {
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
          subscriptionInfo = {
            id: subscription.id,
            status: subscription.status,
            current_period_start: subscription.current_period_start,
            current_period_end: subscription.current_period_end,
          };
          console.log('📅 Subscription info:', subscriptionInfo);
        } catch (subError) {
          console.error('❌ Failed to retrieve subscription:', subError);
        }
      }
      
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
        
        try {
          // ユーザードキュメントの存在確認
          const userDoc = await userRef.get();
          
          if (userDoc.exists) {
            // 既存ユーザーの場合は更新
            const updateData: any = {
              subscriptionStatus: 'active',
              currentPlan: planName,
              subscriptionStartDate: new Date(),
              updatedAt: new Date()
            };
            
            // サブスクリプション情報があれば追加
            if (subscriptionInfo) {
              updateData.stripeSubscriptionId = subscriptionInfo.id;
              updateData.currentPeriodEnd = new Date(subscriptionInfo.current_period_end * 1000);
              updateData.currentPeriodStart = new Date(subscriptionInfo.current_period_start * 1000);
            }
            
            await userRef.update(updateData);
            console.log('✅ User subscription status updated (existing user)');
          } else {
            // ユーザードキュメントが存在しない場合は新規作成
            const createData: any = {
              userId: paymentRecord.userId,
              subscriptionStatus: 'active',
              currentPlan: planName,
              subscriptionStartDate: new Date(),
              createdAt: new Date(),
              updatedAt: new Date()
            };
            
            // サブスクリプション情報があれば追加
            if (subscriptionInfo) {
              createData.stripeSubscriptionId = subscriptionInfo.id;
              createData.currentPeriodEnd = new Date(subscriptionInfo.current_period_end * 1000);
              createData.currentPeriodStart = new Date(subscriptionInfo.current_period_start * 1000);
            }
            
            await userRef.set(createData);
            console.log('✅ User subscription status created (new user)');
          }
        } catch (error) {
          console.error('❌ Failed to update user subscription:', error);
        }
      }
    }

    // サブスクリプション更新イベントを処理
    if (event.type === 'customer.subscription.updated') {
      const subscription = event.data.object as Stripe.Subscription;
      
      console.log('🔄 Processing subscription update:', {
        subscriptionId: subscription.id,
        customerId: subscription.customer,
        status: subscription.status,
        currentPeriodEnd: subscription.current_period_end
      });

      // メタデータまたは顧客IDからユーザーIDを取得
      let userId: string | null = null;
      
      // 1. サブスクリプションメタデータから取得を試行
      if (subscription.metadata?.userId) {
        userId = subscription.metadata.userId;
      } else {
        // 2. 顧客メタデータから取得を試行
        try {
          const customer = await stripe.customers.retrieve(subscription.customer as string);
          if (customer && !customer.deleted && customer.metadata?.userId) {
            userId = customer.metadata.userId;
          }
        } catch (error) {
          console.error('❌ Failed to retrieve customer:', error);
        }
      }

      if (!userId) {
        console.error('❌ Cannot find userId for subscription update:', subscription.id);
        return NextResponse.json({ received: true });
      }

      // プラン名を決定
      let planName = 'Unknown Plan';
      const priceId = subscription.items.data[0]?.price?.id;
      
      if (priceId === process.env.STRIPE_MONTHLY_PRICE_ID) {
        planName = '月額プラン';
      } else if (priceId === process.env.STRIPE_QUARTERLY_PRICE_ID) {
        planName = '3ヶ月プラン';
      }

      // ユーザーのサブスクリプション情報を更新
      try {
        const userRef = admin.firestore().collection('users').doc(userId);
        
        const updateData: any = {
          subscriptionStatus: subscription.status,
          currentPlan: planName,
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          currentPeriodStart: new Date(subscription.current_period_start * 1000),
          stripeSubscriptionId: subscription.id,
          updatedAt: new Date()
        };

        await userRef.update(updateData);
        console.log('✅ User subscription updated:', updateData);

        // プラン変更の記録を保存
        await admin.firestore().collection('payments').add({
          stripeSubscriptionId: subscription.id,
          stripeCustomerId: subscription.customer,
          userId,
          planName,
          priceId,
          type: 'plan_change',
          amount: subscription.items.data[0]?.price?.unit_amount ? subscription.items.data[0].price.unit_amount / 100 : 0,
          currency: subscription.currency?.toUpperCase() || 'JPY',
          status: 'completed',
          createdAt: new Date(),
          updatedAt: new Date()
        });

        console.log('✅ Plan change record saved');

      } catch (error) {
        console.error('❌ Failed to update user subscription:', error);
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