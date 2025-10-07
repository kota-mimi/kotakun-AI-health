import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const accessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  
  if (!accessToken) {
    return NextResponse.json({ error: 'LINE_CHANNEL_ACCESS_TOKEN is not set' }, { status: 500 });
  }

  try {
    // 1. 既存のリッチメニューを削除
    await deleteExistingRichMenus(accessToken);

    // 2. 新しいリッチメニューを作成
    const richMenuId = await createRichMenu(accessToken);

    // 3. リッチメニュー画像をアップロード
    await uploadRichMenuImage(accessToken, richMenuId);

    // 4. デフォルトリッチメニューとして設定
    await setDefaultRichMenu(accessToken, richMenuId);

    return NextResponse.json({ 
      success: true, 
      richMenuId,
      message: 'リッチメニューが正常に設定されました！' 
    });

  } catch (error: any) {
    console.error('リッチメニュー設定エラー:', error);
    return NextResponse.json({ 
      error: 'リッチメニューの設定に失敗しました', 
      details: error.message 
    }, { status: 500 });
  }
}

// 既存のリッチメニューを削除
async function deleteExistingRichMenus(accessToken: string) {
  try {
    const response = await fetch('https://api.line.me/v2/bot/richmenu/list', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    const data = await response.json();
    
    if (data.richmenus && data.richmenus.length > 0) {
      for (const menu of data.richmenus) {
        await fetch(`https://api.line.me/v2/bot/richmenu/${menu.richMenuId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });
        console.log(`既存のリッチメニュー ${menu.richMenuId} を削除しました`);
      }
    }
  } catch (error) {
    console.log('既存のリッチメニュー削除でエラー（続行）:', error);
  }
}

// 新しいリッチメニューを作成
async function createRichMenu(accessToken: string) {
  const richMenuData = {
    size: {
      width: 2500,
      height: 1686
    },
    selected: true,
    name: "健康記録メニュー",
    chatBarText: "記録メニュー",
    areas: [
      {
        bounds: {
          x: 0,
          y: 0,
          width: 833,
          height: 1686
        },
        action: {
          type: "uri",
          uri: process.env.NEXT_PUBLIC_LIFF_ID ? `https://liff.line.me/${process.env.NEXT_PUBLIC_LIFF_ID}/dashboard` : `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`
        }
      },
      {
        bounds: {
          x: 833,
          y: 0,
          width: 834,
          height: 1686
        },
        action: {
          type: "postback",
          data: "action=meal_record"
        }
      },
      {
        bounds: {
          x: 1667,
          y: 0,
          width: 833,
          height: 1686
        },
        action: {
          type: "postback",
          data: "action=test"
        }
      }
    ]
  };

  const response = await fetch('https://api.line.me/v2/bot/richmenu', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify(richMenuData),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`リッチメニュー作成失敗: ${error}`);
  }

  const result = await response.json();
  console.log(`リッチメニュー作成成功: ${result.richMenuId}`);
  return result.richMenuId;
}

// リッチメニュー画像をアップロード
async function uploadRichMenuImage(accessToken: string, richMenuId: string) {
  // シンプルな1px PNG画像を作成（テスト用）
  const simplePng = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
    0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
    0x00, 0x00, 0x09, 0xC4, 0x00, 0x00, 0x06, 0x96, // width: 2500, height: 1686
    0x08, 0x02, 0x00, 0x00, 0x00, 0x8C, 0x4D, 0x4B,
    0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41, 0x54, // IDAT chunk (minimal data)
    0x78, 0x9C, 0x63, 0xF8, 0x0F, 0x00, 0x00, 0x01, 0x00, 0x01,
    0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82 // IEND
  ]);

  const canvas = simplePng;

  const response = await fetch(`https://api-data.line.me/v2/bot/richmenu/${richMenuId}/content`, {
    method: 'POST',
    headers: {
      'Content-Type': 'image/png',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: canvas,
  });

  if (!response.ok) {
    const error = await response.text();
    console.log(`画像アップロード失敗（続行）: ${error}`);
    // 画像アップロードが失敗しても続行
  } else {
    console.log('リッチメニュー画像アップロード成功');
  }
}

// デフォルトリッチメニューとして設定
async function setDefaultRichMenu(accessToken: string, richMenuId: string) {
  const response = await fetch(`https://api.line.me/v2/bot/user/all/richmenu/${richMenuId}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`デフォルト設定失敗: ${error}`);
  }

  console.log('デフォルトリッチメニュー設定成功');
}