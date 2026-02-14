import { NextRequest, NextResponse } from 'next/server';
import { admin } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    const db = admin.firestore();
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      return NextResponse.json({ 
        backgroundSettings: {
          type: 'white',
          imageUrl: null
        }
      });
    }

    const userData = userDoc.data();
    const backgroundSettings = userData?.backgroundSettings || {
      type: 'white',
      imageUrl: null
    };

    return NextResponse.json({ backgroundSettings });

  } catch (error) {
    console.error('Background settings fetch error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch background settings' 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, backgroundType, imageUrl } = await request.json();

    if (!userId || !backgroundType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const db = admin.firestore();
    await db.collection('users').doc(userId).set({
      backgroundSettings: {
        type: backgroundType,
        imageUrl: imageUrl || null,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }
    }, { merge: true });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Background settings save error:', error);
    return NextResponse.json({ 
      error: 'Failed to save background settings' 
    }, { status: 500 });
  }
}