const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function combineRichMenuImages() {
  try {
    console.log('🎨 リッチメニュー画像合成開始...');
    
    // 画像パス
    const imagePaths = [
      '/Users/toshimitsukotarou/Downloads/マイページ/1.png', // マイページ
      '/Users/toshimitsukotarou/Downloads/マイページ/2.png', // 記録
      '/Users/toshimitsukotarou/Downloads/マイページ/3.png'  // AIアドバイス
    ];
    
    // 画像存在確認
    for (const imagePath of imagePaths) {
      if (!fs.existsSync(imagePath)) {
        throw new Error(`画像が見つかりません: ${imagePath}`);
      }
    }
    
    // 各画像を読み込み
    const images = await Promise.all(
      imagePaths.map(async (imagePath) => {
        const image = sharp(imagePath);
        const metadata = await image.metadata();
        console.log(`📸 ${path.basename(imagePath)}: ${metadata.width}x${metadata.height}`);
        return image;
      })
    );
    
    // 2500x843の背景を作成
    const combinedImage = sharp({
      create: {
        width: 2500,
        height: 843,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      }
    });
    
    // 3つの画像を横に並べて合成
    const composite = await combinedImage
      .composite([
        { input: await images[0].png().toBuffer(), left: 0, top: 0 },      // マイページ (左)
        { input: await images[1].png().toBuffer(), left: 833, top: 0 },   // 記録 (中央)
        { input: await images[2].png().toBuffer(), left: 1667, top: 0 }   // AIアドバイス (右)
      ])
      .png()
      .toFile('./rich-menu-final.png');
    
    console.log('✅ リッチメニュー画像合成完了: rich-menu-final.png');
    console.log(`📏 最終サイズ: 2500x843px`);
    
    return './rich-menu-final.png';
    
  } catch (error) {
    console.error('❌ 画像合成エラー:', error);
    throw error;
  }
}

// 実行
combineRichMenuImages()
  .then((outputPath) => {
    console.log(`🎉 合成完了: ${outputPath}`);
  })
  .catch((error) => {
    console.error('合成失敗:', error);
    process.exit(1);
  });