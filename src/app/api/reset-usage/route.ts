import { NextRequest, NextResponse } from 'next/server';
import { admin } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const db = admin.firestore();
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD形式
    
    console.log('🔄 使用回数トラッキングリセット開始...');
    console.log('📅 対象日:', today);
    console.log('👤 ユーザーID:', userId);
    
    // 今日の使用回数データを取得してから削除
    const usageRef = db.collection('usage_tracking')
      .doc(userId)
      .collection('daily')
      .doc(today);
    
    const usageDoc = await usageRef.get();
    let beforeData = null;
    
    if (usageDoc.exists) {
      beforeData = usageDoc.data();
      console.log('📊 削除前の使用回数:', beforeData);
      await usageRef.delete();
      console.log('✅ 使用回数データを削除しました');
    } else {
      console.log('ℹ️ 使用回数データは存在しませんでした');
    }
    
    // リセット後の確認
    const checkUsageRef = db.collection('usage_tracking')
      .doc(userId)
      .collection('daily')
      .doc(today);
    
    const checkDoc = await checkUsageRef.get();
    const afterExists = checkDoc.exists;
    const afterData = afterExists ? checkDoc.data() : null;
    
    return NextResponse.json({
      success: true,
      message: `Usage tracking reset completed for ${userId}`,
      details: {
        date: today,
        userId,
        beforeData,
        afterExists,
        afterData
      }
    });

  } catch (error) {
    console.error('❌ Usage reset error:', error);
    return NextResponse.json(
      { error: 'Failed to reset usage tracking' },
      { status: 500 }
    );
  }
}