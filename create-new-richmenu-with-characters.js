const sharp = require('sharp');
const fs = require('fs');

async function createNewRichMenuWithCharacters() {
  try {
    // リッチメニューのサイズ
    const totalWidth = 2500;
    const totalHeight = 843;
    
    // 各ボタンの幅（エリア設定に合わせる）
    const button1Width = 833;  // マイページ
    const button2Width = 834;  // フィードバック（1px多い）
    const button3Width = 833;  // 使い方

    console.log('📐 新しいリッチメニューサイズ:', { totalWidth, totalHeight });
    console.log('📏 各ボタン幅:', { button1Width, button2Width, button3Width });

    // 新しいキャラクター画像を適切なサイズでリサイズ
    const button1Buffer = await sharp('/Users/toshimitsukotarou/Downloads/マイページ (6)/1.png')
      .resize(button1Width, totalHeight, { fit: 'cover', position: 'center' })
      .png()
      .toBuffer();

    const button2Buffer = await sharp('/Users/toshimitsukotarou/Downloads/マイページ (6)/2.png')
      .resize(button2Width, totalHeight, { fit: 'cover', position: 'center' })
      .png()
      .toBuffer();

    const button3Buffer = await sharp('/Users/toshimitsukotarou/Downloads/マイページ (6)/3.png')
      .resize(button3Width, totalHeight, { fit: 'cover', position: 'center' })
      .png()
      .toBuffer();

    // 背景画像を作成（青色のグラデーション）
    const background = sharp({
      create: {
        width: totalWidth,
        height: totalHeight,
        channels: 3,
        background: { r: 76, g: 175, b: 255 } // 青色背景
      }
    });

    // 3つの画像を横並びに配置
    const result = await background
      .composite([
        { input: button1Buffer, left: 0, top: 0 },
        { input: button2Buffer, left: button1Width, top: 0 },
        { input: button3Buffer, left: button1Width + button2Width, top: 0 }
      ])
      .png()
      .toBuffer();

    // 結果を保存
    fs.writeFileSync('./rich-menu-new-characters.png', result);
    
    console.log('✅ 新しいキャラクター画像でリッチメニューを作成しました: rich-menu-new-characters.png');
    console.log('📊 構成:');
    console.log('  1. マイページ (家の上の子供) - x=0');
    console.log('  2. フィードバック (吹き出しの上の子供) - x=' + button1Width);
    console.log('  3. 使い方 (盾の上の子供) - x=' + (button1Width + button2Width));

  } catch (error) {
    console.error('❌ エラー:', error);
  }
}

createNewRichMenuWithCharacters();