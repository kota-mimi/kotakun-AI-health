import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { userId, planType } = await request.json();
    
    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    console.log(`💾 トライアル準備: ${userId} - ${planType}`);

    try {
      const { admin } = await import('@/lib/firebase-admin');
      
      // pendingTrialsにユーザーIDを保存（webhook用）
      await admin.firestore().collection('pendingTrials').add({
        userId,
        planType: planType || 'half-year',
        status: 'pending',
        createdAt: new Date()
      });
      
      console.log('✅ トライアル準備完了');

      return NextResponse.json({ 
        success: true, 
        message: 'トライアル準備完了'
      });
    } catch (firebaseError) {
      console.error('❌ Firebase error:', firebaseError);
      return NextResponse.json({ 
        error: 'Firebase error', 
        details: firebaseError.message 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('❌ Prepare trial error:', error);
    return NextResponse.json({ error: 'Prepare failed' }, { status: 500 });
  }
}