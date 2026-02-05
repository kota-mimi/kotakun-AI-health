import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { userId, planType, timestamp } = await request.json();
    
    console.log(`📝 Trial intent received:`, {
      userId: userId || 'N/A',
      planType: planType || 'N/A',
      timestamp: timestamp || 'N/A'
    });

    // 開発環境では単純にログ出力のみ（Firebase認証情報不要）
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Trial intent logged (development mode)');
      return NextResponse.json({ 
        success: true, 
        message: 'Trial intent logged in development mode'
      });
    }

    // 本番環境ではFirestoreに保存
    try {
      const { admin } = await import('@/lib/firebase-admin');
      
      const trialData = {
        userId: userId || 'unknown',
        planType: planType || 'half-year',
        status: 'pending',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10分で期限切れ
      };

      if (userId) {
        await admin.firestore().collection('pendingTrials').doc(userId).set(trialData);
        console.log(`✅ Trial intent saved for user: ${userId}`);
      }
    } catch (firebaseError) {
      console.log(`⚠️ Firebase save failed, continuing: ${firebaseError}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ Trial intent save failed:', error);
    // エラーでも成功レスポンスを返す（フロントエンドの処理を止めない）
    return NextResponse.json({ success: true });
  }
}