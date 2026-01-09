const sharp = require('sharp');
const fs = require('fs');

async function createRichMenu() {
  try {
    // リッチメニューのサイズ
    const totalWidth = 2500;
    const totalHeight = 843;
    const buttonWidth = Math.floor(totalWidth / 3);

    console.log('📐 リッチメニューサイズ:', { totalWidth, totalHeight, buttonWidth });

    // 3つのボタン画像を読み込み
    const button1 = sharp('./button1.png').resize(buttonWidth, totalHeight);
    const button2 = sharp('./button2.png').resize(buttonWidth, totalHeight);
    const button3 = sharp('./button3.png').resize(buttonWidth, totalHeight);

    // 背景画像を作成
    const background = sharp({
      create: {
        width: totalWidth,
        height: totalHeight,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      }
    });

    // 3つの画像を横並びに配置
    const result = await background
      .composite([
        { input: await button1.png().toBuffer(), left: 0, top: 0 },
        { input: await button2.png().toBuffer(), left: buttonWidth, top: 0 },
        { input: await button3.png().toBuffer(), left: buttonWidth * 2, top: 0 }
      ])
      .png()
      .toBuffer();

    // 新しいリッチメニュー画像として保存
    fs.writeFileSync('./rich-menu-new.png', result);
    
    console.log('✅ リッチメニュー画像を作成しました: rich-menu-new.png');
    console.log('📏 各ボタンの配置:');
    console.log('  ボタン1 (マイページ): x=0, width=' + buttonWidth);
    console.log('  ボタン2 (フィードバック): x=' + buttonWidth + ', width=' + buttonWidth);
    console.log('  ボタン3 (使い方): x=' + (buttonWidth * 2) + ', width=' + (totalWidth - buttonWidth * 2));

  } catch (error) {
    console.error('❌ エラー:', error);
  }
}

createRichMenu();