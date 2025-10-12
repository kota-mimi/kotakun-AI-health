import { NextRequest, NextResponse } from 'next/server';

// webhook/route.ts の recordModeUsers にアクセスするため
// 同じ変数を参照する必要があるが、モジュール間では直接アクセスできない
// デバッグ用の簡単な状態確認API

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    // 環境変数チェック（本番環境では無効化）
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ 
        error: 'Debug API is disabled in production' 
      }, { status: 403 });
    }

    return NextResponse.json({
      message: 'Record mode debug API',
      note: 'recordModeUsers は webhook/route.ts 内のメモリベース変数のため、このAPIからは直接アクセスできません',
      suggestion: 'webhook内のログを確認してください',
      userId: userId || 'not provided',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Debug API error:', error);
    return NextResponse.json(
      { error: 'Debug API error' },
      { status: 500 }
    );
  }
}