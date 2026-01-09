const sharp = require('sharp');
const fs = require('fs');

async function createNewRichMenu() {
  try {
    // リッチメニューのサイズ
    const totalWidth = 2500;
    const totalHeight = 843;
    const buttonWidth = Math.floor(totalWidth / 3);

    console.log('📐 リッチメニューサイズ:', { totalWidth, totalHeight, buttonWidth });
    console.log('📏 ボタン配置: 833px + 833px + 834px = 2500px');

    // 青い背景を作成
    const gradientBuffer = await sharp({
      create: {
        width: totalWidth,
        height: totalHeight,
        channels: 3,
        background: { r: 76, g: 175, b: 255 } // 青色背景
      }
    })
    .png()
    .toBuffer();

    // 3つのキャラクター画像を読み込み、リサイズ
    const button1 = await sharp('./button1.png')
      .resize(buttonWidth, totalHeight, { fit: 'contain', background: { r: 76, g: 175, b: 255, alpha: 0 } })
      .png()
      .toBuffer();

    const button2 = await sharp('./button2.png')
      .resize(buttonWidth, totalHeight, { fit: 'contain', background: { r: 76, g: 175, b: 255, alpha: 0 } })
      .png()
      .toBuffer();

    const button3 = await sharp('./button3.png')
      .resize(buttonWidth, totalHeight, { fit: 'contain', background: { r: 76, g: 175, b: 255, alpha: 0 } })
      .png()
      .toBuffer();

    // 背景画像に3つのボタンを配置
    const result = await sharp(gradientBuffer)
      .composite([
        { input: button1, left: 0, top: 0 },
        { input: button2, left: buttonWidth, top: 0 },
        { input: button3, left: buttonWidth * 2, top: 0 }
      ])
      .png()
      .toBuffer();

    // 新しいリッチメニュー画像として保存
    fs.writeFileSync('./rich-menu-new.png', result);
    
    console.log('✅ 新しいリッチメニュー画像を作成しました: rich-menu-new.png');
    console.log('🎨 キャラクター画像を使用、白線なし、正確なサイズ');

  } catch (error) {
    console.error('❌ エラー:', error);
  }
}

createNewRichMenu();