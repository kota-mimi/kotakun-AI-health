import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { type, lineUserId, date } = await request.json();

    console.log('🧹 キャッシュクリアAPI:', { type, lineUserId, date });

    if (!type || !lineUserId || !date) {
      return NextResponse.json({ 
        error: '必要なパラメータが不足しています' 
      }, { status: 400 });
    }

    // フロントエンド側のキャッシュクリア指示を返す
    // （実際のキャッシュはクライアント側にあるため、指示のみ）
    const response = NextResponse.json({ 
      success: true,
      action: 'invalidate_cache',
      cacheKey: `${type}_${lineUserId}_${date}`,
      message: 'キャッシュクリア指示を送信しました'
    });

    // CORS ヘッダーを追加（必要に応じて）
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'POST');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type');

    return response;

  } catch (error) {
    console.error('❌ キャッシュクリアAPIエラー:', error);
    return NextResponse.json(
      { error: 'キャッシュクリアに失敗しました' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  // CORS preflight対応
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}