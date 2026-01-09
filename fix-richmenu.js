const sharp = require('sharp');
const fs = require('fs');

async function fixRichMenu() {
  try {
    // 現在の画像の右端の白い線を除去
    const originalImage = sharp('./rich-menu-new.png');
    const metadata = await originalImage.metadata();
    
    console.log('📐 現在の画像サイズ:', metadata);

    // 右端の白い線を削除して2500pxに調整
    const result = await originalImage
      .extract({ 
        left: 0, 
        top: 0, 
        width: 2500,  // 正確に2500pxに
        height: 843 
      })
      .png()
      .toBuffer();

    // 修正済み画像として保存
    fs.writeFileSync('./rich-menu-new.png', result);
    
    console.log('✅ リッチメニュー画像の白線を除去しました');

  } catch (error) {
    console.error('❌ エラー:', error);
  }
}

fixRichMenu();