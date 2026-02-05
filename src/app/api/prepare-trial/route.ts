import { NextRequest, NextResponse } from 'next/server';
import { admin } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const { userId, planType } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    // Firestoreにユーザー情報を一時保存
    const trialData = {
      userId: userId,
      planType: planType,
      status: 'pending',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10分で期限切れ
    };

    await admin.firestore().collection('pendingTrials').doc(userId).set(trialData);

    console.log(`✅ Trial preparation saved for user: ${userId}, plan: ${planType}`);

    const paymentLinks = {
      'half-year': 'https://buy.stripe.com/test_aFaaEX8lHaw25e3a40bsc00',
      'monthly': 'https://buy.stripe.com/aFafZib8Q3bI97D2hP67S00'
    };

    const paymentUrl = paymentLinks[planType] || paymentLinks['half-year'];

    return NextResponse.json({ 
      success: true, 
      paymentUrl: paymentUrl 
    });
  } catch (error) {
    console.error('❌ Trial preparation failed:', error);
    return NextResponse.json({ error: 'Failed to prepare trial' }, { status: 500 });
  }
}