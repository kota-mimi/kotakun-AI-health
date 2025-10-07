import { NextRequest, NextResponse } from 'next/server';
import { admin } from '@/lib/firebase-admin';

// 🧹 既存のprocessedEventsを一括削除する緊急清掃API
export async function DELETE(request: NextRequest) {
  try {
    console.log('🧹 processedEvents緊急清掃開始...');
    
    const db = admin.firestore();
    const collectionRef = db.collection('processedEvents');
    
    // バッチ削除で効率的に大量データを処理
    const batchSize = 500; // Firestoreの制限
    let deletedCount = 0;
    let batch = db.batch();
    let batchCount = 0;
    
    const snapshot = await collectionRef.get();
    console.log(`🔍 削除対象: ${snapshot.size}件のドキュメント`);
    
    for (const doc of snapshot.docs) {
      batch.delete(doc.ref);
      batchCount++;
      deletedCount++;
      
      // バッチサイズに達したらコミット
      if (batchCount >= batchSize) {
        await batch.commit();
        console.log(`🧹 ${batchCount}件削除完了... (累計: ${deletedCount}件)`);
        batch = db.batch(); // 新しいバッチを作成
        batchCount = 0;
      }
    }
    
    // 残りのバッチをコミット
    if (batchCount > 0) {
      await batch.commit();
      console.log(`🧹 最終バッチ ${batchCount}件削除完了`);
    }
    
    console.log(`✅ processedEvents緊急清掃完了: 合計${deletedCount}件削除`);
    
    return NextResponse.json({
      success: true,
      message: `processedEvents緊急清掃完了`,
      deletedCount: deletedCount
    });
    
  } catch (error: any) {
    console.error('❌ processedEvents清掃エラー:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'processedEvents清掃に失敗しました' 
      },
      { status: 500 }
    );
  }
}

// セキュリティ: GET でも削除実行可能（デバッグ用）
export async function GET(request: NextRequest) {
  return DELETE(request);
}