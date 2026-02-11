import { NextResponse } from 'next/server';
import { admin } from '@/lib/firebase-admin';

export async function GET() {
  try {
    const userId = 'U7fd12476d6263912e0d9c99fc3a6bef9';
    
    console.log('🔄 利用制限リセット実行:', userId);

    const db = admin.firestore();
    const today = new Date().toISOString().split('T')[0];
    
    // 今日の利用データ削除
    const todayRef = db.collection('usage_tracking').doc(userId).collection('daily').doc(today);
    const beforeDoc = await todayRef.get();
    const beforeData = beforeDoc.exists ? beforeDoc.data() : null;
    
    if (beforeDoc.exists) {
      await todayRef.delete();
    }
    
    // 全usage_tracking削除
    await db.collection('usage_tracking').doc(userId).delete();
    
    return NextResponse.json({
      success: true,
      message: '利用制限リセット完了！',
      userId,
      resetDate: today,
      beforeData,
      status: 'すべての利用制限が解除されました'
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}