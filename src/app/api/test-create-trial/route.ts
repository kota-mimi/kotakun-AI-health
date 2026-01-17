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
    
    // 3日後の日付を計算
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + 3);
    
    // トライアルユーザーのデータを作成
    const trialUserData = {
      lineUserId: userId,
      subscriptionStatus: 'trial',
      currentPlan: '月額プラン（お試し期間中）',
      trialEndDate: trialEndDate,
      stripeSubscriptionId: `trial_${Date.now()}`, // 仮のsubscription ID
      hasCompletedCounseling: true, // 診断機能を使用可能に
      profile: {
        name: 'トライアルユーザー',
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
    await userRef.set(trialUserData, { merge: true });

    console.log(`✅ Test trial user created for ${userId}, expires: ${trialEndDate.toISOString()}`);

    return NextResponse.json({
      success: true,
      message: `Trial user created for ${userId}`,
      trialEndDate: trialEndDate.toISOString(),
      data: trialUserData
    });

  } catch (error) {
    console.error('❌ Create trial user error:', error);
    return NextResponse.json(
      { error: 'Failed to create trial user' },
      { status: 500 }
    );
  }
}