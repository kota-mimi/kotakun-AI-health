import { NextRequest, NextResponse } from 'next/server';
import { admin } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    console.log('🧹 重複データ清掃開始');
    const db = admin.firestore();
    
    // 全ユーザーの日次記録を取得
    const usersRef = db.collection('users');
    const userSnapshots = await usersRef.get();
    
    let totalCleaned = 0;
    
    for (const userDoc of userSnapshots.docs) {
      const userId = userDoc.id;
      const dailyRecordsRef = userDoc.ref.collection('dailyRecords');
      const dailySnapshots = await dailyRecordsRef.get();
      
      for (const dailyDoc of dailySnapshots.docs) {
        const data = dailyDoc.data();
        if (!data.meals || !Array.isArray(data.meals)) continue;
        
        // 重複を検出・削除
        const seenMeals = new Map();
        const uniqueMeals = [];
        
        for (const meal of data.meals) {
          const key = `${meal.name}_${meal.type}_${meal.time}_${meal.calories}`;
          if (!seenMeals.has(key)) {
            seenMeals.set(key, true);
            uniqueMeals.push(meal);
          } else {
            totalCleaned++;
            console.log(`🗑️ 重複削除: ${meal.name} (${meal.type})`);
          }
        }
        
        // 重複が見つかった場合のみ更新
        if (uniqueMeals.length !== data.meals.length) {
          await dailyDoc.ref.update({
            meals: uniqueMeals,
            cleanedAt: new Date(),
            cleanedDuplicates: data.meals.length - uniqueMeals.length
          });
        }
      }
    }
    
    console.log(`🧹 清掃完了: ${totalCleaned}件の重複を削除`);
    
    return NextResponse.json({
      success: true,
      message: `${totalCleaned}件の重複データを削除しました`,
      cleaned: totalCleaned
    });
    
  } catch (error: any) {
    console.error('🚨 清掃エラー:', error);
    return NextResponse.json(
      { error: error.message || '清掃に失敗しました' },
      { status: 500 }
    );
  }
}