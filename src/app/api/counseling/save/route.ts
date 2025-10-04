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
      console.log('🔍 カウンセリング保存開始:', { lineUserId, hasAnswers: !!answers, hasResults: !!results });
      
      const adminDb = admin.firestore();
      console.log('🔍 Admin DB取得完了');
      
      // シンプルなデータ構造で保存
      const saveData = {
        answers: answers,
        results: results,
        aiAnalysis: {
          nutritionPlan: {
            dailyCalories: results.targetCalories,
            macros: results.pfc
          }
        },
        completedAt: new Date(),
        createdAt: new Date(),
        lineUserId: lineUserId,
        timestamp: Date.now()
      };
      
      console.log('🔍 保存データ準備完了:', Object.keys(saveData));
      
      const counselingRef = adminDb.collection('users').doc(lineUserId).collection('counseling').doc('result');
      console.log('🔍 参照取得完了');
      
      await counselingRef.set(saveData);
      console.log('✅ カウンセリング結果保存完了');

      // ユーザープロファイルも保存
      const userRef = adminDb.collection('users').doc(lineUserId);
      const profileData = {
        lineUserId,
        profile: {
          name: answers.name,
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
        updatedAt: new Date(),
      };
      
      await userRef.set(profileData, { merge: true });
      console.log('✅ ユーザープロファイル保存完了');
      
    } catch (error) {
      console.error('❌ Firestore保存エラー:', error);
      console.error('❌ エラー詳細:', error.message);
      console.error('❌ エラースタック:', error.stack);
      // エラーでもAPIは成功として返す
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
    console.log('🔍 userProfile.name:', userProfile.name);
    console.log('🔍 userProfile keys:', Object.keys(userProfile));
    // userProfileから名前を取得（userProfileはanswersオブジェクト）
    const userName = userProfile.name;
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