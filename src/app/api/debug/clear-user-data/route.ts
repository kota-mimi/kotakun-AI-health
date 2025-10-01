import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    console.log('🗑️ ユーザーデータ削除開始...');

    // すべてのコレクションを削除
    const collections = [
      'users',
      'counseling_results', 
      'user_progress',
      'meal_records',
      'exercise_records',
      'weight_records',
      'health_data'
    ];

    let deletedCount = 0;

    for (const collectionName of collections) {
      try {
        const querySnapshot = await getDocs(collection(db, collectionName));
        console.log(`📋 ${collectionName}: ${querySnapshot.size}件のドキュメントを発見`);
        
        for (const document of querySnapshot.docs) {
          await deleteDoc(doc(db, collectionName, document.id));
          deletedCount++;
        }
        
        console.log(`✅ ${collectionName}コレクション削除完了`);
      } catch (error) {
        console.log(`⚠️ ${collectionName}コレクション削除でエラー（続行）:`, error);
      }
    }

    console.log(`🎉 データ削除完了！合計 ${deletedCount} 件のドキュメントを削除しました`);

    return NextResponse.json({ 
      success: true, 
      message: `すべてのユーザーデータを削除しました (${deletedCount}件)`,
      deletedCount 
    });

  } catch (error: any) {
    console.error('❌ データ削除エラー:', error);
    return NextResponse.json({ 
      error: 'データ削除に失敗しました', 
      details: error.message 
    }, { status: 500 });
  }
}