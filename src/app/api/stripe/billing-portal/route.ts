import { NextRequest, NextResponse } from 'next/server';
import { admin } from '@/lib/firebase-admin';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    console.log(`🔍 Billing Portal作成開始 - ユーザーID: ${userId}`);

    // 特定ユーザー（決済済み）の対応 - 一時的にエラー回避
    if (userId === 'U7fd12476d6263912e0d9c99fc3a6bef9') {
      console.log('⚠️ Billing Portal未設定のため一時的にエラーを返す');
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Stripe Billing Portalの設定が必要です。Stripeダッシュボードで Customer Portal を有効化してください。',
          needsSetup: true
        },
        { status: 400 }
      );
    }

    // Firestoreからユーザー情報とStripe Customer IDを取得
    const userRef = admin.firestore().collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      return NextResponse.json(
        { success: false, error: 'ユーザー情報が見つかりません' },
        { status: 404 }
      );
    }

    const userData = userDoc.data();
    const stripeCustomerId = userData?.stripeCustomerId;

    if (!stripeCustomerId) {
      return NextResponse.json(
        { success: false, error: 'Stripe Customer IDが見つかりません。まず有料プランに登録してください。' },
        { status: 400 }
      );
    }

    try {
      // Billing Portalセッションを作成
      const portalSession = await stripe.billingPortal.sessions.create({
        customer: stripeCustomerId,
        return_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://kotakun-ai-health.vercel.app'}/plans`,
      });

      console.log('✅ Billing Portal URL生成成功');
      
      return NextResponse.json({
        success: true,
        url: portalSession.url
      });

    } catch (stripeError: any) {
      console.error('❌ Stripe Billing Portal作成エラー:', stripeError);
      return NextResponse.json(
        { 
          success: false, 
          error: `Billing Portalの作成に失敗しました: ${stripeError?.message || 'Unknown error'}`,
          stripeError: stripeError?.code || 'unknown'
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('❌ Billing Portal API エラー:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Billing Portalの作成に失敗しました' 
      },
      { status: 500 }
    );
  }
}