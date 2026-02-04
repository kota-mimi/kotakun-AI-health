import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

export async function POST(request: NextRequest) {
  try {
    const { planId, userId, priceId, includeTrial = false } = await request.json();

    if (!planId || !userId || !priceId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    console.log('💳 Creating payment session:', { planId, userId, includeTrial });

    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{
        price: priceId,
        quantity: 1,
      }],
      metadata: {
        userId,
        planId,
      },
      success_url: `https://healthy-kun.com/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `https://healthy-kun.com/payment/cancel`,
      locale: 'ja',
    };

    // トライアル期間を追加（新規ユーザーのみ）
    if (includeTrial) {
      sessionConfig.subscription_data = {
        trial_period_days: 3,
      };
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      url: session.url,
      planId,
      userId
    });

  } catch (error) {
    console.error('❌ Payment session error:', error);
    return NextResponse.json(
      { error: 'Failed to create payment session' },
      { status: 500 }
    );
  }
}