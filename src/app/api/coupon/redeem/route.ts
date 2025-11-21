import { NextRequest, NextResponse } from 'next/server';
import { admin } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

// クーポンタイプの定義
const COUPON_TYPES = {
  'CF600-1M': { months: 1, planName: '1ヶ月プラン（クラファン特典）' },
  'CF1500-3M': { months: 3, planName: '3ヶ月プラン（クラファン特典）' },
  'CF3000-6M': { months: 6, planName: '6ヶ月プラン（クラファン特典）' },
  'CF15000-LT': { months: -1, planName: '永久利用プラン（クラファン特典）' }, // -1は永続を表す
};

export async function POST(request: NextRequest) {
  try {
    const { userId, couponCode } = await request.json();

    if (!userId || !couponCode) {
      return NextResponse.json(
        { success: false, error: 'ユーザーIDとクーポンコードが必要です' },
        { status: 400 }
      );
    }

    console.log('🎟️ クーポン適用処理開始:', { userId, couponCode });

    // クーポンコードの形式を検証 (例: CF600-1M-001)
    const couponPattern = /^(CF\d+-(1M|3M|6M|LT))-(\d+)$/;
    const match = couponCode.match(couponPattern);
    
    if (!match) {
      return NextResponse.json(
        { success: false, error: '無効なクーポンコード形式です' },
        { status: 400 }
      );
    }

    const [, couponType, , couponNumber] = match;
    
    // クーポンタイプが有効かチェック
    if (!COUPON_TYPES[couponType as keyof typeof COUPON_TYPES]) {
      return NextResponse.json(
        { success: false, error: '無効なクーポンタイプです' },
        { status: 400 }
      );
    }

    const db = admin.firestore();

    // クーポンが使用済みかチェック
    const couponRef = db.collection('crowdfund_coupons').doc(couponCode);
    const couponDoc = await couponRef.get();

    if (couponDoc.exists) {
      const couponData = couponDoc.data();
      if (couponData?.used) {
        return NextResponse.json(
          { success: false, error: 'このクーポンは既に使用済みです' },
          { status: 400 }
        );
      }
    } else {
      // 新しいクーポンの場合、データベースに記録
      await couponRef.set({
        code: couponCode,
        type: couponType,
        used: false,
        createdAt: FieldValue.serverTimestamp(),
      });
    }

    // クーポン情報を取得
    const couponInfo = COUPON_TYPES[couponType as keyof typeof COUPON_TYPES];

    // ユーザーのプランを更新
    const userRef = db.collection('users').doc(userId);
    
    let updateData: any = {
      subscriptionStatus: 'active',
      currentPlan: couponInfo.planName,
      subscriptionStartDate: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      couponUsed: couponCode, // クーポン使用履歴
    };

    // 期間の設定
    if (couponInfo.months === -1) {
      // 永久利用プランの場合
      updateData.subscriptionStatus = 'lifetime';
      updateData.currentPeriodEnd = null; // 永続の場合は期限なし
    } else {
      // 期間限定プランの場合
      const currentDate = new Date();
      const endDate = new Date(currentDate.getTime() + couponInfo.months * 30 * 24 * 60 * 60 * 1000);
      updateData.currentPeriodEnd = endDate;
      updateData.currentPeriodStart = currentDate;
    }

    // ユーザー情報を更新
    await userRef.update(updateData);

    // クーポンを使用済みに設定
    await couponRef.update({
      used: true,
      usedBy: userId,
      usedAt: FieldValue.serverTimestamp(),
    });

    console.log('✅ クーポン適用完了:', {
      userId,
      couponCode,
      planName: couponInfo.planName,
      months: couponInfo.months
    });

    return NextResponse.json({
      success: true,
      planName: couponInfo.planName,
      months: couponInfo.months,
      message: couponInfo.months === -1 
        ? '永久利用プランが適用されました' 
        : `${couponInfo.months}ヶ月プランが適用されました`
    });

  } catch (error) {
    console.error('❌ クーポン適用エラー:', error);
    return NextResponse.json(
      { success: false, error: 'クーポンの適用でエラーが発生しました' },
      { status: 500 }
    );
  }
}