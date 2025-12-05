import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const LINE_CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;
const LINE_BASE_URL = 'https://api.line.me/v2/bot';

// 4ボタン用のリッチメニュー設定 (2500x843) - 元の状態に戻す
const richMenuData = {
  size: {
    width: 2500,
    height: 843
  },
  selected: false,
  name: "4ボタンリッチメニュー",
  chatBarText: "メニュー",
  areas: [
    {
      bounds: {
        x: 0,
        y: 0,
        width: 625,
        height: 843
      },
      action: {
        type: "postback",
        data: "action=open_dashboard"
      }
    },
    {
      bounds: {
        x: 625,
        y: 0,
        width: 625,
        height: 843
      },
      action: {
        type: "postback",
        data: "action=record_menu"
      }
    },
    {
      bounds: {
        x: 1250,
        y: 0,
        width: 625,
        height: 843
      },
      action: {
        type: "postback",
        data: "action=daily_feedback"
      }
    },
    {
      bounds: {
        x: 1875,
        y: 0,
        width: 625,
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
    console.log('🎨 リッチメニュー作成開始');

    if (!LINE_CHANNEL_ACCESS_TOKEN) {
      console.error('❌ LINE_CHANNEL_ACCESS_TOKEN が設定されていません');
      return NextResponse.json({ error: 'LINE_CHANNEL_ACCESS_TOKEN が設定されていません' }, { status: 500 });
    }

    // 1. 既存のリッチメニューを確認（削除しない）
    try {
      const existingMenusResponse = await fetch(`${LINE_BASE_URL}/richmenu/list`, {
        headers: {
          'Authorization': `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`
        }
      });
      
      if (existingMenusResponse.ok) {
        const existingMenus = await existingMenusResponse.json();
        console.log('📋 既存リッチメニュー数:', existingMenus.richmenus?.length || 0);
        
        // 既存のメニューがあれば、それを使用
        if (existingMenus.richmenus && existingMenus.richmenus.length > 0) {
          const existingMenu = existingMenus.richmenus[0];
          console.log('✅ 既存リッチメニューを使用:', existingMenu.richMenuId);
          return NextResponse.json({
            success: true,
            richMenuId: existingMenu.richMenuId,
            message: '既存の4ボタンリッチメニューが設定されています',
            buttons: [
              { name: 'マイページ', action: 'open_dashboard' },
              { name: '記録', action: 'record_menu' },
              { name: 'フィードバック', action: 'daily_feedback' },
              { name: '使い方', action: 'usage_guide' }
            ]
          });
        }
      }
    } catch (error) {
      console.log('⚠️ 既存メニュー確認でエラー（続行）:', error);
    }

    // 2. 新しいリッチメニューを作成
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
      return NextResponse.json({ error: 'リッチメニュー作成に失敗しました', details: error }, { status: 500 });
    }

    const createResult = await createResponse.json();
    const richMenuId = createResult.richMenuId;
    console.log('✅ リッチメニュー作成成功:', richMenuId);

    // 3. 画像をアップロード
    const imagePath = path.join(process.cwd(), 'rich-menu-combined.png');
    
    if (!fs.existsSync(imagePath)) {
      console.error('❌ 画像ファイルが見つかりません:', imagePath);
      // フォールバック: public フォルダから探す
      const publicImagePath = path.join(process.cwd(), 'public', 'rich_menu_3buttons.png');
      if (fs.existsSync(publicImagePath)) {
        console.log('📁 public フォルダの画像を使用:', publicImagePath);
        const imageBuffer = fs.readFileSync(publicImagePath);
        
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
          return NextResponse.json({ error: '画像アップロードに失敗しました', details: error }, { status: 500 });
        }
      } else {
        return NextResponse.json({ error: '画像ファイルが見つかりません' }, { status: 404 });
      }
    } else {
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
        return NextResponse.json({ error: '画像アップロードに失敗しました', details: error }, { status: 500 });
      }
    }

    console.log('✅ 画像アップロード成功');

    // 4. デフォルトリッチメニューとして設定
    const setDefaultResponse = await fetch(`${LINE_BASE_URL}/user/all/richmenu/${richMenuId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`
      }
    });

    if (!setDefaultResponse.ok) {
      const error = await setDefaultResponse.text();
      console.error('❌ デフォルト設定エラー:', error);
      return NextResponse.json({ error: 'デフォルト設定に失敗しました', details: error }, { status: 500 });
    }

    console.log('✅ デフォルトリッチメニュー設定成功');

    return NextResponse.json({
      success: true,
      richMenuId,
      message: '3ボタンリッチメニューが正常に設定されました',
      buttons: [
        { name: 'マイページ', action: 'my_page' },
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

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'リッチメニューセットアップAPI',
    endpoint: 'POST /api/setup-richmenu',
    description: '3ボタンリッチメニューを作成・設定します'
  });
}