import { NextRequest, NextResponse } from 'next/server';
import { admin } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('image') as File;
    const userId = formData.get('userId') as string;

    if (!file || !userId) {
      return NextResponse.json({ error: 'Missing file or userId' }, { status: 400 });
    }

    // ファイル形式チェック
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
    }

    // ファイルサイズチェック (5MB制限)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be less than 5MB' }, { status: 400 });
    }

    // Firebase Storage にアップロード
    const bucket = admin.storage().bucket();
    const fileName = `backgrounds/${userId}/custom-${Date.now()}.${file.type.split('/')[1]}`;
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    const fileUpload = bucket.file(fileName);
    await fileUpload.save(fileBuffer, {
      metadata: {
        contentType: file.type,
      },
    });

    // ダウンロードURLを取得
    await fileUpload.makePublic();
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

    // Firestoreに設定を保存
    const db = admin.firestore();
    await db.collection('users').doc(userId).set({
      backgroundSettings: {
        type: 'custom',
        imageUrl: publicUrl,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }
    }, { merge: true });

    return NextResponse.json({ 
      success: true, 
      imageUrl: publicUrl 
    });

  } catch (error) {
    console.error('Background upload error:', error);
    return NextResponse.json({ 
      error: 'Failed to upload background image' 
    }, { status: 500 });
  }
}