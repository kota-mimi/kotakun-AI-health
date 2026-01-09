const sharp = require('sharp');
const fs = require('fs');

async function createSimpleRichMenu() {
  try {
    // リッチメニューのサイズ
    const totalWidth = 2500;
    const totalHeight = 843;
    const buttonWidth = Math.floor(totalWidth / 3); // 833px each

    console.log('📐 リッチメニューサイズ:', { totalWidth, totalHeight, buttonWidth });

    // 背景画像を作成（青色）
    const background = sharp({
      create: {
        width: totalWidth,
        height: totalHeight,
        channels: 3,
        background: { r: 76, g: 175, b: 255 } // 青色背景
      }
    });

    // 3つのキャラクター画像を正確なサイズでリサイズ
    const button1Buffer = await sharp('./button1.png')
      .resize(buttonWidth, totalHeight, { fit: 'contain' })
      .png()
      .toBuffer();

    const button2Buffer = await sharp('./button2.png')
      .resize(buttonWidth, totalHeight, { fit: 'contain' })
      .png()
      .toBuffer();

    const button3Buffer = await sharp('./button3.png')
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

    // 新しいリッチメニュー画像として保存
    fs.writeFileSync('./rich-menu-new.png', result);
    
    console.log('✅ 新しいリッチメニュー画像を作成しました');
    console.log('📏 ボタン配置:');
    console.log(`  ボタン1 (マイページ): x=0, width=${buttonWidth}px`);
    console.log(`  ボタン2 (フィードバック): x=${buttonWidth}, width=${buttonWidth}px`);
    console.log(`  ボタン3 (使い方): x=${buttonWidth * 2}, width=${totalWidth - buttonWidth * 2}px`);
    console.log(`  合計: ${buttonWidth + buttonWidth + (totalWidth - buttonWidth * 2)}px`);

  } catch (error) {
    console.error('❌ エラー:', error);
  }
}

createSimpleRichMenu();