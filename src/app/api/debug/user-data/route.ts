import { NextRequest, NextResponse } from 'next/server';
import { admin } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    console.log(`🔍 デバッグ - ユーザーデータ取得: ${userId}`);

    // Firestore からユーザーデータを取得
    const userRef = admin.firestore().collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    // 支払い履歴も取得
    const paymentsRef = admin.firestore().collection('payments');
    const paymentsSnapshot = await paymentsRef
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(5)
      .get();

    const payments = paymentsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json({
      userExists: userDoc.exists,
      userData: userDoc.exists ? userDoc.data() : null,
      payments: payments,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ デバッグAPI エラー:', error);
    return NextResponse.json(
      { error: 'Failed to fetch debug data', details: error },
      { status: 500 }
    );
  }
}