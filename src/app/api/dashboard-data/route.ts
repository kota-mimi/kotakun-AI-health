import { NextRequest, NextResponse } from 'next/server';
import { admin } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lineUserId = searchParams.get('lineUserId');
    const date = searchParams.get('date'); // YYYY-MM-DD format

    if (!lineUserId) {
      return NextResponse.json({ error: 'lineUserId is required' }, { status: 400 });
    }

    console.log('🚀 統合ダッシュボードデータ取得開始:', { lineUserId, date });
    const adminDb = admin.firestore();
    
    // 🎯 1回のFirebase接続で全データを並列取得
    const [counselingData, mealData, weightData, feedbackData] = await Promise.all([
      // カウンセリングデータ取得
      getCounselingData(adminDb, lineUserId),
      
      // 食事データ取得（月単位）
      getMealData(adminDb, lineUserId, date),
      
      // 体重データ取得（月単位）
      getWeightData(adminDb, lineUserId, date),
      
      // フィードバックデータ取得
      getFeedbackData(adminDb, lineUserId, date)
    ]);


    return NextResponse.json({
      success: true,
      data: {
        counseling: counselingData,
        meals: mealData,
        weight: weightData,
        feedback: feedbackData,
        fetchedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ 統合ダッシュボードデータ取得エラー:', error);
    return NextResponse.json(
      { error: 'データの取得に失敗しました' },
      { status: 500 }
    );
  }
}

// カウンセリングデータ取得
async function getCounselingData(adminDb: any, lineUserId: string) {
  try {
    const counselingRef = adminDb.collection('users').doc(lineUserId).collection('counseling').doc('result');
    const doc = await counselingRef.get();
    
    if (doc.exists) {
      return doc.data();
    }
    return null;
  } catch (error) {
    console.error('カウンセリングデータ取得エラー:', error);
    return null;
  }
}

// 食事データ取得（最適化：指定日のみ）
async function getMealData(adminDb: any, lineUserId: string, date?: string) {
  try {
    const targetDate = date ? new Date(date) : new Date();
    const targetDateStr = targetDate.toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' });
    
    console.log('📅 食事データ最適取得:', { targetDate: targetDateStr });
    
    // 🚀 最適化：指定日の食事のみ取得
    const mealsRef = adminDb
      .collection('users')
      .doc(lineUserId)
      .collection('meals')
      .where('date', '==', targetDateStr)
      .orderBy('timestamp', 'desc');
    
    const snapshot = await mealsRef.get();
    const meals: any[] = [];
    
    snapshot.forEach((doc: any) => {
      meals.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return meals;
    
  } catch (error) {
    console.error('食事データ取得エラー:', error);
    return [];
  }
}

// 体重データ取得（最適化：必要最小限のみ）- dailyRecordsから効率的に取得
async function getWeightData(adminDb: any, lineUserId: string, date?: string) {
  try {
    const targetDate = date ? new Date(date) : new Date();
    const targetDateStr = targetDate.toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' });
    
    // 前日の日付を計算
    const previousDate = new Date(targetDate);
    previousDate.setDate(previousDate.getDate() - 1);
    const previousDateStr = previousDate.toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' });
    
    console.log('⚖️ 体重データ最適取得:', { targetDate: targetDateStr, previousDate: previousDateStr });
    
    // 🚀 最適化：今日と前日の2件のみ取得
    const [todayDoc, yesterdayDoc] = await Promise.all([
      adminDb.collection('users').doc(lineUserId).collection('dailyRecords').doc(targetDateStr).get(),
      adminDb.collection('users').doc(lineUserId).collection('dailyRecords').doc(previousDateStr).get()
    ]);
    
    const weights: any[] = [];
    
    // 今日のデータ
    if (todayDoc.exists) {
      const dailyRecord = todayDoc.data();
      if (dailyRecord && dailyRecord.weight && dailyRecord.weight > 0) {
        weights.push({
          date: targetDateStr,
          weight: dailyRecord.weight,
          note: dailyRecord.note
        });
      }
    }
    
    // 前日のデータ
    if (yesterdayDoc.exists) {
      const dailyRecord = yesterdayDoc.data();
      if (dailyRecord && dailyRecord.weight && dailyRecord.weight > 0) {
        weights.push({
          date: previousDateStr,
          weight: dailyRecord.weight,
          note: dailyRecord.note
        });
      }
    }
    
    // 日付順にソート（新しい順）
    weights.sort((a, b) => b.date.localeCompare(a.date));
    
    return weights;
    
  } catch (error) {
    console.error('体重データ取得エラー:', error);
    return [];
  }
}

// フィードバックデータ取得（最適化：指定日のみ）
async function getFeedbackData(adminDb: any, lineUserId: string, date?: string) {
  try {
    const targetDate = date ? new Date(date) : new Date();
    const targetDateStr = targetDate.toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' });
    
    console.log('💭 フィードバックデータ最適取得:', { targetDate: targetDateStr });
    
    // 🚀 最適化：指定日のフィードバックのみ取得
    const feedbackRef = adminDb
      .collection('users')
      .doc(lineUserId)
      .collection('feedback')
      .where('date', '==', targetDateStr)
      .orderBy('createdAt', 'desc');
    
    const snapshot = await feedbackRef.get();
    const feedback: any[] = [];
    
    snapshot.forEach((doc: any) => {
      feedback.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return feedback;
    
  } catch (error) {
    console.error('フィードバックデータ取得エラー:', error);
    return [];
  }
}