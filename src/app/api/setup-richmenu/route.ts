import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const LINE_CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;
const LINE_BASE_URL = 'https://api.line.me/v2/bot';

// 3ボタン用のリッチメニュー設定
const richMenuData = {
  size: { width: 2500, height: 843 },
  selected: false,
  name: "3ボタンリッチメニュー",
  chatBarText: "メニュー",
  areas: [
    {
      bounds: { x: 0, y: 0, width: 833, height: 843 },
      action: { type: "postback", data: "action=open_dashboard" }
    },
    {
      bounds: { x: 833, y: 0, width: 834, height: 843 },
      action: { type: "postback", data: "action=daily_feedback" }
    },
    {
      bounds: { x: 1667, y: 0, width: 833, height: 843 },
      action: { type: "postback", data: "action=usage_guide" }
    }
  ]
};

export async function POST(request: NextRequest) {
  try {
    console.log('🎨 リッチメニュー設定開始');

    if (!LINE_CHANNEL_ACCESS_TOKEN) {
      return NextResponse.json({ error: 'TOKEN未設定' }, { status: 500 });
    }

    // 既存メニュー削除
    const listResponse = await fetch(`${LINE_BASE_URL}/richmenu/list`, {
      headers: { 'Authorization': `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}` }
    });
    
    if (listResponse.ok) {
      const existing = await listResponse.json();
      for (const menu of existing.richmenus || []) {
        await fetch(`${LINE_BASE_URL}/richmenu/${menu.richMenuId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}` }
        });
      }
    }

    // 新規作成
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
      return NextResponse.json({ error: '作成失敗', details: error }, { status: 500 });
    }

    const result = await createResponse.json();
    const richMenuId = result.richMenuId;
    console.log('✅ リッチメニュー作成成功:', richMenuId);

    // 少し待機してから画像アップロード
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 画像アップロード
    const imagePath = path.join(process.cwd(), 'rich-menu-final.png');
    if (!fs.existsSync(imagePath)) {
      return NextResponse.json({ error: '画像ファイルなし', path: imagePath }, { status: 404 });
    }
    const imageBuffer = fs.readFileSync(imagePath);
    console.log('📤 画像アップロード開始:', imageBuffer.length, 'bytes');
    
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
      console.error('❌ 画像アップロードエラー:', uploadResponse.status, error);
      return NextResponse.json({ 
        error: '画像アップロード失敗', 
        status: uploadResponse.status, 
        details: error,
        richMenuId,
        imageSize: imageBuffer.length 
      }, { status: 500 });
    }
    
    console.log('✅ 画像アップロード成功');

    // デフォルト設定
    const setDefaultResponse = await fetch(`${LINE_BASE_URL}/user/all/richmenu/${richMenuId}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}` }
    });

    if (!setDefaultResponse.ok) {
      const error = await setDefaultResponse.text();
      return NextResponse.json({ error: 'デフォルト失敗', details: error }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      richMenuId,
      message: '3ボタンリッチメニュー設定完了'
    });

  } catch (error) {
    return NextResponse.json({ error: '設定失敗' }, { status: 500 });
  }
}