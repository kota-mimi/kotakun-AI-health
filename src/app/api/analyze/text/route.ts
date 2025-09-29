import { NextRequest, NextResponse } from 'next/server';
import AIHealthService from '@/services/aiService';

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();
    
    if (!text) {
      return NextResponse.json(
        { error: 'テキストが必要です' },
        { status: 400 }
      );
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