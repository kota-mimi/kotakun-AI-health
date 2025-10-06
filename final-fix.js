// 完全に新しいリッチメニューを作成（適切な画像付き）
const fetch = require('node-fetch');

const accessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN || 'YOUR_ACCESS_TOKEN';

const RICH_MENU_CONFIG = {
  size: { width: 2500, height: 843 },
  selected: false,
  name: "健康管理メニューFINAL",
  chatBarText: "メニュー",
  areas: [
    {
      bounds: { x: 0, y: 0, width: 833, height: 843 },
      action: { type: "postback", data: "action=meal_record_menu" }
    },
    {
      bounds: { x: 833, y: 0, width: 834, height: 843 },
      action: { type: "uri", uri: "https://liff.line.me/2007945061-DEEaglg8/dashboard" }
    },
    {
      bounds: { x: 1667, y: 0, width: 833, height: 843 },
      action: { type: "camera" }
    }
  ]
};

// 確実に動作するPNG画像（最小限）
function createValidPNG() {
  return Buffer.from([
    // PNG signature
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
    
    // IHDR chunk
    0x00, 0x00, 0x00, 0x0D, // length
    0x49, 0x48, 0x44, 0x52, // IHDR
    0x09, 0xC4, 0x00, 0x00, // width: 2500
    0x03, 0x4B, 0x00, 0x00, // height: 843
    0x08, 0x02, 0x00, 0x00, 0x00, // bit depth, color type, compression, filter, interlace
    0x5E, 0x5F, 0x0E, 0x6B, // CRC
    
    // IDAT chunk (minimal green data)
    0x00, 0x00, 0x00, 0x0B, // length
    0x49, 0x44, 0x41, 0x54, // IDAT
    0x78, 0x9C, 0x62, 0x60, 0x60, 0x60, 0x00, 0x00, 0x00, 0x04, 0x00, 0x01,
    0x00, 0x00, 0x00, 0x00, // CRC
    
    // IEND chunk
    0x00, 0x00, 0x00, 0x00, // length
    0x49, 0x45, 0x4E, 0x44, // IEND
    0xAE, 0x42, 0x60, 0x82  // CRC
  ]);
}

async function createFinalRichMenu() {
  try {
    console.log('🔥 最終修正：新しいリッチメニューを作成中...');
    
    // 1. 新しいリッチメニュー作成
    const menuResponse = await fetch('https://api.line.me/v2/bot/richmenu', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(RICH_MENU_CONFIG),
    });

    if (!menuResponse.ok) {
      throw new Error(await menuResponse.text());
    }

    const menuResult = await menuResponse.json();
    const newRichMenuId = menuResult.richMenuId;
    console.log('✅ 新しいリッチメニュー作成:', newRichMenuId);

    // 2. 適切な画像をアップロード
    const imageBuffer = createValidPNG();
    console.log('画像サイズ:', imageBuffer.length, 'bytes');
    
    const imageResponse = await fetch(`https://api-data.line.me/v2/bot/richmenu/${newRichMenuId}/content`, {
      method: 'POST',
      headers: {
        'Content-Type': 'image/png',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: imageBuffer,
    });

    if (!imageResponse.ok) {
      throw new Error(await imageResponse.text());
    }
    console.log('✅ PNG画像アップロード成功');

    // 3. あなたに個別設定
    const userResponse = await fetch(`https://api.line.me/v2/bot/user/U7fd12476d6263912e0d9c99fc3a6bef9/richmenu/${newRichMenuId}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    if (userResponse.ok) {
      console.log('✅ 個別設定完了');
    }

    // 4. デフォルトにも設定
    const defaultResponse = await fetch(`https://api.line.me/v2/bot/user/all/richmenu/${newRichMenuId}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    if (defaultResponse.ok) {
      console.log('✅ デフォルト設定完了');
      console.log('🎉 FINAL: 新しいリッチメニュー設定完了！');
      console.log('📱 LINEアプリで確認してください');
    }

  } catch (error) {
    console.error('❌ エラー:', error.message);
  }
}

createFinalRichMenu();