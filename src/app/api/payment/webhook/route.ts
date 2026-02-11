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
            .orderBy('createdAt', 'desc')
            .limit(5)
            .get();
          
          if (!pendingTrialsSnapshot.empty) {
            // 決済時刻と近いpendingTrialを探す（時刻マッチング）
            const matchingTrial = pendingTrialsSnapshot.docs.find(doc => {
              const data = doc.data();
              const timeDiff = Math.abs(session.created * 1000 - data.createdAt.toMillis());
              return timeDiff < 300000; // 5分以内
            });
            
            if (matchingTrial) {
              const trialData = matchingTrial.data();
              userId = trialData.userId;
              
              // pending trial を completed に更新
              await matchingTrial.ref.update({ status: 'completed' });
              console.log(`💰 時刻マッチでuserID特定: ${userId} (時差: ${Math.abs(session.created * 1000 - trialData.createdAt.toMillis())}ms)`);
            } else {
              // フォールバック: 最新を使用
              const latestTrial = pendingTrialsSnapshot.docs[0];
              const trialData = latestTrial.data();
              userId = trialData.userId;
              await latestTrial.ref.update({ status: 'completed' });
              console.log(`💰 フォールバック: 最新のuserID使用: ${userId}`);
            }
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
      
      if (planId === 'annual') {
        currentPlan = '年間プラン';
      } else if (planId === 'biannual') {
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
        hasUsedTrial: subscription.trial_end ? true : false, // トライアルありの場合は履歴を記録
        updatedAt: new Date(),
      });

      console.log('✅ User updated:', userId, isTrialActive ? 'trial' : 'active');
    }

    // サブスクリプション更新（期間更新など）
    if (event.type === 'invoice.payment_succeeded') {
      const invoice = event.data.object as Stripe.Invoice;
      
      console.log('🔍 Invoice subscription check:', invoice.subscription);
      console.log('🔍 Invoice parent:', invoice.parent);
      
      let subscriptionId = invoice.subscription;
      
      // parentからsubscriptionを取得する場合
      if (!subscriptionId && invoice.parent?.type === 'subscription_details') {
        subscriptionId = invoice.parent.subscription_details.subscription;
        console.log('📋 Subscription from parent:', subscriptionId);
      }
      
      if (!subscriptionId) {
        console.log('⚠️ subscription ID not found in invoice');
        return NextResponse.json({ received: true });
      }
      
      const subscription = await stripe.subscriptions.retrieve(subscriptionId as string);
      
      // subscription.metadataからuserIdを取得（決済時に設定）
      let userId = subscription.metadata?.userId;
      
      // PaymentLinksの場合はmetadataがないので、pendingTrialsから取得
      if (!userId) {
        try {
          console.log('🔍 PaymentLinks用: pendingTrialsからuserID検索...');
          const pendingTrialsSnapshot = await admin.firestore()
            .collection('pendingTrials')
            .orderBy('createdAt', 'desc')
            .limit(5)
            .get();
          
          if (!pendingTrialsSnapshot.empty) {
            const latestTrial = pendingTrialsSnapshot.docs[0];
            const trialData = latestTrial.data();
            userId = trialData.userId;
            
            await latestTrial.ref.update({ status: 'completed' });
            console.log(`💰 userId found from pending trial: ${userId}`);
          }
        } catch (err) {
          console.error('Failed to retrieve pending trials:', err);
        }
      }
      
      if (userId) {
        // 価格IDから正しいプラン名を判定
        const priceId = subscription.items.data[0]?.price?.id;
        let currentPlan = '月額プラン'; // デフォルト
        
        console.log(`🔍 価格ID確認: ${priceId}`);
        console.log(`🔍 本番年間ID: ${process.env.STRIPE_ANNUAL_PRICE_ID}`);
        console.log(`🔍 本番半年ID: ${process.env.STRIPE_BIANNUAL_PRICE_ID}`);
        console.log(`🔍 本番月額ID: ${process.env.STRIPE_MONTHLY_PRICE_ID}`);
        
        if (priceId === process.env.STRIPE_ANNUAL_PRICE_ID) {
          currentPlan = '年間プラン';
          console.log('✅ 年間プラン認識');
        } else if (priceId === process.env.STRIPE_BIANNUAL_PRICE_ID) {
          currentPlan = '半年プラン';
          console.log('✅ 半年プラン認識');
        } else if (priceId === process.env.STRIPE_MONTHLY_PRICE_ID) {
          currentPlan = '月額プラン';
          console.log('✅ 月額プラン認識');
        } else {
          console.log('⚠️ 価格IDが一致しません。デフォルト月額プランを適用');
        }
        
        console.log(`💰 決済成功 - プラン: ${currentPlan}, priceId: ${priceId}`);
        
        // トライアル期間中かチェック
        const isTrialActive = subscription.trial_end && subscription.trial_end > Date.now() / 1000;
        const statusToSet = isTrialActive ? 'trial' : 'active';
        
        console.log('🔍 invoice.payment_succeeded - トライアル判定:', {
          trialEnd: subscription.trial_end,
          currentTime: Date.now() / 1000,
          isTrialActive,
          statusToSet
        });

        await admin.firestore().collection('users').doc(userId).update({
          subscriptionStatus: statusToSet,
          currentPlan: currentPlan,
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          stripeSubscriptionId: subscription.id,
          trialEndDate: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
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