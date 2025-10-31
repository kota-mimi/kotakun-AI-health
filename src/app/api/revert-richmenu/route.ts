import { NextRequest, NextResponse } from 'next/server';

export async function POST(_request: NextRequest) {
  const accessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;

  if (!accessToken) {
    return NextResponse.json({ error: 'LINE_CHANNEL_ACCESS_TOKEN is not set' }, { status: 500 });
  }

  try {
    // 1) 既定リッチメニュー解除
    await detachDefaultRichMenu(accessToken);

    // 2) 現存するリッチメニューを全削除
    const deletedIds = await deleteAllRichMenus(accessToken);

    return NextResponse.json({
      success: true,
      message: 'デフォルト解除と全リッチメニュー削除が完了しました',
      deletedIds,
    });
  } catch (error: any) {
    console.error('リッチメニュー復旧処理エラー:', error);
    return NextResponse.json({ error: '復旧処理に失敗しました', details: error.message }, { status: 500 });
  }
}

async function detachDefaultRichMenu(accessToken: string) {
  const response = await fetch('https://api.line.me/v2/bot/user/all/richmenu', {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    // デフォルト未設定などは 404/409 が返ることがあるためログのみ
    console.log('デフォルト解除警告:', error);
  } else {
    console.log('デフォルトリッチメニュー解除完了');
  }
}

async function deleteAllRichMenus(accessToken: string) {
  const listResponse = await fetch('https://api.line.me/v2/bot/richmenu/list', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!listResponse.ok) {
    throw new Error(`一覧取得失敗: ${await listResponse.text()}`);
  }

  const data = await listResponse.json();
  const menus = data?.richmenus ?? [];

  const deletedIds: string[] = [];
  for (const menu of menus) {
    const del = await fetch(`https://api.line.me/v2/bot/richmenu/${menu.richMenuId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (del.ok) {
      deletedIds.push(menu.richMenuId);
      console.log('削除:', menu.richMenuId);
    } else {
      console.log('削除失敗:', menu.richMenuId, await del.text());
    }
  }

  return deletedIds;
}


