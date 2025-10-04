import { NextRequest, NextResponse } from 'next/server';
import { admin } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const { lineUserId } = await request.json();

    if (!lineUserId) {
      return NextResponse.json(
        { error: 'LINE User IDが必要です' },
        { status: 400 }
      );
    }

    console.log('🔍 カウンセリング状態確認開始:', { lineUserId });
    
    const adminDb = admin.firestore();
    
    // カウンセリング結果を取得
    const counselingRef = adminDb.collection('users').doc(lineUserId).collection('counseling').doc('result');
    const counselingDoc = await counselingRef.get();
    const counselingResult = counselingDoc.exists ? counselingDoc.data() : null;
    
    // ユーザー情報を取得
    const userRef = adminDb.collection('users').doc(lineUserId);
    const userDoc = await userRef.get();
    const user = userDoc.exists ? userDoc.data() : null;
    
    console.log('🔍 取得結果:', { 
      hasCounseling: !!counselingResult, 
      hasUser: !!user,
      hasProfile: !!user?.profile 
    });

    return NextResponse.json({
      hasCompletedCounseling: !!counselingResult,
      hasProfile: !!user?.profile,
      user: user,
      counselingResult: counselingResult
    });

  } catch (error: any) {
    console.error('カウンセリング状態確認エラー:', error);
    return NextResponse.json(
      { error: error.message || '状態確認に失敗しました' },
      { status: 500 }
    );
  }
}