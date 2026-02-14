import { NextResponse } from 'next/server';
import { admin } from '@/lib/firebase-admin';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

export async function GET() {
  try {
    const userId = 'U7fd12476d6263912e0d9c99fc3a6bef9';
    console.log('🚨 緊急調査: 不正なプラン変更', userId);
    
    const db = admin.firestore();
    
    // 1. 現在のユーザーデータ
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.exists ? userDoc.data() : null;
    
    // 2. プラン変更履歴（直近10件）
    const planHistoryRef = db.collection('users').doc(userId).collection('planHistory');
    const planHistory = await planHistoryRef.orderBy('changedAt', 'desc').limit(10).get();
    
    const planHistoryData = planHistory.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      changedAt: doc.data().changedAt?.toDate?.()?.toISOString() || doc.data().changedAt
    }));
    
    // 3. 直近のwebhookイベント（過去7日間）
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const webhookEvents = await db
      .collection('webhook_events')
      .where('userId', '==', userId)
      .where('timestamp', '>=', oneWeekAgo)
      .orderBy('timestamp', 'desc')
      .get();
    
    const webhookData = webhookEvents.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate?.()?.toISOString() || doc.data().timestamp
    }));
    
    // 4. Stripeから直接サブスクリプション情報を取得
    let stripeSubscriptions = [];
    try {
      const customers = await stripe.customers.search({
        query: `metadata['userId']:'${userId}'`
      });
      
      if (customers.data.length > 0) {
        const customer = customers.data[0];
        const subs = await stripe.subscriptions.list({
          customer: customer.id,
          limit: 10
        });
        
        stripeSubscriptions = subs.data.map(sub => ({
          id: sub.id,
          status: sub.status,
          current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
          current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
          plan_amount: sub.items.data[0]?.price?.unit_amount,
          plan_currency: sub.items.data[0]?.price?.currency,
          plan_interval: sub.items.data[0]?.price?.recurring?.interval,
          price_id: sub.items.data[0]?.price?.id,
          created: new Date(sub.created * 1000).toISOString()
        }));
      }
    } catch (stripeError) {
      console.error('Stripe調査エラー:', stripeError);
    }
    
    // 5. 今日の日付
    const today = new Date().toISOString();
    
    return NextResponse.json({
      success: true,
      investigation: {
        userId,
        investigationTime: today,
        currentUserData: {
          currentPlan: userData?.currentPlan,
          subscriptionStatus: userData?.subscriptionStatus,
          trialEndDate: userData?.trialEndDate?.toDate?.()?.toISOString() || userData?.trialEndDate,
          currentPeriodEnd: userData?.currentPeriodEnd?.toDate?.()?.toISOString() || userData?.currentPeriodEnd,
          stripeCustomerId: userData?.stripeCustomerId,
          subscriptionId: userData?.subscriptionId
        },
        planHistory: planHistoryData,
        recentWebhookEvents: webhookData,
        stripeSubscriptions: stripeSubscriptions,
        priceIds: {
          monthly: process.env.STRIPE_MONTHLY_PRICE_ID,
          biannual: process.env.STRIPE_BIANNUAL_PRICE_ID,
          annual: process.env.STRIPE_ANNUAL_PRICE_ID
        }
      }
    });
    
  } catch (error: any) {
    console.error('緊急調査エラー:', error);
    return NextResponse.json({
      error: 'Investigation failed',
      details: error.message
    }, { status: 500 });
  }
}