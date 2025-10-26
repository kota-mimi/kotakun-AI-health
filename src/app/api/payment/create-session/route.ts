import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

export async function POST(request: NextRequest) {
  try {
    const { planId, userId, successUrl, cancelUrl, priceId, amount } = await request.json();

    // バリデーション
    if (!planId || !userId || !priceId || !amount) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Stripe Checkout Session作成
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      metadata: {
        userId,
        planId,
      },
      success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
      automatic_tax: { enabled: false },
      billing_address_collection: 'auto',
      locale: 'ja',
      allow_promotion_codes: true,
    });

    console.log('Stripe payment session created:', {
      sessionId: session.id,
      planId,
      userId
    });

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
      planId,
      amount: session.amount_total,
      currency: session.currency,
      userId
    });

  } catch (error) {
    console.error('Error creating payment session:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// TODO: Stripe有効化時のコード例
/*
export async function POST(request: NextRequest) {
  try {
    const { planId, userId, successUrl, cancelUrl, priceId } = await request.json();

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      metadata: {
        userId,
        planId,
      },
      success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
      automatic_tax: { enabled: true },
      billing_address_collection: 'required',
      locale: 'ja',
    });

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
      planId,
      amount: session.amount_total,
      currency: session.currency,
      userId
    });

  } catch (error) {
    console.error('Stripe error:', error);
    return NextResponse.json(
      { error: 'Payment processing failed' },
      { status: 500 }
    );
  }
}
*/