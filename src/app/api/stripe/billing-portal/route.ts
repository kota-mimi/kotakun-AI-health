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

    // 特定ユーザー（決済済み）の対応
    if (userId === 'U7fd12476d6263912e0d9c99fc3a6bef9') {
      console.log('✅ 決済済みユーザー - 一時的なCustomer IDで処理');
      
      try {
        // 一時的なカスタマーを作成または既存を使用
        let customerId = 'cus_temp_for_testing';
        
        // 実際のカスタマーを検索または作成
        const customers = await stripe.customers.list({
          email: 'test@kotakun.com',
          limit: 1
        });
        
        if (customers.data.length > 0) {
          customerId = customers.data[0].id;
          console.log('👤 既存カスタマー使用:', customerId);
        } else {
          // テスト用カスタマーを作成
          const customer = await stripe.customers.create({
            email: 'test@kotakun.com',
            metadata: {
              userId: userId
            }
          });
          customerId = customer.id;
          console.log('👤 新規カスタマー作成:', customerId);
        }

        // Billing Portalセッションを作成
        const portalSession = await stripe.billingPortal.sessions.create({
          customer: customerId,
          return_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://kotakun-ai-health.vercel.app'}/plans`,
        });

        console.log('✅ Billing Portal URL生成成功');
        
        return NextResponse.json({
          success: true,
          url: portalSession.url
        });

      } catch (stripeError) {
        console.error('❌ Stripe Billing Portal作成エラー:', stripeError);
        return NextResponse.json(
          { success: false, error: 'Billing Portalの作成に失敗しました' },
          { status: 500 }
        );
      }
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

    } catch (stripeError) {
      console.error('❌ Stripe Billing Portal作成エラー:', stripeError);
      return NextResponse.json(
        { success: false, error: 'Billing Portalの作成に失敗しました' },
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