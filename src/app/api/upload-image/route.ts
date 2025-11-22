import { NextRequest, NextResponse } from 'next/server';
import { admin } from '@/lib/firebase-admin';
import { generateId } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;

    if (!file || !userId) {
      return NextResponse.json(
        { error: 'File and userId are required' },
        { status: 400 }
      );
    }


    // Firebase Admin SDKでアップロード（LINEのWebhookと全く同じ設定）
    const storage = admin.storage();
    const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET 
      || process.env.FIREBASE_STORAGE_BUCKET 
      || 'healthy-kun-19990629-gmailcoms-projects.appspot.com'; // LINEのWebhookと同じフォールバック
    const bucket = storage.bucket(bucketName);
    
    
    const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' });
    const fileName = `meals/${userId}/${today}/meal_${generateId()}.jpg`;
    const adminFile = bucket.file(fileName);
    
    const fileBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(fileBuffer);
    
    await adminFile.save(uint8Array, {
      metadata: {
        contentType: file.type || 'image/jpeg'
      }
    });
    
    // パブリックアクセス可能にする
    await adminFile.makePublic();
    
    const downloadURL = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
    
    
    return NextResponse.json({
      success: true,
      imageUrl: downloadURL
    });

  } catch (error: any) {
    console.error('❌ API: Image upload failed:', {
      error: error.message,
      code: error.code,
      name: error.name
    });
    
    return NextResponse.json(
      { 
        error: 'Image upload failed',
        details: error.message 
      },
      { status: 500 }
    );
  }
}