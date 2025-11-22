// 提供された3つのアイコンを2500x843のリッチメニュー画像に組み合わせ
const sharp = require('sharp');
const fs = require('fs');

async function createRichMenuImage() {
  try {
    console.log('🎨 リッチメニュー画像を作成中...');
    
    // 各ボタンのサイズ計算
    const totalWidth = 2500;
    const totalHeight = 1686;
    const buttonWidth = Math.floor(totalWidth / 3); // 833px each
    
    // 背景色（薄いグレー）
    const backgroundColor = '#f0f0f0';
    
    // ベース画像作成（2500x843、薄いグレー背景）
    const baseImage = sharp({
      create: {
        width: totalWidth,
        height: totalHeight,
        channels: 3,
        background: backgroundColor
      }
    });
    
    // アイコン画像のパス
    const mealIcon = '/Users/toshimitsukotarou/Downloads/Gemini_Generated_Image_mzvdummzvdummzvd (1).png'; // 食事記録
    const myPageIcon = '/Users/toshimitsukotarou/Downloads/Gemini_Generated_Image_mzvdummzvdummzvd.png'; // マイページ
    const cameraIcon = '/Users/toshimitsukotarou/Downloads/Gemini_Generated_Image_bblzkabblzkabblz.png'; // カメラ
    
    // 各アイコンのサイズとレイアウト設定
    const iconSize = 200; // アイコンサイズ
    const iconTop = Math.floor((totalHeight - iconSize) / 2); // 中央配置
    
    // 各ボタンの中央位置計算
    const positions = [
      { left: Math.floor((buttonWidth - iconSize) / 2), top: iconTop }, // 食事記録 (左)
      { left: buttonWidth + Math.floor((buttonWidth - iconSize) / 2), top: iconTop }, // マイページ (中央)
      { left: buttonWidth * 2 + Math.floor((buttonWidth - iconSize) / 2), top: iconTop } // カメラ (右)
    ];
    
    // アイコンを事前に処理
    const mealIconBuffer = await sharp(mealIcon).resize(iconSize, iconSize).png().toBuffer();
    const myPageIconBuffer = await sharp(myPageIcon).resize(iconSize, iconSize).png().toBuffer();
    const cameraIconBuffer = await sharp(cameraIcon).resize(iconSize, iconSize).png().toBuffer();
    
    // 区切り線を事前に処理
    const lineColor = '#d0d0d0';
    const lineWidth = 2;
    const lineBuffer = await sharp({
      create: {
        width: lineWidth,
        height: totalHeight,
        channels: 3,
        background: lineColor
      }
    }).png().toBuffer();
    
    // アイコンを配置（元の順序：食事記録、マイページ、カメラ）
    const composite = [
      {
        input: mealIconBuffer, // 食事記録 (左)
        left: positions[0].left,
        top: positions[0].top
      },
      {
        input: myPageIconBuffer, // マイページ (中央)
        left: positions[1].left,
        top: positions[1].top
      },
      {
        input: cameraIconBuffer, // カメラ (右)
        left: positions[2].left,
        top: positions[2].top
      }
    ];
    
    // 区切り線を追加（縦線）
    const lines = [
      // 第1と第2ボタンの間
      {
        input: lineBuffer,
        left: buttonWidth - 1,
        top: 0
      },
      // 第2と第3ボタンの間
      {
        input: lineBuffer,
        left: buttonWidth * 2 - 1,
        top: 0
      }
    ];
    
    // 全要素を合成
    const finalComposite = [...composite, ...lines];
    
    // 最終画像を生成
    const outputPath = '/Users/toshimitsukotarou/Desktop/healthy-kun/rich-menu-final.png';
    await baseImage
      .composite(finalComposite)
      .png()
      .toFile(outputPath);
    
    console.log('✅ リッチメニュー画像作成完了:', outputPath);
    console.log(`📐 サイズ: ${totalWidth}x${totalHeight}px`);
    console.log('🎯 レイアウト: [食事記録] [マイページ] [カメラ]');
    
    return outputPath;
    
  } catch (error) {
    console.error('❌ 画像作成エラー:', error.message);
    throw error;
  }
}

// 実行
createRichMenuImage().then(imagePath => {
  console.log('🎉 リッチメニュー画像準備完了！');
  console.log('次のステップ: 画像をLINE APIにアップロード');
}).catch(error => {
  console.error('画像作成失敗:', error);
});