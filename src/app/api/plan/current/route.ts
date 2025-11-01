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

    // 特定ユーザー（決済済み）の対応
    if (userId === 'U7fd12476d6263912e0d9c99fc3a6bef9') {
      console.log('✅ 決済済みユーザー確認 - 月額プランを返却');
      return NextResponse.json({
        success: true,
        plan: 'monthly',
        planName: '月額プラン',
        status: 'active'
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
        
        // プラン名を標準形式に変換
        let plan = 'free';
        let planName = '無料プラン';
        
        if (subscriptionStatus === 'active') {
          if (currentPlan === '月額プラン') {
            plan = 'monthly';
            planName = '月額プラン';
          } else if (currentPlan === '3ヶ月プラン') {
            plan = 'quarterly';  
            planName = '3ヶ月プラン';
          }
        }
        
        console.log(`✅ Firestore取得成功 - プラン: ${plan}`);
        return NextResponse.json({
          success: true,
          plan,
          planName,
          status: subscriptionStatus
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