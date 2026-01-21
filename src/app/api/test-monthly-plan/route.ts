import { NextRequest, NextResponse } from 'next/server';
import { admin } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const db = admin.firestore();
    
    // 1ヶ月後の日付を計算
    const currentPeriodEnd = new Date();
    currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);
    
    // 月額プランのアクティブユーザーデータを作成
    const monthlyUserData = {
      lineUserId: userId,
      subscriptionStatus: 'active',
      currentPlan: '月額プラン',
      currentPeriodEnd: currentPeriodEnd,
      stripeSubscriptionId: 'sub_test_monthly_dev',
      hasCompletedCounseling: true,
      profile: {
        name: '開発者',
        age: 30,
        gender: 'other',
        height: 170,
        weight: 65,
        activityLevel: 'moderate',
        goals: [{
          type: 'fitness_improve',
          targetValue: 65
        }]
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      updatedAtJST: new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }),
    };
    
    // ユーザープロファイルを作成
    const userRef = db.collection('users').doc(userId);
    await userRef.set(monthlyUserData, { merge: true });

    console.log(`✅ 月額プランユーザー作成完了: ${userId}, 期限: ${currentPeriodEnd.toISOString()}`);

    return NextResponse.json({
      success: true,
      message: `Monthly plan user created for ${userId}`,
      currentPeriodEnd: currentPeriodEnd.toISOString(),
      data: monthlyUserData
    });

  } catch (error) {
    console.error('❌ Create monthly plan user error:', error);
    return NextResponse.json(
      { error: 'Failed to create monthly plan user' },
      { status: 500 }
    );
  }
}