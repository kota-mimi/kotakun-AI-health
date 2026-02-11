import { NextRequest, NextResponse } from 'next/server';
import { admin } from '@/lib/firebase-admin';
import { pushMessage } from '@/lib/line';
import { createTrialStartFlexMessage } from '@/services/flexMessageTemplates';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    console.log('🧪 手動通知テスト開始:', userId);

    // ユーザー情報を取得
    const userDoc = await admin.firestore().collection('users').doc(userId).get();
    let userName = 'テストユーザー';
    
    if (userDoc.exists) {
      const userData = userDoc.data();
      userName = userData?.profile?.name || userData?.lineDisplayName || 'テストユーザー';
      console.log('👤 ユーザー名:', userName);
    }

    // テスト用のトライアル終了日（3日後）
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + 3);
    
    // FLEXメッセージを作成
    const flexMessage = createTrialStartFlexMessage(userName, trialEndDate, 'テスト月額プラン');
    
    // LINEメッセージを送信
    console.log('📤 手動通知送信中...', userId);
    await pushMessage(userId, [flexMessage]);
    
    console.log('✅ 手動通知送信完了:', userId);
    
    return NextResponse.json({
      success: true,
      message: '手動通知を送信しました',
      userId,
      userName,
      trialEndDate: trialEndDate.toISOString()
    });

  } catch (error: any) {
    console.error('❌ 手動通知テストエラー:', error);
    return NextResponse.json({
      error: error.message || '手動通知送信に失敗しました'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: '手動通知テスト用API - POSTでuserIdを送信してください'
  });
}