import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // 本番環境での環境変数確認（セキュリティに注意）
    const envVars = {
      monthly_price_id: process.env.STRIPE_MONTHLY_PRICE_ID || 'NOT_SET',
      biannual_price_id: process.env.STRIPE_BIANNUAL_PRICE_ID || 'NOT_SET',
      secret_key_prefix: process.env.STRIPE_SECRET_KEY?.substring(0, 10) + '...' || 'NOT_SET',
    };
    
    // payment.tsから実際に使用される価格IDも確認
    const { PLANS } = await import('@/lib/payment');
    const monthlyPlan = PLANS.find(p => p.id === 'monthly');
    const biannualPlan = PLANS.find(p => p.id === 'biannual');
    
    return NextResponse.json({
      success: true,
      environment_variables: envVars,
      payment_config: {
        monthly: {
          id: monthlyPlan?.id,
          stripePriceId: monthlyPlan?.stripePriceId,
        },
        biannual: {
          id: biannualPlan?.id,
          stripePriceId: biannualPlan?.stripePriceId,
        }
      }
    });

  } catch (error) {
    console.error('❌ Debug env error:', error);
    return NextResponse.json({ 
      error: 'Debug failed', 
      details: error.message 
    }, { status: 500 });
  }
}