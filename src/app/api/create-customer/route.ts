import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

export async function POST(request: NextRequest) {
  try {
    const { planType, userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    // プランごとの価格IDを設定
    let priceId = '';
    if (planType === 'half-year') {
      priceId = process.env.STRIPE_BIANNUAL_PRICE_ID!;
    } else if (planType === 'monthly') {
      priceId = process.env.STRIPE_MONTHLY_PRICE_ID!;
    } else {
      return NextResponse.json({ error: 'Invalid plan type' }, { status: 400 });
    }

    // Checkout Sessionを作成（3日間トライアル付き）
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/trial`,
      client_reference_id: userId,
      metadata: {
        userId: userId,
        planId: planType,
      },
      subscription_data: {
        trial_period_days: 3,
        metadata: {
          userId: userId,
        },
      },
    });

    console.log(`✅ Checkout session created for user: ${userId}, plan: ${planType}`);

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('❌ Checkout session creation failed:', error);
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
}