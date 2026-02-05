import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();
    
    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    console.log(`🔧 Force trial setup for user: ${userId}`);

    try {
      const { admin } = await import('@/lib/firebase-admin');
      
      // 3日間のトライアル設定を強制的にセット
      const trialData = {
        currentPlan: '半年プラン',
        subscriptionStatus: 'trial',
        trialEndDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3日後
        currentPeriodEnd: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(),
        stripeCustomerId: 'manual_trial_setup',
        createdAt: new Date() // 存在しない場合用
      };

      await admin.firestore().collection('users').doc(userId).set(trialData, { merge: true });
      
      console.log(`✅ Force trial setup completed for user: ${userId}`);
      console.log('Trial data:', trialData);

      return NextResponse.json({ 
        success: true, 
        message: 'Trial setup completed',
        trialData
      });
    } catch (firebaseError) {
      console.error('❌ Firebase error:', firebaseError);
      return NextResponse.json({ 
        error: 'Firebase error', 
        details: firebaseError.message 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('❌ Force trial error:', error);
    return NextResponse.json({ error: 'Force trial failed' }, { status: 500 });
  }
}