const sharp = require('sharp');
const fs = require('fs');

async function createFinalRichMenu() {
  try {
    // リッチメニューのサイズ
    const totalWidth = 2500;
    const totalHeight = 843;
    const buttonWidth = Math.floor(totalWidth / 3); // 833px each

    console.log('📐 最終リッチメニューサイズ:', { totalWidth, totalHeight, buttonWidth });

    // 背景画像を作成（青色）
    const background = sharp({
      create: {
        width: totalWidth,
        height: totalHeight,
        channels: 3,
        background: { r: 76, g: 175, b: 255 } // 青色背景
      }
    });

    // 新しい3つのキャラクター画像を正確なサイズでリサイズ
    const button1Buffer = await sharp('./new-button1.png')
      .resize(buttonWidth, totalHeight, { fit: 'contain' })
      .png()
      .toBuffer();

    const button2Buffer = await sharp('./new-button2.png')
      .resize(buttonWidth, totalHeight, { fit: 'contain' })
      .png()
      .toBuffer();

    const button3Buffer = await sharp('./new-button3.png')
      .resize(totalWidth - buttonWidth * 2, totalHeight, { fit: 'contain' }) // 残りの幅
      .png()
      .toBuffer();

    // 3つの画像を横並びに配置
    const result = await background
      .composite([
        { input: button1Buffer, left: 0, top: 0 },
        { input: button2Buffer, left: buttonWidth, top: 0 },
        { input: button3Buffer, left: buttonWidth * 2, top: 0 }
      ])
      .png()
      .toBuffer();

    // publicフォルダに保存
    fs.writeFileSync('./public/rich-menu-new.png', result);
    
    console.log('✅ 最終リッチメニュー画像を作成しました: public/rich-menu-new.png');
    console.log('🎨 新しいキャラクター画像使用、白線なし、正確なサイズ');

  } catch (error) {
    console.error('❌ エラー:', error);
  }
}

createFinalRichMenu();