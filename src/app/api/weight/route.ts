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

    // 体重または体脂肪のいずれかが必要
    if (!weight && !bodyFat) {
      return NextResponse.json(
        { error: '体重または体脂肪率のいずれかを入力してください' },
        { status: 400 }
      );
    }

    const firestoreService = new FirestoreService();
    
    // 記録データを準備
    const recordData: any = {};
    if (weight !== undefined && weight !== null && weight !== '') {
      recordData.weight = parseFloat(weight);
    }
    if (bodyFat !== undefined && bodyFat !== null && bodyFat !== '') {
      recordData.bodyFat = parseFloat(bodyFat);
    }
    if (note && note.trim()) {
      recordData.note = note.trim();
    }

    const targetDate = date || new Date().toISOString().split('T')[0];

    // 体重が記録されている場合はupdateWeightを使用
    if (recordData.weight) {
      await firestoreService.updateWeight(lineUserId, targetDate, recordData.weight);
    }

    // 体脂肪やその他のデータがある場合は追加で保存
    if (recordData.bodyFat || recordData.note) {
      // 既存のその日のデータを取得
      let existingData = {};
      try {
        existingData = await firestoreService.getDailyRecord(lineUserId, targetDate) || {};
      } catch (error) {
        // エラーの場合は空データから開始
        existingData = {};
      }

      // データをマージして保存
      const mergedData = { ...existingData, ...recordData };
      await firestoreService.saveDailyRecord(lineUserId, targetDate, mergedData);
    }

    return NextResponse.json({ 
      success: true,
      message: '記録が保存されました'
    });

  } catch (error) {
    console.error('記録保存エラー:', error);
    return NextResponse.json(
      { error: '記録の保存に失敗しました' },
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
        // 体重または体脂肪のデータがあれば含める
        if (dailyRecord && (dailyRecord.weight || dailyRecord.bodyFat)) {
          weightData.push({
            date: dateStr,
            weight: dailyRecord.weight || 0, // 体重がない場合は0
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