// 適切なリッチメニュー画像を作成
const fetch = require('node-fetch');
const fs = require('fs');

const accessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN || 'YOUR_ACCESS_TOKEN';
const richMenuId = 'richmenu-6197ec946c3b2572dfe3be9ea132e9e0';

// 2500x843の単色画像を生成（確実に動作する最小限）
function createSolidColorImage() {
  // 緑色の2500x843ピクセル画像
  const width = 2500;
  const height = 843;
  
  // BMPヘッダー（最も確実なフォーマット）
  const fileSize = 54 + (width * height * 3);
  const bmpHeader = Buffer.alloc(54);
  
  // BMP signature
  bmpHeader.write('BM', 0);
  // File size
  bmpHeader.writeUInt32LE(fileSize, 2);
  // Reserved
  bmpHeader.writeUInt32LE(0, 6);
  // Data offset
  bmpHeader.writeUInt32LE(54, 10);
  // Info header size
  bmpHeader.writeUInt32LE(40, 14);
  // Width
  bmpHeader.writeUInt32LE(width, 18);
  // Height
  bmpHeader.writeUInt32LE(height, 22);
  // Planes
  bmpHeader.writeUInt16LE(1, 26);
  // Bits per pixel
  bmpHeader.writeUInt16LE(24, 28);
  // Compression
  bmpHeader.writeUInt32LE(0, 30);
  // Image size
  bmpHeader.writeUInt32LE(width * height * 3, 34);
  
  // 緑色のピクセルデータ
  const pixelData = Buffer.alloc(width * height * 3);
  for (let i = 0; i < pixelData.length; i += 3) {
    pixelData[i] = 0;     // Blue
    pixelData[i + 1] = 255; // Green
    pixelData[i + 2] = 0;   // Red
  }
  
  return Buffer.concat([bmpHeader, pixelData]);
}

async function replaceImage() {
  try {
    console.log('適切な画像を作成してアップロード中...');
    
    const imageBuffer = createSolidColorImage();
    
    const response = await fetch(`https://api-data.line.me/v2/bot/richmenu/${richMenuId}/content`, {
      method: 'POST',
      headers: {
        'Content-Type': 'image/bmp',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: imageBuffer,
    });

    if (response.ok) {
      console.log('✅ 新しい画像アップロード成功！');
      console.log('緑色の2500x843画像が設定されました');
    } else {
      const error = await response.text();
      console.error('❌ 画像アップロード失敗:', error);
    }

  } catch (error) {
    console.error('エラー:', error);
  }
}

replaceImage();