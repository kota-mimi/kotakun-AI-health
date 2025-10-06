// 作成したリッチメニュー画像をアップロード
const fetch = require('node-fetch');
const fs = require('fs');

const accessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN || 'YOUR_ACCESS_TOKEN';
const userId = 'U7fd12476d6263912e0d9c99fc3a6bef9'; // ユーザーID

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

async function uploadFinalRichMenu() {
  try {
    console.log('🚀 最終リッチメニューアップロード開始...');
    
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

    // 2. 作成した画像をアップロード
    const imagePath = '/Users/toshimitsukotarou/Desktop/kotakun-good/rich-menu-final.png';
    const imageBuffer = fs.readFileSync(imagePath);
    
    console.log('📊 画像情報:');
    console.log('- ファイルサイズ:', imageBuffer.length, 'bytes');
    console.log('- パス:', imagePath);
    
    const imageResponse = await fetch(`https://api-data.line.me/v2/bot/richmenu/${newRichMenuId}/content`, {
      method: 'POST',
      headers: {
        'Content-Type': 'image/png',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: imageBuffer,
    });

    if (!imageResponse.ok) {
      const errorText = await imageResponse.text();
      throw new Error(`画像アップロード失敗: ${errorText}`);
    }
    console.log('✅ 画像アップロード成功！');

    // 3. あなたに個別設定
    const userResponse = await fetch(`https://api.line.me/v2/bot/user/${userId}/richmenu/${newRichMenuId}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    if (userResponse.ok) {
      console.log('✅ 個別ユーザー設定完了');
    } else {
      console.log('⚠️ 個別設定失敗:', await userResponse.text());
    }

    // 4. デフォルトにも設定
    const defaultResponse = await fetch(`https://api.line.me/v2/bot/user/all/richmenu/${newRichMenuId}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    if (defaultResponse.ok) {
      console.log('✅ デフォルト設定完了');
    } else {
      console.log('⚠️ デフォルト設定失敗:', await defaultResponse.text());
    }

    console.log('🎉 FINAL COMPLETE: リッチメニュー完全設定完了！');
    console.log('📱 LINEアプリで確認してください');
    console.log('🎯 リッチメニューID:', newRichMenuId);

  } catch (error) {
    console.error('❌ エラー:', error.message);
  }
}

uploadFinalRichMenu();