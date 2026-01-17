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
    
    // テスト用カウンセリング結果を作成
    const testCounselingData = {
      answers: {
        name: 'テストユーザー',
        age: 30,
        gender: 'male',
        height: 170,
        weight: 70,
        targetWeight: 65,
        activityLevel: 'moderate',
        primaryGoal: 'weight_loss'
      },
      results: {
        targetCalories: 1800,
        bmr: 1600,
        tdee: 2000,
        pfc: {
          protein: 112,
          fat: 60,
          carbs: 202
        }
      },
      aiAnalysis: {
        nutritionPlan: {
          dailyCalories: 1800,
          bmr: 1600,
          tdee: 2000,
          macros: {
            protein: 112,
            fat: 60,
            carbs: 202
          }
        }
      },
      completedAt: new Date(),
      completedAtJST: new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }),
      createdAt: new Date(),
      createdAtJST: new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }),
      lineUserId: userId,
      timestamp: Date.now()
    };

    // カウンセリング結果を保存
    const counselingRef = db.collection('users').doc(userId).collection('counseling').doc('result');
    await counselingRef.set(testCounselingData);

    // ユーザープロファイルも作成
    const userRef = db.collection('users').doc(userId);
    const profileData = {
      lineUserId: userId,
      profile: {
        name: 'テストユーザー',
        age: 30,
        gender: 'male',
        height: 170,
        weight: 70,
        activityLevel: 'moderate',
        goals: [{
          type: 'weight_loss',
          targetValue: 65
        }]
      },
      hasCompletedCounseling: true,
      updatedAt: new Date(),
      updatedAtJST: new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }),
    };
    
    await userRef.set(profileData, { merge: true });

    console.log(`✅ Test counseling data created for ${userId}`);

    return NextResponse.json({
      success: true,
      message: `Test counseling data created for ${userId}`
    });

  } catch (error) {
    console.error('❌ Create test counseling error:', error);
    return NextResponse.json(
      { error: 'Failed to create test counseling' },
      { status: 500 }
    );
  }
}