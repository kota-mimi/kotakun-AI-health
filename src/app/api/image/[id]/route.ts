import { NextRequest, NextResponse } from 'next/server';
import { admin } from '@/lib/firebase-admin';

// グローバルな画像キャッシュ（開発用）
declare global {
  var imageCache: Map<string, string> | undefined;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: imageId } = await params;
    
    // まずグローバルキャッシュをチェック
    const globalCache = global.imageCache;
    if (globalCache && globalCache.has(imageId)) {
      const base64Data = globalCache.get(imageId);
      if (base64Data) {
        const base64Image = base64Data.replace(/^data:image\/[a-z]+;base64,/, '');
        const buffer = Buffer.from(base64Image, 'base64');
        
        return new NextResponse(buffer, {
          headers: {
            'Content-Type': 'image/jpeg',
            'Cache-Control': 'public, max-age=86400',
          },
        });
      }
    }
    
    // フォールバック: Firestoreから画像データを取得
    try {
      const doc = await admin.firestore()
        .collection('images')
        .doc(imageId)
        .get();
      
      if (doc.exists) {
        const data = doc.data();
        if (data?.base64Data) {
          const base64Data = data.base64Data.replace(/^data:image\/[a-z]+;base64,/, '');
          const buffer = Buffer.from(base64Data, 'base64');
          
          return new NextResponse(buffer, {
            headers: {
              'Content-Type': data.mimeType || 'image/jpeg',
              'Cache-Control': 'public, max-age=86400',
            },
          });
        }
      }
    } catch (firestoreError) {
      console.error('Firestore画像取得エラー:', firestoreError);
    }
    
    return new NextResponse('Image not found', { status: 404 });
  } catch (error) {
    console.error('Image serving error:', error);
    return new NextResponse('Internal server error', { status: 500 });
  }
}