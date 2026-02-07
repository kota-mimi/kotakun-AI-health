import { NextRequest, NextResponse } from 'next/server';
import { admin } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    console.log(`🔍 ユーザーデータ確認: ${userId}`);

    const userDoc = await admin.firestore().collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      return NextResponse.json({
        success: true,
        exists: false,
        message: 'ユーザーデータが存在しません（新規ユーザー）'
      });
    }

    const userData = userDoc.data();
    
    return NextResponse.json({
      success: true,
      exists: true,
      userData: {
        subscriptionStatus: userData?.subscriptionStatus,
        currentPlan: userData?.currentPlan,
        stripeSubscriptionId: userData?.stripeSubscriptionId,
        stripeCustomerId: userData?.stripeCustomerId,
        currentPeriodEnd: userData?.currentPeriodEnd,
        trialEndDate: userData?.trialEndDate,
        hasUsedTrial: userData?.hasUsedTrial,
        createdAt: userData?.createdAt,
        updatedAt: userData?.updatedAt,
      }
    });

  } catch (error) {
    console.error('❌ ユーザーデータ確認エラー:', error);
    return NextResponse.json({ 
      error: 'Check failed', 
      details: error.message 
    }, { status: 500 });
  }
}