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

    console.log(`🔄 プラン解約処理開始 - ユーザーID: ${userId}`);

    // Firestoreからユーザー情報を取得
    const userRef = admin.firestore().collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      return NextResponse.json(
        { success: false, error: 'ユーザーが見つかりません' },
        { status: 404 }
      );
    }

    const userData = userDoc.data();
    const stripeSubscriptionId = userData?.stripeSubscriptionId;

    if (stripeSubscriptionId) {
      try {
        // Stripeで期間終了時解約を設定
        console.log('📞 Stripe解約API呼び出し:', stripeSubscriptionId);
        const subscription = await stripe.subscriptions.update(stripeSubscriptionId, {
          cancel_at_period_end: true,
        });

        console.log('✅ Stripe解約設定完了 - 期間終了日:', new Date(subscription.current_period_end * 1000));

        // Firestoreでユーザー情報を更新
        await userRef.update({
          subscriptionStatus: 'cancel_at_period_end',
          cancelledAt: new Date(),
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          updatedAt: new Date()
        });

        return NextResponse.json({
          success: true,
          message: 'プランを解約しました（現在の期間終了まで利用可能）',
          currentPeriodEnd: new Date(subscription.current_period_end * 1000)
        });

      } catch (stripeError) {
        console.error('❌ Stripe解約エラー:', stripeError);
        
        // Stripeエラーでもローカル解約は実行
        await userRef.update({
          subscriptionStatus: 'cancelled',
          cancelledAt: new Date(),
          updatedAt: new Date()
        });

        return NextResponse.json({
          success: true,
          message: 'プランを解約しました（Stripe連携は手動確認が必要）'
        });
      }
    } else {
      // Stripe IDがない場合は即座解約
      await userRef.update({
        subscriptionStatus: 'cancelled',
        currentPlan: null,
        cancelledAt: new Date(),
        updatedAt: new Date()
      });

      return NextResponse.json({
        success: true,
        message: 'プランを解約しました'
      });
    }

  } catch (error) {
    console.error('❌ プラン解約エラー:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'プラン解約に失敗しました' 
      },
      { status: 500 }
    );
  }
}