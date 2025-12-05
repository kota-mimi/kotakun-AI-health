import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const LINE_CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;
const LINE_BASE_URL = 'https://api.line.me/v2/bot';

// 3ボタン用のリッチメニュー設定
const richMenuData = {
  size: {
    width: 2500,
    height: 843
  },
  selected: false,
  name: "統一モード3ボタンメニュー",
  chatBarText: "メニュー",
  areas: [
    {
      bounds: {
        x: 0,
        y: 0,
        width: 833,
        height: 843
      },
      action: {
        type: "postback",
        data: "action=my_page"
      }
    },
    {
      bounds: {
        x: 833,
        y: 0,
        width: 834,
        height: 843
      },
      action: {
        type: "postback",
        data: "action=daily_feedback"
      }
    },
    {
      bounds: {
        x: 1667,
        y: 0,
        width: 833,
        height: 843
      },
      action: {
        type: "postback",
        data: "action=usage_guide"
      }
    }
  ]
};

export async function POST(request: NextRequest) {
  try {
    console.log('🎨 3ボタンリッチメニュー作成開始');

    // 1. リッチメニューを作成
    const createResponse = await fetch(`${LINE_BASE_URL}/richmenu`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`
      },
      body: JSON.stringify(richMenuData)
    });

    if (!createResponse.ok) {
      const error = await createResponse.text();
      console.error('❌ リッチメニュー作成エラー:', error);
      return NextResponse.json({ error: 'リッチメニュー作成に失敗しました' }, { status: 500 });
    }

    const createResult = await createResponse.json();
    const richMenuId = createResult.richMenuId;
    console.log('✅ リッチメニュー作成成功:', richMenuId);

    // 2. 画像をアップロード
    const imagePath = path.join(process.cwd(), 'public', 'rich_menu_3buttons.png');
    
    if (!fs.existsSync(imagePath)) {
      console.error('❌ 画像ファイルが見つかりません:', imagePath);
      return NextResponse.json({ error: '画像ファイルが見つかりません' }, { status: 404 });
    }

    const imageBuffer = fs.readFileSync(imagePath);
    
    const uploadResponse = await fetch(`${LINE_BASE_URL}/richmenu/${richMenuId}/content`, {
      method: 'POST',
      headers: {
        'Content-Type': 'image/png',
        'Authorization': `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`
      },
      body: imageBuffer
    });

    if (!uploadResponse.ok) {
      const error = await uploadResponse.text();
      console.error('❌ 画像アップロードエラー:', error);
      return NextResponse.json({ error: '画像アップロードに失敗しました' }, { status: 500 });
    }

    console.log('✅ 画像アップロード成功');

    // 3. デフォルトリッチメニューとして設定
    const setDefaultResponse = await fetch(`${LINE_BASE_URL}/user/all/richmenu/${richMenuId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`
      }
    });

    if (!setDefaultResponse.ok) {
      const error = await setDefaultResponse.text();
      console.error('❌ デフォルト設定エラー:', error);
      return NextResponse.json({ error: 'デフォルト設定に失敗しました' }, { status: 500 });
    }

    console.log('✅ デフォルトリッチメニュー設定成功');

    return NextResponse.json({
      success: true,
      richMenuId,
      message: '3ボタンリッチメニューが正常に設定されました',
      buttons: [
        { name: 'マイページ', action: 'my_page', bounds: '0-833px' },
        { name: 'フィードバック', action: 'daily_feedback', bounds: '833-1667px' },
        { name: '使い方', action: 'usage_guide', bounds: '1667-2500px' }
      ]
    });

  } catch (error) {
    console.error('❌ リッチメニュー設定エラー:', error);
    return NextResponse.json({ error: 'リッチメニュー設定に失敗しました' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: '3ボタンリッチメニューセットアップAPI',
    endpoint: 'POST /api/setup-richmenu-3buttons',
    description: '統一モード用の3ボタンリッチメニューを作成・設定します'
  });
}