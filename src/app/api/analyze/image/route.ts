import { NextRequest, NextResponse } from 'next/server';
import AIHealthService from '@/services/aiService';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('image') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: '画像ファイルが必要です' },
        { status: 400 }
      );
    }

    // ファイルをBufferに変換
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // AI解析実行
    const aiService = new AIHealthService();
    const analysis = await aiService.analyzeMealFromImage(buffer);

    return NextResponse.json({
      success: true,
      analysis
    });

  } catch (error: any) {
    console.error('画像解析API エラー:', error);
    return NextResponse.json(
      { error: error.message || '画像解析に失敗しました' },
      { status: 500 }
    );
  }
}