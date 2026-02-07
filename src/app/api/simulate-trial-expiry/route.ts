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
    
    console.log(`⏰ トライアル期間終了をシミュレート: ${userId}`);
    
    // 昨日の日付を設定（期間終了済み）
    const expiredDate = new Date();
    expiredDate.setDate(expiredDate.getDate() - 1);
    
    const userRef = db.collection('users').doc(userId);
    
    // 期間終了済みの状態に変更
    const updateData = {
      trialEndDate: expiredDate,
      subscriptionStatus: 'inactive', // 期間終了後は無料プランに戻る
      currentPlan: '無料プラン', // トライアル終了後は無料プランに戻る
      hasUsedTrial: true, // トライアル利用履歴を記録
      updatedAt: new Date(),
      updatedAtJST: new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }),
    };
    
    await userRef.update(updateData);

    console.log(`✅ トライアル期間終了シミュレート完了: ${userId}`);
    console.log(`📅 期間終了日: ${expiredDate.toISOString()}`);

    return NextResponse.json({
      success: true,
      message: `Trial expiry simulated for ${userId}`,
      expiredDate: expiredDate.toISOString(),
      newStatus: 'inactive',
      note: 'User should now experience free plan limitations'
    });

  } catch (error) {
    console.error('❌ Simulate trial expiry error:', error);
    return NextResponse.json(
      { error: 'Failed to simulate trial expiry' },
      { status: 500 }
    );
  }
}