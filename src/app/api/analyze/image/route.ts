import { NextRequest, NextResponse } from 'next/server';
import AIHealthService from '@/services/aiService';
import { getUserPlan } from '@/utils/usageLimits';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('image') as File;
    const userId = formData.get('userId') as string;
    
    if (!file) {
      return NextResponse.json(
        { error: '画像ファイルが必要です' },
        { status: 400 }
      );
    }

    // プラン制限チェック
    if (userId) {
      const userPlan = await getUserPlan(userId);
      if (userPlan === 'free') {
        return NextResponse.json({ 
          error: 'WebアプリでのAI機能は有料プランの機能です。プランをアップグレードするか、LINEでご利用ください。',
          needsUpgrade: true 
        }, { status: 403 });
      }
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