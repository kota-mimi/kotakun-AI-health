import { NextRequest, NextResponse } from 'next/server';
import { admin } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const { lineUserId, date } = await request.json();

    if (!lineUserId) {
      return NextResponse.json(
        { error: 'LINE User ID が必要です' },
        { status: 400 }
      );
    }

    const adminDb = admin.firestore();
    const targetDate = date || new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' }); // YYYY-MM-DD (日本時間)


    // 指定日のフィードバックデータを取得（Admin SDK使用）
    const recordRef = adminDb.collection('users').doc(lineUserId).collection('dailyRecords').doc(targetDate);
    const recordDoc = await recordRef.get();
    const dailyRecord = recordDoc.exists ? recordDoc.data() : null;

    if (!dailyRecord || !dailyRecord.feedback) {
      return NextResponse.json({
        success: true,
        data: null
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        date: targetDate,
        feedback: dailyRecord.feedback,
        createdAt: dailyRecord.feedbackCreatedAt || null
      }
    });

  } catch (error) {
    console.error('フィードバック取得エラー:', error);
    return NextResponse.json(
      { error: 'フィードバックの取得に失敗しました' },
      { status: 500 }
    );
  }
}