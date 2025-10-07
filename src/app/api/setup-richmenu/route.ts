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
  // 新しい3分割SVG画像を作成
  const svgImage = `
    <svg width="2500" height="1686" xmlns="http://www.w3.org/2000/svg">
      <!-- 左: マイページ -->
      <rect x="0" y="0" width="833" height="1686" fill="#e8e8e8" stroke="#d0d0d0" stroke-width="2"/>
      <text x="417" y="800" text-anchor="middle" font-family="Arial, sans-serif" font-size="80" fill="#333" font-weight="bold">マイページ</text>
      
      <!-- 中央: 食事記録 -->
      <rect x="833" y="0" width="834" height="1686" fill="#e8e8e8" stroke="#d0d0d0" stroke-width="2"/>
      <text x="1250" y="800" text-anchor="middle" font-family="Arial, sans-serif" font-size="80" fill="#333" font-weight="bold">食事記録</text>
      
      <!-- 右: テスト -->
      <rect x="1667" y="0" width="833" height="1686" fill="#e8e8e8" stroke="#d0d0d0" stroke-width="2"/>
      <text x="2084" y="800" text-anchor="middle" font-family="Arial, sans-serif" font-size="80" fill="#333" font-weight="bold">テスト</text>
    </svg>
  `;

  const canvas = Buffer.from(svgImage);

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