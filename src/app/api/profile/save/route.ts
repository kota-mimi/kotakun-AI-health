import { NextRequest, NextResponse } from 'next/server';
import { admin } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const { lineUserId, profileData } = await request.json();

    if (!lineUserId || !profileData) {
      return NextResponse.json(
        { error: 'LINE User IDまたはプロフィールデータが必要です' },
        { status: 400 }
      );
    }

      lineUserId, 
      hasProfileData: !!profileData,
      changeDate: profileData.changeDate 
    });

    const adminDb = admin.firestore();
    
    // プロフィール履歴をサブコレクションに保存
    const changeDate = profileData.changeDate || new Date().toISOString().split('T')[0];
    const profileHistoryRef = adminDb
      .collection('users')
      .doc(lineUserId)
      .collection('profileHistory')
      .doc(changeDate);
    
    const historyData = {
      ...profileData,
      changeDate,
      updatedAt: new Date(),
      updatedAtJST: new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }),
      createdAt: new Date(),
      createdAtJST: new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }),
      timestamp: Date.now()
    };
    
    
    await profileHistoryRef.set(historyData);
    
    // メインユーザードキュメントの最終更新日も更新
    const userRef = adminDb.collection('users').doc(lineUserId);
    await userRef.set({
      lastProfileUpdate: new Date(),
      lastProfileUpdateJST: new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })
    }, { merge: true });
    

    return NextResponse.json({
      success: true,
      message: 'プロフィール履歴を保存しました',
      data: {
        changeDate,
        targetCalories: profileData.targetCalories,
        macros: profileData.macros
      }
    });

  } catch (error: any) {
    console.error('❌ プロフィール履歴保存エラー:', error);
    console.error('❌ エラー詳細:', error.message);
    console.error('❌ エラースタック:', error.stack);
    
    return NextResponse.json(
      { 
        error: 'プロフィール履歴の保存に失敗しました',
        details: error.message 
      },
      { status: 500 }
    );
  }
}