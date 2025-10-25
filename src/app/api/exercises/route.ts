import { NextRequest, NextResponse } from 'next/server';
import { admin } from '@/lib/firebase-admin';

// 運動記録を追加
export async function POST(request: NextRequest) {
  try {
    const { lineUserId, date, exercise } = await request.json();


    if (!lineUserId || !date || !exercise) {
      return NextResponse.json(
        { error: '必要なパラメータが不足しています' },
        { status: 400 }
      );
    }

    const adminDb = admin.firestore();
    
    // 日次記録を取得または作成
    const recordRef = adminDb.collection('users').doc(lineUserId).collection('dailyRecords').doc(date);
    const recordDoc = await recordRef.get();
    
    if (recordDoc.exists) {
      // 既存記録に追加
      const existingData = recordDoc.data();
      const exercises = existingData?.exercises || [];
      
      await recordRef.update({
        exercises: [...exercises, exercise],
        updatedAt: new Date()
      });
    } else {
      // 新規記録作成
      await recordRef.set({
        date,
        exercises: [exercise],
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }


    return NextResponse.json({ 
      success: true, 
      exerciseId: exercise.id 
    });

  } catch (error) {
    console.error('❌ 運動データ追加エラー:', error);
    return NextResponse.json(
      { error: '運動データの追加に失敗しました' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lineUserId = searchParams.get('lineUserId');
    const date = searchParams.get('date');
    
    if (!lineUserId) {
      return NextResponse.json({ error: 'lineUserId is required' }, { status: 400 });
    }


    let adminDb;
    try {
      adminDb = admin.firestore();
      if (!adminDb) {
        throw new Error('Firestore not available');
      }
    } catch (error) {
      console.error('❌ Firestore初期化エラー:', error);
      return NextResponse.json({
        success: true,
        data: []
      });
    }
    
    if (date) {
      // 特定の日付のデータを取得（Admin SDK）
      const recordRef = adminDb.collection('users').doc(lineUserId).collection('dailyRecords').doc(date);
      const recordDoc = await recordRef.get();
      const dailyRecord = recordDoc.exists ? recordDoc.data() : null;
      
      
      const exercises = dailyRecord?.exercises || [];
      
      
      // 各exerciseのtimestampをログ出力
      exercises.forEach((exercise, index) => {
      });
      
      return NextResponse.json({
        success: true,
        data: exercises
      });
    } else {
      // 最近30日分のデータを取得（Admin SDK）
      const allExercises: any[] = [];
      
      for (let i = 0; i < 30; i++) {
        const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' });
        const recordRef = adminDb.collection('users').doc(lineUserId).collection('dailyRecords').doc(date);
        const recordDoc = await recordRef.get();
        
        if (recordDoc.exists) {
          const record = recordDoc.data();
          if (record && record.exercises && record.exercises.length > 0) {
            record.exercises.forEach((exercise: any) => {
              allExercises.push({
                ...exercise,
                date: record.date || date
              });
            });
          }
        }
      }
      
      
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


    if (!lineUserId || !date || !exerciseId || !updates) {
      return NextResponse.json(
        { error: '必要なパラメータが不足しています' },
        { status: 400 }
      );
    }

    const adminDb = admin.firestore();
    
    // 日次記録を取得（Admin SDK）
    const recordRef = adminDb.collection('users').doc(lineUserId).collection('dailyRecords').doc(date);
    const recordDoc = await recordRef.get();
    const dailyRecord = recordDoc.exists ? recordDoc.data() : null;
    
    
    if (!dailyRecord || !dailyRecord.exercises) {
      return NextResponse.json({ error: '運動記録が見つかりません' }, { status: 404 });
    }

    // 対象の運動を更新
    const updatedExercises = dailyRecord.exercises.map((exercise: Record<string, unknown>) => 
      exercise.id === exerciseId ? { ...exercise, ...updates } : exercise
    );

    // Firestoreに保存（Admin SDK）
    await recordRef.update({
      exercises: updatedExercises,
      updatedAt: new Date()
    });


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


    if (!lineUserId || !date || !exerciseId) {
      return NextResponse.json(
        { error: '必要なパラメータが不足しています' },
        { status: 400 }
      );
    }

    const adminDb = admin.firestore();
    
    // 日次記録を取得（Admin SDK）
    const recordRef = adminDb.collection('users').doc(lineUserId).collection('dailyRecords').doc(date);
    const recordDoc = await recordRef.get();
    const dailyRecord = recordDoc.exists ? recordDoc.data() : null;
    
    
    if (!dailyRecord || !dailyRecord.exercises) {
      return NextResponse.json({ error: '運動記録が見つかりません' }, { status: 404 });
    }

    // 対象の運動を削除
    const filteredExercises = dailyRecord.exercises.filter((exercise: Record<string, unknown>) => 
      exercise.id !== exerciseId
    );

    // Firestoreに保存（Admin SDK）
    await recordRef.update({
      exercises: filteredExercises,
      updatedAt: new Date()
    });


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