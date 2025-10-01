import { NextRequest, NextResponse } from 'next/server';
import { FirestoreService } from '@/services/firestoreService';
import admin from 'firebase-admin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lineUserId = searchParams.get('lineUserId');
    const date = searchParams.get('date');
    
    if (!lineUserId) {
      return NextResponse.json({ error: 'lineUserId is required' }, { status: 400 });
    }

    console.log('運動API: データ取得開始', { lineUserId, date });

    const firestoreService = new FirestoreService();
    
    if (date) {
      // 特定の日付のデータを取得
      console.log('🔍 API: getDailyRecord呼び出し前:', { lineUserId, date });
      const dailyRecord = await firestoreService.getDailyRecord(lineUserId, date);
      console.log('🔍 API: getDailyRecord結果:', { 
        hasRecord: !!dailyRecord, 
        hasExercises: !!dailyRecord?.exercises,
        hasExercise: !!dailyRecord?.exercise,
        exercisesLength: dailyRecord?.exercises?.length || 0,
        exerciseLength: dailyRecord?.exercise?.length || 0,
        allKeys: dailyRecord ? Object.keys(dailyRecord) : []
      });
      
      const exercises = dailyRecord?.exercises || [];
      
      console.log('運動API: 特定日付のデータ', { date, exercises });
      
      return NextResponse.json({
        success: true,
        data: exercises
      });
    } else {
      // 最近30日分のデータを取得
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const records = await firestoreService.getDailyRecordsRange(lineUserId, startDate, endDate);
      const allExercises: any[] = [];
      
      records.forEach((record: any) => {
        if (record.exercises && record.exercises.length > 0) {
          record.exercises.forEach((exercise: any) => {
            allExercises.push({
              ...exercise,
              date: record.date
            });
          });
        }
      });
      
      console.log('運動API: 30日分のデータ', { allExercises: allExercises.length });
      
      return NextResponse.json({
        success: true,
        data: allExercises
      });
    }

  } catch (error) {
    console.error('運動API: エラー', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

// 運動記録を更新
export async function PUT(request: NextRequest) {
  try {
    const { lineUserId, date, exerciseId, updates } = await request.json();

    console.log('🔄 運動データ更新API:', { exerciseId, lineUserId, date, updates });

    if (!lineUserId || !date || !exerciseId || !updates) {
      return NextResponse.json(
        { error: '必要なパラメータが不足しています' },
        { status: 400 }
      );
    }

    const firestoreService = new FirestoreService();
    
    // 日次記録を取得
    const dailyRecord = await firestoreService.getDailyRecord(lineUserId, date);
    console.log('🔍 PUT dailyRecord:', dailyRecord);
    console.log('🔍 PUT dailyRecord.exercises:', dailyRecord?.exercises);
    
    if (!dailyRecord || !dailyRecord.exercises) {
      console.log('🔍 PUT データが見つかりません:', { dailyRecord: !!dailyRecord, exercises: !!dailyRecord?.exercises });
      return NextResponse.json({ error: '運動記録が見つかりません' }, { status: 404 });
    }

    // 対象の運動を更新
    const updatedExercises = dailyRecord.exercises.map((exercise: Record<string, unknown>) => 
      exercise.id === exerciseId ? { ...exercise, ...updates } : exercise
    );

    // Firestoreに保存
    await firestoreService.saveDailyRecord(lineUserId, date, {
      ...dailyRecord,
      exercises: updatedExercises
    });

    console.log('✅ 運動データ更新完了:', exerciseId);

    return NextResponse.json({ 
      success: true, 
      exerciseId,
      updates 
    });

  } catch (error) {
    console.error('❌ 運動データ更新エラー:', error);
    return NextResponse.json(
      { error: '運動データの更新に失敗しました' },
      { status: 500 }
    );
  }
}

// 運動記録を削除
export async function DELETE(request: NextRequest) {
  try {
    const { lineUserId, date, exerciseId } = await request.json();

    console.log('🗑️ 運動データ削除API:', { exerciseId, lineUserId, date });

    if (!lineUserId || !date || !exerciseId) {
      return NextResponse.json(
        { error: '必要なパラメータが不足しています' },
        { status: 400 }
      );
    }

    const firestoreService = new FirestoreService();
    
    // 日次記録を取得
    const dailyRecord = await firestoreService.getDailyRecord(lineUserId, date);
    console.log('🔍 DELETE dailyRecord:', dailyRecord);
    console.log('🔍 DELETE dailyRecord.exercises:', dailyRecord?.exercises);
    
    if (!dailyRecord || !dailyRecord.exercises) {
      console.log('🔍 DELETE データが見つかりません:', { dailyRecord: !!dailyRecord, exercises: !!dailyRecord?.exercises });
      return NextResponse.json({ error: '運動記録が見つかりません' }, { status: 404 });
    }

    // 対象の運動を削除
    const filteredExercises = dailyRecord.exercises.filter((exercise: Record<string, unknown>) => 
      exercise.id !== exerciseId
    );

    // Firestoreに保存
    await firestoreService.saveDailyRecord(lineUserId, date, {
      ...dailyRecord,
      exercises: filteredExercises
    });

    console.log('✅ 運動データ削除完了:', exerciseId);

    return NextResponse.json({ 
      success: true, 
      exerciseId 
    });

  } catch (error) {
    console.error('❌ 運動データ削除エラー:', error);
    return NextResponse.json(
      { error: '運動データの削除に失敗しました' },
      { status: 500 }
    );
  }
}