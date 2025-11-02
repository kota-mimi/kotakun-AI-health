import { NextRequest, NextResponse } from 'next/server';
import { admin } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const { userId, plan = 'monthly' } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    console.log(`🔧 手動プラン更新 - ユーザーID: ${userId}, プラン: ${plan}`);

    // プラン名を決定
    let planName = '月額プラン';
    if (plan === 'quarterly') {
      planName = '3ヶ月プラン';
    }

    // Firestore のユーザーデータを更新
    const userRef = admin.firestore().collection('users').doc(userId);
    
    const updateData = {
      subscriptionStatus: 'active',
      currentPlan: planName,
      subscriptionStartDate: new Date(),
      currentPeriodEnd: plan === 'quarterly' 
        ? new Date(Date.now() + 92 * 24 * 60 * 60 * 1000) // 3ヶ月後（約92日）
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 1ヶ月後
      stripeSubscriptionId: 'sub_1SP1c9KMirzoVNsd6QpLRZ20', // 実際のサブスクリプションID
      updatedAt: new Date()
    };

    await userRef.update(updateData);

    console.log('✅ ユーザープラン更新完了:', updateData);

    return NextResponse.json({
      success: true,
      message: 'User plan updated successfully',
      updatedData: updateData
    });

  } catch (error) {
    console.error('❌ プラン更新エラー:', error);
    return NextResponse.json(
      { error: 'Failed to update user plan', details: error },
      { status: 500 }
    );
  }
}