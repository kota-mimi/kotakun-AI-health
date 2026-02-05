import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Debug trial data request');
    
    // 最近のpendingTrialsを確認
    try {
      const { admin } = await import('@/lib/firebase-admin');
      
      const pendingTrialsSnapshot = await admin.firestore()
        .collection('pendingTrials')
        .orderBy('createdAt', 'desc')
        .limit(10)
        .get();
      
      const trials = [];
      pendingTrialsSnapshot.forEach(doc => {
        const data = doc.data();
        trials.push({
          id: doc.id,
          userId: data.userId,
          planType: data.planType,
          status: data.status,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        });
      });
      
      console.log('📋 Recent pending trials:', trials);
      
      return NextResponse.json({
        success: true,
        pendingTrials: trials,
        count: trials.length
      });
    } catch (error) {
      console.error('❌ Debug trial error:', error);
      return NextResponse.json({
        success: false,
        error: error.message,
        pendingTrials: []
      });
    }
  } catch (error) {
    console.error('❌ Debug API error:', error);
    return NextResponse.json({ error: 'Debug failed' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, data } = await request.json();
    
    if (action === 'reset_user') {
      console.log('🔄 ユーザーリセット:', data);
      
      if (data?.userId) {
        try {
          const { admin } = await import('@/lib/firebase-admin');
          
          // ユーザーを完全リセット（新規ユーザー状態に）
          const resetData = {
            userId: data.userId,
            subscriptionStatus: 'inactive',
            currentPlan: 'free',
            hasUsedTrial: false, // トライアル利用履歴をリセット
            createdAt: new Date(),
            updatedAt: new Date()
          };
          
          await admin.firestore().collection('users').doc(data.userId).set(resetData);
          
          console.log('✅ ユーザー完全リセット完了:', resetData);
          
          return NextResponse.json({
            success: true,
            message: 'ユーザーを新規状態にリセットしました',
            resetData
          });
          
        } catch (error) {
          console.error('❌ リセットエラー:', error);
          return NextResponse.json({
            success: false,
            error: error.message
          });
        }
      }
    }
    
    if (action === 'check_user') {
      console.log('🔍 Checking user data:', data);
      
      // 特定のユーザーIDでFirestoreを確認
      if (data?.userId) {
        try {
          const { admin } = await import('@/lib/firebase-admin');
          
          const userDoc = await admin.firestore()
            .collection('users')
            .doc(data.userId)
            .get();
          
          if (userDoc.exists) {
            const userData = userDoc.data();
            console.log('✅ User found:', {
              userId: data.userId,
              plan: userData.currentPlan,
              status: userData.subscriptionStatus,
              trialEnd: userData.trialEndDate
            });
            
            return NextResponse.json({
              success: true,
              userExists: true,
              userData: {
                currentPlan: userData.currentPlan,
                subscriptionStatus: userData.subscriptionStatus,
                trialEndDate: userData.trialEndDate,
                stripeCustomerId: userData.stripeCustomerId,
                updatedAt: userData.updatedAt
              }
            });
          } else {
            console.log('❌ User not found:', data.userId);
            return NextResponse.json({
              success: true,
              userExists: false,
              message: 'User not found in Firestore'
            });
          }
        } catch (error) {
          console.error('❌ User check error:', error);
          return NextResponse.json({
            success: false,
            error: error.message
          });
        }
      }
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ Debug POST error:', error);
    return NextResponse.json({ error: 'Debug POST failed' }, { status: 500 });
  }
}