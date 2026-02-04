import { NextRequest, NextResponse } from 'next/server';
import { admin } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    console.log(`🔍 プラン取得 - ユーザーID: ${userId}`);

    // 特定ユーザー（決済済み）の対応 - 完全に無効化
    if (false) {
      console.log('✅ 決済済みユーザー確認 - 月額プランを返却');
      
      // 現在日時から1ヶ月後を計算（仮の有効期限）
      const currentPeriodEnd = new Date();
      currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);
      
      return NextResponse.json({
        success: true,
        plan: 'monthly',
        planName: '月額プラン',
        status: 'active',
        currentPeriodEnd: currentPeriodEnd,
        stripeSubscriptionId: 'temp_subscription_id' // 一時的なID
      });
    }

    // Firestoreから現在のプラン情報を取得
    try {
      const userRef = admin.firestore().collection('users').doc(userId);
      const userDoc = await userRef.get();
      
      if (userDoc.exists) {
        const userData = userDoc.data();
        const currentPlan = userData?.currentPlan;
        const subscriptionStatus = userData?.subscriptionStatus || 'inactive';
        const currentPeriodEnd = userData?.currentPeriodEnd?.toDate?.() || null;
        const stripeSubscriptionId = userData?.stripeSubscriptionId || null;
        
        // プラン名を標準形式に変換
        let plan = 'free';
        let planName = '無料プラン';
        
        // お試し期間中の場合（3日間無制限） - cancel_at_period_endを除外
        if (subscriptionStatus === 'trial') {
          const trialEnd = userData?.trialEndDate?.toDate();
          if (trialEnd && new Date() < trialEnd) {
            console.log('🎁 お試し期間中/解約予定: 月額プラン扱い', { userId, trialEnd, status: subscriptionStatus });
            plan = 'monthly';
            planName = subscriptionStatus === 'cancel_at_period_end' 
              ? '月額プラン（お試し期間中・解約予定）'
              : '月額プラン（お試し期間中）';
            
            return NextResponse.json({
              success: true,
              plan,
              planName,
              status: subscriptionStatus,
              currentPeriodEnd: trialEnd,
              stripeSubscriptionId
            });
          }
        }
        // 永続プランの場合
        else if (subscriptionStatus === 'lifetime') {
          plan = 'lifetime';
          planName = currentPlan || '永久利用プラン';
        }
        // 通常のアクティブプランの場合
        else if (subscriptionStatus === 'active' || 
                 subscriptionStatus === 'cancel_at_period_end' ||
                 (subscriptionStatus === 'cancelled' && currentPeriodEnd && new Date() < currentPeriodEnd)) {
          
          console.log(`🔍 デバッグ - currentPlan: "${currentPlan}", stripeSubscriptionId: "${stripeSubscriptionId}"`);
          console.log(`🔍 条件チェック - (currentPlan === '月額プラン'): ${currentPlan === '月額プラン'}`);
          console.log(`🔍 条件チェック - (!currentPlan && stripeSubscriptionId): ${!currentPlan && stripeSubscriptionId}`);
          
          // stripeSubscriptionIdから期間を判定（currentPlanがnullの場合のフォールバック）
          if (currentPlan === '月額プラン' || (!currentPlan && stripeSubscriptionId)) {
            console.log(`✅ 月額プラン条件にマッチ！`);
            plan = 'monthly';
            planName = subscriptionStatus === 'cancel_at_period_end' ? '月額プラン（解約予定）' 
                     : subscriptionStatus === 'cancelled' ? '月額プラン（解約済み）'
                     : '月額プラン';
          } else if (currentPlan === '3ヶ月プラン') {
            plan = 'quarterly';  
            planName = '3ヶ月プラン';
          } else if (currentPlan === '半年プラン') {
            plan = 'biannual';
            planName = subscriptionStatus === 'cancel_at_period_end' ? '半年プラン（解約予定）' 
                     : subscriptionStatus === 'cancelled' ? '半年プラン（解約済み）'
                     : '半年プラン';
          } else if (currentPlan?.includes('1ヶ月プラン') && userData?.couponUsed?.startsWith('CF')) {
            // クーポン適用の1ヶ月プランの場合
            plan = 'crowdfund_1m';
            planName = currentPlan;
          } else if (currentPlan?.includes('3ヶ月プラン') && userData?.couponUsed?.startsWith('CF')) {
            // クーポン適用の3ヶ月プランの場合
            plan = 'crowdfund_3m';
            planName = currentPlan;
          } else if (currentPlan?.includes('6ヶ月プラン') && userData?.couponUsed?.startsWith('CF')) {
            // クーポン適用の6ヶ月プランの場合
            plan = 'crowdfund_6m';
            planName = currentPlan;
          } else if (currentPlan?.includes('永久利用プラン') && userData?.couponUsed?.startsWith('CF')) {
            // クーポン適用の永久利用プランの場合
            plan = 'crowdfund_lifetime';
            planName = currentPlan;
          }
        }
        
        console.log(`✅ Firestore取得成功 - プラン: ${plan}, ステータス: ${subscriptionStatus}, currentPlan値: "${currentPlan}"`);
        return NextResponse.json({
          success: true,
          plan,
          planName,
          status: subscriptionStatus,
          currentPeriodEnd,
          stripeSubscriptionId
        });
      } else {
        console.log('ℹ️ ユーザードキュメント未存在 - 無料プラン');
        return NextResponse.json({
          success: true,
          plan: 'free',
          planName: '無料プラン',
          status: 'inactive'
        });
      }
    } catch (firestoreError) {
      console.error('❌ Firestore取得エラー:', firestoreError);
      
      // エラー時は無料プランにフォールバック
      return NextResponse.json({
        success: true,
        plan: 'free',
        planName: '無料プラン',
        status: 'inactive'
      });
    }

  } catch (error) {
    console.error('❌ プラン取得API エラー:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch current plan' 
      },
      { status: 500 }
    );
  }
}