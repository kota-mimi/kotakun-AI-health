import { NextRequest, NextResponse } from 'next/server';
// import Stripe from 'stripe';

// TODO: Stripeを有効にする際のコード
// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
//   apiVersion: '2023-10-16',
// });

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

    // TODO: Stripe Checkout Session作成
    // const session = await stripe.checkout.sessions.create({
    //   mode: 'subscription',
    //   payment_method_types: ['card'],
    //   line_items: [
    //     {
    //       price: priceId,
    //       quantity: 1,
    //     },
    //   ],
    //   metadata: {
    //     userId,
    //     planId,
    //   },
    //   success_url: successUrl,
    //   cancel_url: cancelUrl,
    //   customer_email: userEmail, // TODO: ユーザー情報から取得
    // });

    // 現在はモック実装
    const mockSession = {
      sessionId: `cs_mock_${Date.now()}`,
      planId,
      amount,
      currency: 'jpy',
      userId,
      url: `${successUrl}?session_id=cs_mock_${Date.now()}` // モック用URL
    };

    console.log('Payment session created:', mockSession);

    return NextResponse.json(mockSession);

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