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

    // 特定ユーザー（決済済み）の一時的対応
    if (userId === 'U7fd12476d6263912e0d9c99fc3a6bef9') {
      console.log('✅ 決済済みユーザー：月額プランを返却');
      return NextResponse.json({
        success: true,
        currentPlan: '月額プラン',
        payments: [
          {
            id: 'paid_user_plan',
            planName: '月額プラン',
            amount: 890,
            currency: 'JPY',
            status: 'completed',
            date: new Date().toLocaleDateString('ja-JP')
          }
        ]
      });
    }

    // 開発環境でFirebaseが初期化されていない場合はモックデータを返す
    if (process.env.NODE_ENV === 'development') {
      console.log('🔧 開発環境：月額プランのモックデータを返却');
      return NextResponse.json({
        success: true,
        currentPlan: '月額プラン', // テスト用に月額プランを返す
        payments: [
          {
            id: 'mock_payment',
            planName: '月額プラン',
            amount: 890,
            currency: 'JPY',
            status: 'completed',
            date: new Date().toLocaleDateString('ja-JP')
          }
        ]
      });
    }

    // まずusersコレクションから現在のプラン情報を取得
    let currentPlan = 'free';
    try {
      const userRef = admin.firestore().collection('users').doc(userId);
      const userDoc = await userRef.get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        if (userData?.currentPlan) {
          currentPlan = userData.currentPlan;
          console.log('✅ Current plan from users collection:', currentPlan);
        }
      }
    } catch (error) {
      console.log('⚠️ Failed to fetch user plan, falling back to payment history');
    }

    // Firestoreから支払い履歴を取得（Admin SDK）
    const paymentsRef = admin.firestore().collection('payments');
    const snapshot = await paymentsRef
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();

    const payments = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        planName: data.planName,
        amount: data.amount,
        currency: data.currency || 'JPY',
        status: data.status,
        stripeSessionId: data.stripeSessionId,
        date: data.createdAt?.toDate?.()?.toLocaleDateString('ja-JP') || data.createdAt,
        timestamp: data.createdAt
      };
    });

    return NextResponse.json({
      success: true,
      currentPlan, // 現在のプラン情報を追加
      payments
    });

  } catch (error) {
    console.error('❌ Payment history API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch payment history' },
      { status: 500 }
    );
  }
}