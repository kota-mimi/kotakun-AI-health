import { NextRequest, NextResponse } from 'next/server';
import { admin } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const { lineUserId } = await request.json();

    if (!lineUserId) {
      return NextResponse.json(
        { error: 'LINE User IDが必要です' },
        { status: 400 }
      );
    }

    console.log('🔍 [API-PROD] カウンセリング状態確認開始:', { lineUserId, timestamp: new Date().toISOString() });
    
    const adminDb = admin.firestore();
    
    // カウンセリング結果を取得
    const counselingRef = adminDb.collection('users').doc(lineUserId).collection('counseling').doc('result');
    console.log('🔍 [API-PROD] Firestore path:', `users/${lineUserId}/counseling/result`);
    
    const counselingDoc = await counselingRef.get();
    const counselingResult = counselingDoc.exists ? counselingDoc.data() : null;
    
    console.log('🔍 [API-PROD] Counseling document query result:', {
      exists: counselingDoc.exists,
      hasData: !!counselingResult,
      documentPath: counselingRef.path
    });
    
    // ユーザー情報を取得
    const userRef = adminDb.collection('users').doc(lineUserId);
    const userDoc = await userRef.get();
    const user = userDoc.exists ? userDoc.data() : null;
    
    console.log('🔍 [API-PROD] 取得結果詳細:', { 
      hasCounseling: !!counselingResult, 
      hasUser: !!user,
      hasProfile: !!user?.profile,
      counselingData: counselingResult ? Object.keys(counselingResult) : null,
      userData: user ? Object.keys(user) : null,
      counselingSize: counselingResult ? JSON.stringify(counselingResult).length : 0
    });
    
    // カウンセリング結果の栄養プランを詳細チェック
    if (counselingResult) {
      console.log('🔍 [API-PROD] カウンセリング詳細構造:', {
        hasAnswers: !!counselingResult.answers,
        hasAiAnalysis: !!counselingResult.aiAnalysis,
        hasNutritionPlan: !!counselingResult.aiAnalysis?.nutritionPlan,
        dailyCalories: counselingResult.aiAnalysis?.nutritionPlan?.dailyCalories,
        macros: counselingResult.aiAnalysis?.nutritionPlan?.macros,
        answersKeys: counselingResult.answers ? Object.keys(counselingResult.answers) : [],
        aiAnalysisKeys: counselingResult.aiAnalysis ? Object.keys(counselingResult.aiAnalysis) : []
      });
      
      console.log('🔍 [API-PROD] Full counseling data:', counselingResult);
    } else {
      console.log('🔍 [API-PROD] No counseling data found in Firestore');
    }
    
    console.log('🔍 [API-PROD] User data:', user);

    const response = {
      hasCompletedCounseling: !!counselingResult,
      hasProfile: !!user?.profile,
      user: user,
      counselingResult: counselingResult
    };
    
    console.log('🔍 [API-PROD] Response prepared:', {
      hasCompletedCounseling: response.hasCompletedCounseling,
      hasProfile: response.hasProfile,
      hasUser: !!response.user,
      hasCounselingResult: !!response.counselingResult,
      counselingResultNutrition: response.counselingResult?.aiAnalysis?.nutritionPlan
    });

    return NextResponse.json(response);

  } catch (error: any) {
    console.error('🔍 [API-PROD] カウンセリング状態確認エラー:', {
      error: error,
      message: error.message,
      stack: error.stack,
      lineUserId,
      timestamp: new Date().toISOString()
    });
    
    return NextResponse.json(
      { 
        error: error.message || '状態確認に失敗しました',
        errorDetails: {
          type: error.constructor.name,
          stack: error.stack
        }
      },
      { status: 500 }
    );
  }
}