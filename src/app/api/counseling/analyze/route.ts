import { NextRequest, NextResponse } from 'next/server';
import AIHealthService from '@/services/aiService';
import { FirestoreService } from '@/services/firestoreService';
import { pushMessage } from '@/app/api/webhook/route';
import { createCounselingResultFlexMessage } from '@/services/flexMessageTemplates';

export async function POST(request: NextRequest) {
  try {
    const { answers, lineUserId } = await request.json();

    if (!answers || !lineUserId) {
      return NextResponse.json(
        { error: 'カウンセリング回答またはLINE User IDが必要です' },
        { status: 400 }
      );
    }

    // AI分析を実行
    const aiService = new AIHealthService();
    const analysis = await aiService.analyzeCounseling(answers);

    // Firestoreに分析結果とカウンセリング回答を保存（テスト環境では無効化）
    const isTestMode = process.env.NODE_ENV === 'development' && answers.name?.includes('テスト');
    if (!isTestMode) {
      try {
        const firestoreService = new FirestoreService();
        await firestoreService.saveCounselingResult(lineUserId, answers, analysis);
      } catch (error) {
        console.error('Firestore保存エラー:', error);
        // Firestoreエラーは無視してAPIは成功として続行
      }
    }

    // 分析結果をフォーマット
    const analysisResult = {
      personalizedAdvice: analysis.personalizedAdvice,
      nutritionPlan: analysis.nutritionPlan,
      healthGoals: analysis.healthGoals,
      riskFactors: analysis.riskFactors,
      recommendations: analysis.recommendations,
      analyzedAt: new Date().toISOString(),
      analyzedAtJST: new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }),
    };

    // LINEでAIアドバイスを送信（テストモードまたは無効なuserIdではスキップ）
    const isValidLineUserId = lineUserId && lineUserId.startsWith('U') && lineUserId.length > 10;
    if (isValidLineUserId && !isTestMode) {
      try {
        await sendAnalysisToLine(lineUserId, analysis, answers);
      } catch (error) {
        console.error('LINE送信エラー:', error);
        // LINE送信エラーは無視してAPIは成功として続行
      }
    }

    return NextResponse.json({
      success: true,
      analysis: analysisResult,
    });

  } catch (error: any) {
    console.error('カウンセリング分析エラー:', error);
    return NextResponse.json(
      { error: error.message || 'AI分析に失敗しました' },
      { status: 500 }
    );
  }
}

// LINEでAI分析結果を送信
async function sendAnalysisToLine(lineUserId: string, analysis: any, userProfile: any) {
  try {
    const userName = userProfile.name || 'ユーザー';

    // Flexメッセージでカウンセリング結果を送信
    const flexMessage = createCounselingResultFlexMessage(analysis, userProfile);
    
    console.log('送信中 - カウンセリング結果');
    await pushMessage(lineUserId, [flexMessage]);

    // マイページボタンは削除

    console.log('LINEメッセージ送信完了:', userName);

  } catch (error) {
    console.error('LINE分析結果送信エラー:', error);
    throw error;
  }
}

// カウンセリングデータの保存（将来的にFirestoreに変更予定）
export async function saveAnalysisResult(userId: string, analysis: any) {
  try {
    // 現在はクライアント側のローカルストレージを使用
    // 将来的にはFirestore等のデータベースに保存
    console.log('分析結果を保存:', { userId, analysis });
    return true;
  } catch (error) {
    console.error('分析結果保存エラー:', error);
    return false;
  }
}