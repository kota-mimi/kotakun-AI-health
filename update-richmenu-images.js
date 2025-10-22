const sharp = require('sharp');
const fs = require('fs');

async function createNewRichMenuImage() {
  try {
    console.log('🎨 新しいリッチメニュー画像を作成中...');
    
    // リッチメニューのサイズ: 2500x843
    const menuWidth = 2500;
    const menuHeight = 843;
    const buttonWidth = Math.floor(menuWidth / 3); // 833px each
    
    // 各画像を読み込んでリサイズ
    const image1 = await sharp('./1.png')
      .resize(buttonWidth, menuHeight, { fit: 'cover' })
      .toBuffer();
    
    const image2 = await sharp('./2.png')
      .resize(buttonWidth, menuHeight, { fit: 'cover' })
      .toBuffer();
    
    const image3 = await sharp('./3.png')
      .resize(buttonWidth, menuHeight, { fit: 'cover' })
      .toBuffer();
    
    // 3つの画像を横に結合
    const combinedImage = await sharp({
      create: {
        width: menuWidth,
        height: menuHeight,
        channels: 3,
        background: { r: 255, g: 255, b: 255 }
      }
    })
    .composite([
      { input: image1, left: 0, top: 0 },
      { input: image2, left: buttonWidth, top: 0 },
      { input: image3, left: buttonWidth * 2, top: 0 }
    ])
    .png()
    .toFile('./rich-menu-final.png');
    
    console.log('✅ 新しいリッチメニュー画像作成完了: rich-menu-final.png');
    console.log('📐 サイズ:', `${menuWidth}x${menuHeight}`);
    return './rich-menu-final.png';
    
  } catch (error) {
    console.error('❌ 画像作成エラー:', error);
    throw error;
  }
}

// リッチメニューを更新する関数
async function updateRichMenu() {
  try {
    // 1. 新しい画像を作成
    await createNewRichMenuImage();
    
    // 2. リッチメニューAPI実行
    console.log('🔄 リッチメニューを更新中...');
    const response = await fetch('http://localhost:3000/api/setup-richmenu', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('🎉 リッチメニュー更新完了:', result);
    } else {
      console.error('❌ リッチメニュー更新失敗:', await response.text());
    }
    
  } catch (error) {
    console.error('❌ 更新エラー:', error);
  }
}

updateRichMenu();