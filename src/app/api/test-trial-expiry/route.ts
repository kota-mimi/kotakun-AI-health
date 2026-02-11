import { NextResponse } from 'next/server';
import { admin } from '@/lib/firebase-admin';

export async function GET() {
  try {
    const userId = 'U7fd12476d6263912e0d9c99fc3a6bef9'; // あなたのID
    
    console.log('🔍 現在のユーザーデータ確認...');
    const userDoc = await admin.firestore().collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
    }
    
    const userData = userDoc.data();
    const currentData = {
      subscriptionStatus: userData?.subscriptionStatus,
      currentPlan: userData?.currentPlan,
      trialEndDate: userData?.trialEndDate?.toDate(),
      currentPeriodEnd: userData?.currentPeriodEnd?.toDate()
    };
    
    // トライアル期間を過去の日付に設定（1時間前）
    const pastDate = new Date();
    pastDate.setHours(pastDate.getHours() - 1);
    
    await admin.firestore().collection('users').doc(userId).update({
      trialEndDate: pastDate,
      updatedAt: new Date()
    });
    
    return NextResponse.json({
      success: true,
      message: 'トライアル終了日を過去に設定しました',
      userId,
      beforeData: currentData,
      newTrialEndDate: pastDate,
      testSteps: [
        '1. プラン管理ページにアクセス',
        '2. 「無料プラン」表示になるかチェック',
        '3. 利用制限が復活しているかチェック',
        '4. API: /api/plan/current?userId=' + userId + ' で確認'
      ]
    });

  } catch (error: any) {
    console.error('❌ テストエラー:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}