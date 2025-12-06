const { createCanvas, loadImage } = require('canvas');
const fs = require('fs');

async function combineRichMenuImages() {
  console.log('🎨 3ボタンリッチメニュー画像結合開始');
  
  // LINEリッチメニューの仕様
  const totalWidth = 2500;
  const totalHeight = 843;
  const buttonWidth = Math.floor(totalWidth / 3); // 833px each
  
  console.log(`📏 サイズ: ${totalWidth}x${totalHeight}px`);
  console.log(`🔲 ボタン幅: ${buttonWidth}px`);

  // キャンバス作成
  const canvas = createCanvas(totalWidth, totalHeight);
  const ctx = canvas.getContext('2d');

  // 画像パス
  const imagePaths = [
    "/Users/toshimitsukotarou/Downloads/マイページ (1)/1.png", // マイページ
    "/Users/toshimitsukotarou/Downloads/マイページ (1)/2.png", // フィードバック  
    "/Users/toshimitsukotarou/Downloads/マイページ (1)/3.png"  // 使い方
  ];

  console.log('📂 画像読み込み中...');

  try {
    // 各画像を読み込んで配置
    for (let i = 0; i < imagePaths.length; i++) {
      const image = await loadImage(imagePaths[i]);
      
      // 配置位置計算
      const x = i * buttonWidth;
      const width = i === 2 ? totalWidth - (buttonWidth * 2) : buttonWidth; // 最後は残り幅
      
      console.log(`🖼️ 画像${i+1}: x=${x}, width=${width}`);
      
      // 画像を指定エリアにフィット
      ctx.drawImage(image, x, 0, width, totalHeight);
    }

    // PNG形式で保存
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync('richmenu-3buttons-combined.png', buffer);

    console.log('✅ 結合完了!');
    console.log(`📦 ファイルサイズ: ${Math.round(buffer.length / 1024)}KB`);
    console.log('💾 保存先: richmenu-3buttons-combined.png');
    
    return true;
  } catch (error) {
    console.error('❌ エラー:', error.message);
    return false;
  }
}

combineRichMenuImages().then(success => {
  if (success) {
    console.log('🎉 画像結合成功！');
  } else {
    console.log('😞 画像結合失敗');
  }
}).catch(console.error);