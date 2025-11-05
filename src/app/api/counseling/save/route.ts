import { NextRequest, NextResponse } from 'next/server';
import { admin } from '@/lib/firebase-admin';
import { pushMessage } from '@/app/api/webhook/route';
import { createCounselingResultFlexMessage } from '@/services/flexMessageTemplates';

// プロフィール編集用のカウンセリング結果保存関数
async function saveCounselingResult(lineUserId: string, counselingResult: any) {
  try {
    console.log('🔥 プロフィール編集: Firestore保存開始', { lineUserId });
    
    const adminDb = admin.firestore();
    
    // カウンセリング結果を保存
    const saveData = {
      answers: counselingResult.answers,
      aiAnalysis: counselingResult.aiAnalysis,
      userProfile: counselingResult.userProfile,
      updatedAt: new Date(),
      updatedAtJST: new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }),
      timestamp: Date.now()
    };
    
    const counselingRef = adminDb.collection('users').doc(lineUserId).collection('counseling').doc('result');
    await counselingRef.set(saveData, { merge: true });
    
    // プロフィール履歴にも保存（プロフィール編集時）
    if (counselingResult.answers || counselingResult.userProfile) {
      const changeDate = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' });
      const profileHistoryRef = adminDb
        .collection('users')
        .doc(lineUserId)
        .collection('profileHistory')
        .doc(changeDate);

      const answers = counselingResult.answers || {};
      const userProfile = counselingResult.userProfile || {};
      const results = counselingResult.results || {};
      const aiAnalysis = counselingResult.aiAnalysis || {};

      const profileHistoryData = {
        changeDate,
        name: userProfile.name || answers.name || '未設定',
        age: Number(userProfile.age || answers.age) || 0,
        gender: userProfile.gender || answers.gender || 'other',
        height: Number(userProfile.height || answers.height) || 0,
        weight: Number(userProfile.weight || answers.weight) || 0,
        targetWeight: Number(userProfile.targetWeight || answers.targetWeight || userProfile.weight || answers.weight) || 0,
        activityLevel: userProfile.activityLevel || answers.activityLevel || 'moderate',
        primaryGoal: userProfile.goals?.[0]?.type || answers.primaryGoal || 'weight_loss',
        targetCalories: results.targetCalories || aiAnalysis.nutritionPlan?.dailyCalories || 1600,
        bmr: results.bmr || aiAnalysis.nutritionPlan?.bmr || Math.round((results.targetCalories || 1600) * 0.7),
        tdee: results.tdee || aiAnalysis.nutritionPlan?.tdee || (results.targetCalories || 1600),
        macros: results.pfc || aiAnalysis.nutritionPlan?.macros || {
          protein: Math.round(((results.targetCalories || 1600) * 0.25) / 4),
          fat: Math.round(((results.targetCalories || 1600) * 0.30) / 9),
          carbs: Math.round(((results.targetCalories || 1600) * 0.45) / 4)
        },
        source: 'counseling_edit',
        updatedAt: new Date(),
        updatedAtJST: new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }),
        createdAt: new Date(),
        createdAtJST: new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }),
        timestamp: Date.now()
      };

      await profileHistoryRef.set(profileHistoryData);
      console.log('✅ プロフィール編集: プロフィール履歴保存完了');

      // プロフィール編集時の体重もdailyRecordsに保存（グラフ表示用）
      const editWeight = userProfile.weight || answers.weight;
      if (editWeight && Number(editWeight) > 0) {
        const weightRecordRef = adminDb
          .collection('users')
          .doc(lineUserId)
          .collection('dailyRecords')
          .doc(changeDate);

        const weightRecord = {
          weight: Number(editWeight),
          createdAt: new Date(),
          timestamp: Date.now(),
          source: 'profile_edit'
        };

        await weightRecordRef.set(weightRecord, { merge: true });
        console.log('✅ プロフィール編集時の体重をdailyRecordsに保存:', editWeight, 'kg on', changeDate);
      }
    }
    
    // ユーザープロファイルも更新
    const userRef = adminDb.collection('users').doc(lineUserId);
    const profileData = {
      lineUserId,
      profile: {
        name: counselingResult.userProfile?.name || counselingResult.answers?.name,
        age: counselingResult.userProfile?.age || counselingResult.answers?.age,
        gender: counselingResult.userProfile?.gender || counselingResult.answers?.gender,
        height: counselingResult.userProfile?.height || counselingResult.answers?.height,
        weight: counselingResult.userProfile?.weight || counselingResult.answers?.weight,
        targetWeight: counselingResult.userProfile?.targetWeight || counselingResult.answers?.targetWeight,
      },
      updatedAt: new Date(),
      updatedAtJST: new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }),
    };
    
    await userRef.set(profileData, { merge: true });
    console.log('✅ プロフィール編集: Firestore保存完了');
    
    // プロフィール履歴更新を通知
    console.log('🔄 プロフィール編集: プロフィール履歴更新通知発行');

    return NextResponse.json({
      success: true,
      message: 'プロフィールを更新しました'
    });
    
  } catch (error: any) {
    console.error('❌ プロフィール編集: Firestore保存エラー:', error);
    return NextResponse.json(
      { error: 'プロフィールの保存に失敗しました' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { answers, results, lineUserId, counselingResult } = await request.json();

    // プロフィール編集の場合は counselingResult を使用
    if (counselingResult && lineUserId) {
      return await saveCounselingResult(lineUserId, counselingResult);
    }

    // 従来のカウンセリング保存処理
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
            bmr: results.bmr || null,
            tdee: results.tdee || null,
            macros: results.pfc
          }
        },
        completedAt: new Date(),
        completedAtJST: new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }),
        createdAt: new Date(),
        createdAtJST: new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }),
        lineUserId: lineUserId,
        timestamp: Date.now()
      };
      
      console.log('🔍 保存データ準備完了:', Object.keys(saveData));
      
      const counselingRef = adminDb.collection('users').doc(lineUserId).collection('counseling').doc('result');
      console.log('🔍 参照取得完了');
      
      await counselingRef.set(saveData);
      console.log('✅ カウンセリング結果保存完了');

      // プロフィール履歴にも保存（プロフィール表示で使用）
      const changeDate = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' });
      const profileHistoryRef = adminDb
        .collection('users')
        .doc(lineUserId)
        .collection('profileHistory')
        .doc(changeDate);

      const profileHistoryData = {
        changeDate,
        name: answers.name || '未設定',
        age: Number(answers.age) || 0,
        gender: answers.gender || 'other',
        height: Number(answers.height) || 0,
        weight: Number(answers.weight) || 0,
        targetWeight: Number(answers.targetWeight) || Number(answers.weight) || 0,
        activityLevel: answers.activityLevel || 'moderate',
        primaryGoal: answers.primaryGoal || 'weight_loss',
        targetCalories: results.targetCalories,
        bmr: results.bmr || Math.round(results.targetCalories * 0.7),
        tdee: results.tdee || results.targetCalories,
        macros: results.pfc || {
          protein: Math.round((results.targetCalories * 0.25) / 4),
          fat: Math.round((results.targetCalories * 0.30) / 9),
          carbs: Math.round((results.targetCalories * 0.45) / 4)
        },
        source: 'counseling',
        updatedAt: new Date(),
        updatedAtJST: new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }),
        createdAt: new Date(),
        createdAtJST: new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }),
        timestamp: Date.now()
      };

      await profileHistoryRef.set(profileHistoryData);
      console.log('✅ プロフィール履歴保存完了');

      // カウンセリング体重をdailyRecordsにも保存（グラフ表示用）
      if (answers.weight && Number(answers.weight) > 0) {
        const weightDate = changeDate; // カウンセリング完了日
        const weightRecordRef = adminDb
          .collection('users')
          .doc(lineUserId)
          .collection('dailyRecords')
          .doc(weightDate);

        const weightRecord = {
          weight: Number(answers.weight),
          createdAt: new Date(),
          timestamp: Date.now(),
          source: 'counseling'
        };

        await weightRecordRef.set(weightRecord, { merge: true });
        console.log('✅ カウンセリング体重をdailyRecordsに保存:', answers.weight, 'kg on', weightDate);
      }

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
      updatedAtJST: new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }),
      };
      
      await userRef.set(profileData, { merge: true });
      console.log('✅ ユーザープロファイル保存完了');

      // プロフィール履歴更新を通知
      console.log('🔄 プロフィール履歴更新通知発行');
      
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
    
    // 🚫 テキストメッセージのみ削除、flexメッセージは送信（ユーザー要望）
    console.log('送信中 - カウンセリング結果（Flexメッセージのみ）');
    await pushMessage(lineUserId, [flexMessage]);

    console.log('LINEメッセージ送信完了:', userName);

    // カウンセリング完了後、通常モードに設定
    try {
      const adminDb = admin.firestore();
      const userStateRef = adminDb.collection('userStates').doc(lineUserId);
      await userStateRef.set({
        recordMode: false,
        lastActivity: new Date(),
        conversationMode: 'normal'
      }, { merge: true });
      
      console.log('✅ カウンセリング完了後、通常モードに設定:', lineUserId);
    } catch (error) {
      console.error('❌ 通常モード設定エラー:', error);
    }

  } catch (error) {
    console.error('LINEカウンセリング結果送信エラー:', error);
    throw error;
  }
}