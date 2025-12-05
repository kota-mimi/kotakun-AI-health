import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const LINE_CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;
const LINE_BASE_URL = 'https://api.line.me/v2/bot';

// 3ボタン用のリッチメニュー設定 (2500x843)
const richMenuData = {
  size: {
    width: 2500,
    height: 843
  },
  selected: false,
  name: "3ボタンリッチメニュー",
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
        data: "action=open_dashboard"
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
    console.log('🎨 強制リッチメニュー作成開始');
    
    if (!LINE_CHANNEL_ACCESS_TOKEN) {
      console.error('❌ LINE_CHANNEL_ACCESS_TOKEN が設定されていません');
      return NextResponse.json({ error: 'LINE_CHANNEL_ACCESS_TOKEN が設定されていません' }, { status: 500 });
    }

    // 1. すべての既存リッチメニューを削除
    console.log('🗑️ 既存リッチメニュー削除開始');
    try {
      const existingResponse = await fetch(`${LINE_BASE_URL}/richmenu/list`, {
        headers: { 'Authorization': `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}` }
      });
      
      if (existingResponse.ok) {
        const existing = await existingResponse.json();
        for (const menu of existing.richmenus || []) {
          console.log('🗑️ 削除:', menu.richMenuId);
          await fetch(`${LINE_BASE_URL}/richmenu/${menu.richMenuId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}` }
          });
        }
      }
    } catch (e) {
      console.log('⚠️ 削除エラー無視:', e);
    }

    // 2. 新しいリッチメニューを作成
    console.log('📝 新しいリッチメニュー作成');
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
      return NextResponse.json({ error: 'リッチメニュー作成失敗', details: error }, { status: 500 });
    }

    const result = await createResponse.json();
    const richMenuId = result.richMenuId;
    console.log('✅ リッチメニュー作成成功:', richMenuId);

    // 3. 画像をアップロード
    console.log('📤 画像アップロード開始');
    let imageBuffer;
    
    // メイン画像パス
    const imagePath = path.join(process.cwd(), 'rich-menu-final.png');
    if (fs.existsSync(imagePath)) {
      imageBuffer = fs.readFileSync(imagePath);
    } else {
      // フォールバック
      const publicPath = path.join(process.cwd(), 'public', 'rich_menu_3buttons.png');
      if (fs.existsSync(publicPath)) {
        imageBuffer = fs.readFileSync(publicPath);
      } else {
        return NextResponse.json({ error: '画像ファイルが見つかりません' }, { status: 404 });
      }
    }
    
    console.log('📤 画像サイズ:', imageBuffer.length, 'bytes');
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
      return NextResponse.json({ error: '画像アップロード失敗', details: error }, { status: 500 });
    }

    console.log('✅ 画像アップロード成功');

    // 4. デフォルトリッチメニューとして設定
    console.log('🎯 デフォルトリッチメニュー設定');
    const setDefaultResponse = await fetch(`${LINE_BASE_URL}/user/all/richmenu/${richMenuId}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}` }
    });

    if (!setDefaultResponse.ok) {
      const error = await setDefaultResponse.text();
      console.error('❌ デフォルト設定エラー:', error);
      return NextResponse.json({ error: 'デフォルト設定失敗', details: error }, { status: 500 });
    }

    console.log('✅ 3ボタンリッチメニュー設定完了');

    return NextResponse.json({
      success: true,
      richMenuId,
      message: '3ボタンリッチメニューが正常に設定されました',
      buttons: [
        { name: 'マイページ', action: 'open_dashboard' },
        { name: 'フィードバック', action: 'daily_feedback' },
        { name: '使い方', action: 'usage_guide' }
      ]
    });

  } catch (error) {
    console.error('❌ リッチメニュー設定エラー:', error);
    return NextResponse.json({ 
      error: 'リッチメニュー設定に失敗しました', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: '強制リッチメニューセットアップAPI',
    endpoint: 'POST /api/force-richmenu',
    description: '既存メニューを削除して3ボタンリッチメニューを強制作成'
  });
}