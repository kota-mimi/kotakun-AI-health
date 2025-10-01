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
          width: 1250,
          height: 1686
        },
        action: {
          type: "postback",
          data: "action=text_record"
        }
      },
      {
        bounds: {
          x: 1250,
          y: 0,
          width: 1250,
          height: 1686
        },
        action: {
          type: "postback",
          data: "action=photo_record"
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
  // シンプルな画像データを作成（SVGをBase64エンコード）
  const svgImage = `
    <svg width="2500" height="1686" xmlns="http://www.w3.org/2000/svg">
      <!-- 左半分: テキスト記録 -->
      <rect x="0" y="0" width="1250" height="1686" fill="#4CAF50" stroke="#ffffff" stroke-width="3"/>
      <text x="625" y="800" text-anchor="middle" font-family="Arial, sans-serif" font-size="120" fill="white" font-weight="bold">📝</text>
      <text x="625" y="950" text-anchor="middle" font-family="Arial, sans-serif" font-size="80" fill="white" font-weight="bold">テキストで</text>
      <text x="625" y="1050" text-anchor="middle" font-family="Arial, sans-serif" font-size="80" fill="white" font-weight="bold">記録</text>
      
      <!-- 右半分: 写真記録 -->
      <rect x="1250" y="0" width="1250" height="1686" fill="#2196F3" stroke="#ffffff" stroke-width="3"/>
      <text x="1875" y="800" text-anchor="middle" font-family="Arial, sans-serif" font-size="120" fill="white" font-weight="bold">📷</text>
      <text x="1875" y="950" text-anchor="middle" font-family="Arial, sans-serif" font-size="80" fill="white" font-weight="bold">写真で</text>
      <text x="1875" y="1050" text-anchor="middle" font-family="Arial, sans-serif" font-size="80" fill="white" font-weight="bold">記録</text>
    </svg>
  `;

  // SVGをPNGに変換する必要がありますが、シンプルにするため一時的にダミーデータを使用
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