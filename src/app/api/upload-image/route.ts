import { NextRequest, NextResponse } from 'next/server';
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
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

    console.log('🔧 API: Starting image upload:', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      userId: userId
    });

    // LINEと同じ方式でアップロード
    const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' });
    const storageRef = ref(storage, `meals/${userId}/${today}/meal_${generateId()}.jpg`);
    
    const fileBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(fileBuffer);
    
    const snapshot = await uploadBytes(storageRef, uint8Array, {
      contentType: file.type || 'image/jpeg'
    });
    
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    console.log('✅ API: Image upload successful:', downloadURL);
    
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