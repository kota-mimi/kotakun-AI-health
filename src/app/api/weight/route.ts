import { NextRequest, NextResponse } from 'next/server';
import { admin } from '@/lib/firebase-admin';
import { apiCache, createCacheKey } from '@/lib/cache';

export async function POST(request: NextRequest) {
  try {
    const { lineUserId, date, weight, note } = await request.json();

    if (!lineUserId) {
      return NextResponse.json(
        { error: 'lineUserId is required' },
        { status: 400 }
      );
    }

    // 体重が必要
    if (!weight) {
      return NextResponse.json(
        { error: '体重を入力してください' },
        { status: 400 }
      );
    }

    const adminDb = admin.firestore();
    
    // 記録データを準備
    const recordData: any = {};
    if (weight !== undefined && weight !== null && weight !== '') {
      recordData.weight = parseFloat(weight);
    }
    if (note && note.trim()) {
      recordData.note = note.trim();
    }

    const targetDate = date || new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' });

    // Admin SDK で直接保存
    const recordRef = adminDb.collection('users').doc(lineUserId).collection('dailyRecords').doc(targetDate);
    
    // 既存データを取得
    const existingDoc = await recordRef.get();
    const existingData = existingDoc.exists ? existingDoc.data() : {};
    
    // データをマージして保存
    const mergedData = { 
      ...existingData, 
      ...recordData,
      date: targetDate,
      lineUserId,
      updatedAt: new Date(),
      createdAt: existingData.createdAt || new Date(),
    };
    
    await recordRef.set(mergedData, { merge: true });

    // ユーザープロファイルの体重も更新（データ整合性確保）
    if (recordData.weight) {
      const userRef = adminDb.collection('users').doc(lineUserId);
      await userRef.update({
        'profile.weight': recordData.weight,
        updatedAt: new Date(),
      });
      
      // プロフィール履歴も同時更新（完全なデータ同期）
      const profileHistoryRef = adminDb.collection('users').doc(lineUserId).collection('profileHistory').doc(targetDate);
      await profileHistoryRef.set({
        weight: recordData.weight,
        changeDate: targetDate,
        updatedAt: new Date(),
      }, { merge: true });
      
      console.log('✅ プロフィール体重・履歴も同期更新:', recordData.weight);
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
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!lineUserId) {
      return NextResponse.json(
        { error: 'lineUserId is required' },
        { status: 400 }
      );
    }

    const adminDb = admin.firestore();
    
    let weightData = [];

    // 🚀 新しい範囲指定API: startDate/endDateが指定されている場合
    if (startDate && endDate) {
      console.log('📅 範囲指定で体重データを取得:', startDate, 'から', endDate);
      
      const start = new Date(startDate + 'T00:00:00.000Z');
      const end = new Date(endDate + 'T23:59:59.999Z');
      const current = new Date(start);
      
      // startDateからendDateまで1日ずつ取得
      while (current <= end) {
        const dateStr = current.toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' });
        
        try {
          const recordRef = adminDb.collection('users').doc(lineUserId).collection('dailyRecords').doc(dateStr);
          const recordDoc = await recordRef.get();
          
          if (recordDoc.exists) {
            const dailyRecord = recordDoc.data();
            if (dailyRecord && dailyRecord.weight && dailyRecord.weight > 0) {
              weightData.push({
                date: dateStr,
                weight: dailyRecord.weight,
                note: dailyRecord.note
              });
            }
          }
        } catch (error) {
          // エラーは無視して続行
        }
        
        // 次の日へ
        current.setDate(current.getDate() + 1);
      }
    } else {
      // 🔄 従来の期間指定API（後方互換性維持）
      const now = new Date();
      const periodDays = {
        week: 7,
        month: 30,
        '6months': 180,
        year: 365,
        all: 9999
      };

      const days = periodDays[period as keyof typeof periodDays] || 30;
      
      // 指定期間のデータを取得
      for (let i = 0; i < days; i++) {
        const date = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000));
        const dateStr = date.toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' });
        
        try {
          const recordRef = adminDb.collection('users').doc(lineUserId).collection('dailyRecords').doc(dateStr);
          const recordDoc = await recordRef.get();
          
          if (recordDoc.exists) {
            const dailyRecord = recordDoc.data();
            // 体重データがあれば含める
            if (dailyRecord && dailyRecord.weight) {
              // 体重が0以下の場合は除外（無効なデータとして扱う）
              const weightValue = dailyRecord.weight;
              if (weightValue && weightValue > 0) {
                weightData.push({
                  date: dateStr,
                  weight: weightValue,
                  note: dailyRecord.note
                });
              }
            }
          }
        } catch (error) {
          // エラーは無視して続行
          continue;
        }
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