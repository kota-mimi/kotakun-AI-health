import { NextRequest, NextResponse } from 'next/server';
import AIHealthService from '@/services/aiService';
import { getUserPlan } from '@/utils/usageLimits';

export async function POST(request: NextRequest) {
  try {
    const { text, userId } = await request.json();
    
    if (!text) {
      return NextResponse.json(
        { error: 'テキストが必要です' },
        { status: 400 }
      );
    }

    // プラン制限チェック：無料プランはWebアプリAI機能なし
    if (userId) {
      const userPlan = await getUserPlan(userId);
      if (userPlan === 'free') {
        return NextResponse.json({ 
          error: 'WebアプリでのAI機能は有料プランの機能です。プランをアップグレードするか、LINEでご利用ください。',
          needsUpgrade: true 
        }, { status: 403 });
      }
    }

    // AI解析実行
    const aiService = new AIHealthService();
    const analysis = await aiService.analyzeMealFromText(text);

    return NextResponse.json({
      success: true,
      analysis
    });

  } catch (error: any) {
    console.error('テキスト解析API エラー:', error);
    return NextResponse.json(
      { error: error.message || 'テキスト解析に失敗しました' },
      { status: 500 }
    );
  }
}