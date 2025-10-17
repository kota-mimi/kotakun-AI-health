import { NextRequest, NextResponse } from 'next/server';
import AIHealthService from '@/services/aiService';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('images') as File[];
    
    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: '画像ファイルが必要です' },
        { status: 400 }
      );
    }

    // 各画像を個別に分析
    const aiService = new AIHealthService();
    const analyses = [];

    for (const file of files) {
      // ファイルをBufferに変換
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // AI解析実行
      const analysis = await aiService.analyzeMealFromImage(buffer);
      analyses.push(analysis);
    }

    return NextResponse.json({
      success: true,
      analyses // 複数の分析結果を返す
    });

  } catch (error: any) {
    console.error('複数画像解析API エラー:', error);
    return NextResponse.json(
      { error: error.message || '複数画像解析に失敗しました' },
      { status: 500 }
    );
  }
}