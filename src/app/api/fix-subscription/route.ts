import { NextRequest, NextResponse } from 'next/server';
import { admin } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const { userId, planName } = await request.json();
    
    if (!userId || !planName) {
      return NextResponse.json(
        { success: false, error: 'userId and planName are required' },
        { status: 400 }
      );
    }

    const userRef = admin.firestore().collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (userDoc.exists) {
      await userRef.update({
        subscriptionStatus: 'active',
        currentPlan: planName,
        subscriptionStartDate: new Date(),
        updatedAt: new Date()
      });
      console.log('✅ 既存ユーザーのサブスクリプション情報を更新');
    } else {
      await userRef.set({
        userId: userId,
        subscriptionStatus: 'active',
        currentPlan: planName,
        subscriptionStartDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log('✅ 新規ユーザードキュメントを作成');
    }

    return NextResponse.json({
      success: true,
      message: 'Subscription fixed successfully'
    });

  } catch (error) {
    console.error('❌ Fix subscription error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fix subscription' },
      { status: 500 }
    );
  }
}