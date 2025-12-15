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

// 食事データ取得（月単位）
async function getMealData(adminDb: any, lineUserId: string, date?: string) {
  try {
    const targetDate = date ? new Date(date) : new Date();
    const year = targetDate.getFullYear();
    const month = targetDate.getMonth() + 1;
    
    // 月の開始日と終了日を計算
    const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
    const endDate = `${year}-${month.toString().padStart(2, '0')}-31`;
    
    console.log('📅 食事データ月単位取得:', { startDate, endDate });
    
    const mealsRef = adminDb
      .collection('users')
      .doc(lineUserId)
      .collection('meals')
      .where('date', '>=', startDate)
      .where('date', '<=', endDate)
      .orderBy('date', 'desc')
      .limit(100); // 月最大100件
    
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

// 体重データ取得（月単位）- dailyRecordsから効率的に取得
async function getWeightData(adminDb: any, lineUserId: string, date?: string) {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
    
    // 30日前と今日の日付を文字列で取得
    const startDate = thirtyDaysAgo.toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' });
    const endDate = now.toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' });
    
    console.log('⚖️ 体重データ効率取得:', { startDate, endDate });
    
    // 🔧 安全なクエリ: orderBy削除でインデックスエラー回避、コスト削減維持
    const dailyRecordsRef = adminDb
      .collection('users')
      .doc(lineUserId)
      .collection('dailyRecords')
      .where(adminDb.FieldPath.documentId(), '>=', startDate)
      .where(adminDb.FieldPath.documentId(), '<=', endDate)
      .limit(31); // 31日分のみ
    
    const snapshot = await dailyRecordsRef.get();
    const weights: any[] = [];
    
    snapshot.forEach((doc: any) => {
      const docId = doc.id;
      const dailyRecord = doc.data();
      
      // 体重データがあれば含める
      if (dailyRecord && dailyRecord.weight && dailyRecord.weight > 0) {
        weights.push({
          date: docId,
          weight: dailyRecord.weight,
          note: dailyRecord.note
        });
      }
    });
    
    // JavaScriptでソート（Firestoreのorder削除のため）
    weights.sort((a, b) => b.date.localeCompare(a.date));
    
    return weights;
    
  } catch (error) {
    console.error('体重データ取得エラー:', error);
    return [];
  }
}

// フィードバックデータ取得
async function getFeedbackData(adminDb: any, lineUserId: string, date?: string) {
  try {
    const targetDate = date ? new Date(date) : new Date();
    
    // 過去7日分のフィードバックを取得
    const endDate = targetDate.toISOString().split('T')[0];
    const startDate = new Date(targetDate);
    startDate.setDate(startDate.getDate() - 7);
    const startDateStr = startDate.toISOString().split('T')[0];
    
    console.log('💭 フィードバックデータ週単位取得:', { startDateStr, endDate });
    
    const feedbackRef = adminDb
      .collection('users')
      .doc(lineUserId)
      .collection('feedback')
      .where('date', '>=', startDateStr)
      .where('date', '<=', endDate)
      .orderBy('date', 'desc')
      .limit(20);
    
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