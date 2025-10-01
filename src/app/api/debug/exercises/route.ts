import { NextRequest, NextResponse } from 'next/server';
import { FirestoreService } from '@/services/firestoreService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lineUserId = searchParams.get('lineUserId');
    const date = searchParams.get('date');
    
    if (!lineUserId || !date) {
      return NextResponse.json({ error: 'lineUserId and date are required' }, { status: 400 });
    }

    console.log('デバッグAPI: 運動データ取得開始', { lineUserId, date });

    const firestoreService = new FirestoreService();
    const dailyRecord = await firestoreService.getDailyRecord(lineUserId, date);
    
    console.log('デバッグAPI: 取得したデイリーレコード', dailyRecord);

    if (dailyRecord) {
      const exercises = dailyRecord.exercise || [];
      console.log('デバッグAPI: 運動データ', exercises);
      
      return NextResponse.json({
        success: true,
        data: {
          dailyRecord,
          exercises,
          hasExercises: exercises.length > 0
        }
      });
    } else {
      return NextResponse.json({
        success: true,
        data: {
          dailyRecord: null,
          exercises: [],
          hasExercises: false
        }
      });
    }

  } catch (error) {
    console.error('デバッグAPI: エラー', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}