import { NextRequest, NextResponse } from 'next/server';
import { FirestoreService } from '@/services/firestoreService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lineUserId = searchParams.get('lineUserId');

    if (!lineUserId) {
      return NextResponse.json(
        { error: 'LINE User IDが必要です' },
        { status: 400 }
      );
    }

    const firestoreService = new FirestoreService();
    
    // カウンセリング結果を取得
    const counselingResult = await firestoreService.getCounselingResult(lineUserId);
    const user = await firestoreService.getUser(lineUserId);

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