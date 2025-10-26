import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

export async function GET(request: NextRequest) {
  try {
    // 環境変数チェック
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Stripe configuration missing' },
        { status: 500 }
      );
    }
    
    // Stripe初期化（関数内で実行）
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-11-20.acacia',
    });
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Stripe Checkout Sessionの詳細を取得
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items', 'customer', 'subscription']
    });

    if (session.payment_status !== 'paid') {
      return NextResponse.json(
        { error: 'Payment not completed' },
        { status: 400 }
      );
    }

    // プラン名を取得
    const planMapping: { [key: string]: string } = {
      [process.env.STRIPE_MONTHLY_PRICE_ID!]: '月額プラン',
      [process.env.STRIPE_QUARTERLY_PRICE_ID!]: '3ヶ月プラン',
      [process.env.STRIPE_BIANNUAL_PRICE_ID!]: '半年プラン',
    };

    const lineItem = session.line_items?.data[0];
    const priceId = lineItem?.price?.id;
    const planName = priceId ? planMapping[priceId] : '不明なプラン';

    // TODO: ここでユーザーのプラン情報をデータベースに保存
    const userId = session.metadata?.userId;
    const planId = session.metadata?.planId;

    console.log('Payment verified:', {
      sessionId,
      userId,
      planId,
      planName,
      amount: session.amount_total,
      currency: session.currency,
      subscriptionId: session.subscription
    });

    return NextResponse.json({
      success: true,
      sessionId,
      userId,
      planId,
      planName,
      amount: session.amount_total,
      currency: session.currency,
      subscriptionId: session.subscription,
      customerEmail: session.customer_details?.email
    });

  } catch (error) {
    console.error('Payment verification error:', error);
    return NextResponse.json(
      { error: 'Payment verification failed' },
      { status: 500 }
    );
  }
}