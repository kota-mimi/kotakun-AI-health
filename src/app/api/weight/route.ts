import { NextRequest, NextResponse } from 'next/server';
import { FirestoreService } from '@/services/firestoreService';

export async function POST(request: NextRequest) {
  try {
    const { lineUserId, date, weight, bodyFat, note } = await request.json();

    if (!lineUserId) {
      return NextResponse.json(
        { error: 'lineUserId is required' },
        { status: 400 }
      );
    }

    const firestoreService = new FirestoreService();
    
    // 体重データを保存
    const weightData: any = { weight };
    if (bodyFat !== undefined && bodyFat !== null && bodyFat !== '') {
      weightData.bodyFat = parseFloat(bodyFat);
    }
    if (note && note.trim()) {
      weightData.note = note.trim();
    }

    await firestoreService.updateWeight(lineUserId, date || new Date().toISOString().split('T')[0], weight);

    return NextResponse.json({ 
      success: true,
      message: '体重記録が保存されました'
    });

  } catch (error) {
    console.error('体重記録保存エラー:', error);
    return NextResponse.json(
      { error: '体重記録の保存に失敗しました' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lineUserId = searchParams.get('lineUserId');
    const period = searchParams.get('period') || 'month';

    if (!lineUserId) {
      return NextResponse.json(
        { error: 'lineUserId is required' },
        { status: 400 }
      );
    }

    const firestoreService = new FirestoreService();
    
    // 期間に応じてデータを取得
    const now = new Date();
    const periodDays = {
      week: 7,
      month: 30,
      '6months': 180,
      year: 365,
      all: 9999
    };

    const days = periodDays[period as keyof typeof periodDays] || 30;
    const weightData = [];

    // 指定期間のデータを取得
    for (let i = 0; i < days; i++) {
      const date = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000));
      const dateStr = date.toISOString().split('T')[0];
      
      try {
        const dailyRecord = await firestoreService.getDailyRecord(lineUserId, dateStr);
        if (dailyRecord && dailyRecord.weight) {
          weightData.push({
            date: dateStr,
            weight: dailyRecord.weight,
            bodyFat: dailyRecord.bodyFat,
            note: dailyRecord.note
          });
        }
      } catch (error) {
        // エラーは無視して続行
        continue;
      }
    }

    // 日付順にソート（古い順）
    weightData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return NextResponse.json({
      success: true,
      data: weightData
    });

  } catch (error) {
    console.error('体重データ取得エラー:', error);
    return NextResponse.json(
      { error: '体重データの取得に失敗しました' },
      { status: 500 }
    );
  }
}