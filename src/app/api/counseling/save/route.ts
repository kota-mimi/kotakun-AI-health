import { NextRequest, NextResponse } from 'next/server';
import { admin } from '@/lib/firebase-admin';
import { pushMessage } from '@/app/api/webhook/route';
import { createCounselingResultFlexMessage } from '@/services/flexMessageTemplates';

export async function POST(request: NextRequest) {
  try {
    const { answers, results, lineUserId } = await request.json();

    if (!answers || !results || !lineUserId) {
      return NextResponse.json(
        { error: 'カウンセリング回答、結果、またはLINE User IDが必要です' },
        { status: 400 }
      );
    }

    // Firestoreに結果を保存（Admin SDK使用）
    try {
      const adminDb = admin.firestore();
      const counselingRef = adminDb.collection('users').doc(lineUserId).collection('counseling').doc('result');
      
      // 既存のカウンセリング結果を確認
      const existingDoc = await counselingRef.get();
      const existingData = existingDoc.exists ? existingDoc.data() : null;
      
      // カウンセリング結果を保存
      await counselingRef.set({
        answers,
        aiAnalysis: {
          nutritionPlan: {
            dailyCalories: results.targetCalories,
            macros: results.pfc
          }
        },
        completedAt: admin.FieldValue.serverTimestamp(),
        createdAt: existingData?.createdAt || admin.FieldValue.serverTimestamp(),
        firstCompletedAt: existingData?.firstCompletedAt || admin.FieldValue.serverTimestamp(),
      });

      // ユーザープロファイルも更新
      const userRef = adminDb.collection('users').doc(lineUserId);
      await userRef.set({
        lineUserId,
        profile: {
          name: answers.name || 'ユーザー',
          age: Number(answers.age) || 25,
          gender: answers.gender || 'other',
          height: Number(answers.height) || 170,
          weight: Number(answers.weight) || 60,
          activityLevel: answers.activityLevel || 'normal',
          goals: [{
            type: answers.primaryGoal || 'fitness_improve',
            targetValue: Number(answers.targetWeight) || Number(answers.weight) || 60,
          }],
          medicalConditions: answers.medicalConditions ? [answers.medicalConditions] : [],
          allergies: answers.allergies ? [answers.allergies] : [],
        },
        updatedAt: admin.FieldValue.serverTimestamp(),
      }, { merge: true });
      
      console.log('✅ Firestore保存成功（Admin SDK）:', lineUserId);
    } catch (error) {
      console.error('❌ Firestore保存エラー:', error);
      // Firestoreエラーは無視してAPIは成功として続行
    }

    // LINEでカウンセリング結果を送信
    const isValidLineUserId = lineUserId && lineUserId.startsWith('U') && lineUserId.length > 10;
    if (isValidLineUserId) {
      try {
        await sendCounselingResultToLine(lineUserId, answers, results);
      } catch (error) {
        console.error('LINE送信エラー:', error);
        // LINE送信エラーは無視してAPIは成功として続行
      }
    }

    return NextResponse.json({
      success: true,
      message: 'カウンセリング結果を保存しました'
    });

  } catch (error: any) {
    console.error('カウンセリング保存エラー:', error);
    return NextResponse.json(
      { error: error.message || 'カウンセリング結果の保存に失敗しました' },
      { status: 500 }
    );
  }
}

// LINEでカウンセリング結果を送信
async function sendCounselingResultToLine(lineUserId: string, userProfile: any, results: any) {
  try {
    console.log('🔍 ユーザープロファイル確認:', userProfile);
    const userName = userProfile.name || userProfile.answers?.name || 'ユーザー';
    console.log('🔍 取得したユーザー名:', userName);

    // Flexメッセージでカウンセリング結果を送信（AI分析データなし）
    const mockAnalysis = {
      nutritionPlan: {
        dailyCalories: results.targetCalories,
        macros: results.pfc
      }
    };
    
    console.log('🔍 送信データ確認:');
    console.log('  - targetCalories:', results.targetCalories);
    console.log('  - PFC:', results.pfc);
    console.log('  - mockAnalysis:', JSON.stringify(mockAnalysis, null, 2));
    
    const flexMessage = createCounselingResultFlexMessage(mockAnalysis, userProfile);
    
    console.log('送信中 - カウンセリング結果（AI分析なし）');
    await pushMessage(lineUserId, [flexMessage]);

    console.log('LINEメッセージ送信完了:', userName);

  } catch (error) {
    console.error('LINEカウンセリング結果送信エラー:', error);
    throw error;
  }
}