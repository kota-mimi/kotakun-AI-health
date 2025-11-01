import { NextRequest, NextResponse } from 'next/server';
import { admin } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lineUserId = searchParams.get('lineUserId');
    const targetDate = searchParams.get('targetDate');

    if (!lineUserId) {
      return NextResponse.json(
        { error: 'LINE User IDが必要です' },
        { status: 400 }
      );
    }

    const adminDb = admin.firestore();

    if (targetDate) {
      // 指定日付の履歴を取得
      const profileHistoryRef = adminDb
        .collection('users')
        .doc(lineUserId)
        .collection('profileHistory')
        .doc(targetDate);
      
      const profileDoc = await profileHistoryRef.get();
      
      if (profileDoc.exists) {
        const data = profileDoc.data();
        return NextResponse.json({
          success: true,
          data: {
            id: profileDoc.id,
            changeDate: profileDoc.id,
            ...data
          }
        });
      }
      
      // 指定日付にない場合、その日付以前の最新プロフィールを取得
      const allProfilesRef = adminDb
        .collection('users')
        .doc(lineUserId)
        .collection('profileHistory');
      
      const querySnapshot = await allProfilesRef.get();
      
      const profiles = querySnapshot.docs.map(doc => ({
        id: doc.id,
        changeDate: doc.id, // docのIDが日付
        ...doc.data(),
      }));
      
      // 指定日付以前の履歴のみをフィルタして最新を取得
      const validProfiles = profiles.filter(profile => profile.changeDate <= targetDate);
      
      if (validProfiles.length > 0) {
        const latestValidProfile = validProfiles.sort((a, b) => b.changeDate.localeCompare(a.changeDate))[0];
        return NextResponse.json({
          success: true,
          data: latestValidProfile
        });
      }
      
      return NextResponse.json({
        success: true,
        data: null
      });
    }
    
    // 全ての履歴を取得
    const profileHistoryRef = adminDb
      .collection('users')
      .doc(lineUserId)
      .collection('profileHistory');
    
    const querySnapshot = await profileHistoryRef.get();
    
    const profiles = querySnapshot.docs.map(doc => ({
      id: doc.id,
      changeDate: doc.id,
      ...doc.data(),
    }));
    
    const sortedProfiles = profiles.sort((a, b) => b.changeDate.localeCompare(a.changeDate));
    
    return NextResponse.json({
      success: true,
      data: sortedProfiles
    });

  } catch (error: any) {
    console.error('❌ プロフィール履歴取得エラー:', error);
    
    return NextResponse.json(
      { 
        error: 'プロフィール履歴の取得に失敗しました',
        details: error.message 
      },
      { status: 500 }
    );
  }
}