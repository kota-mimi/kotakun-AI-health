import { NextRequest, NextResponse } from 'next/server';
import admin from '@/lib/firebase-admin';

interface ReminderSetting {
  id: string;
  name: string;
  enabled: boolean;
  time: string;
  message: string;
}

// GET: リマインダー設定取得
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'ユーザーIDが必要です' },
        { status: 400 }
      );
    }

    const db = admin.firestore();
    const reminderDoc = await db
      .collection('reminders')
      .doc(userId)
      .get();

    if (!reminderDoc.exists) {
      // デフォルト設定を返す
      const defaultReminders: ReminderSetting[] = [
        {
          id: 'breakfast',
          name: '朝食',
          enabled: false,
          time: '07:00',
          message: '朝食の時間だよ！'
        },
        {
          id: 'lunch',
          name: '昼食',
          enabled: false,
          time: '12:00',
          message: 'お昼の時間だよ！'
        },
        {
          id: 'dinner',
          name: '夕食',
          enabled: false,
          time: '18:00',
          message: '夕食の時間だよ！'
        },
        {
          id: 'snack',
          name: '間食',
          enabled: false,
          time: '15:00',
          message: '間食の時間だよ！'
        }
      ];

      return NextResponse.json({
        success: true,
        reminders: defaultReminders
      });
    }

    const data = reminderDoc.data();
    return NextResponse.json({
      success: true,
      reminders: data?.reminders || []
    });

  } catch (error: any) {
    console.error('リマインダー設定取得エラー:', error);
    return NextResponse.json(
      { error: error.message || 'リマインダー設定の取得に失敗しました' },
      { status: 500 }
    );
  }
}

// POST/PUT: リマインダー設定保存
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, reminders } = body;

    if (!userId || !reminders) {
      return NextResponse.json(
        { error: 'ユーザーIDとリマインダー設定が必要です' },
        { status: 400 }
      );
    }

    // バリデーション
    if (!Array.isArray(reminders)) {
      return NextResponse.json(
        { error: 'リマインダー設定は配列である必要があります' },
        { status: 400 }
      );
    }

    for (const reminder of reminders) {
      if (!reminder.id || !reminder.name || typeof reminder.enabled !== 'boolean' || !reminder.time || !reminder.message) {
        return NextResponse.json(
          { error: 'リマインダー設定の形式が正しくありません' },
          { status: 400 }
        );
      }
    }

    const db = admin.firestore();
    
    // Firestoreに保存
    await db
      .collection('reminders')
      .doc(userId)
      .set({
        reminders,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        userId
      }, { merge: true });

    return NextResponse.json({
      success: true,
      message: 'リマインダー設定を保存しました'
    });

  } catch (error: any) {
    console.error('リマインダー設定保存エラー:', error);
    return NextResponse.json(
      { error: error.message || 'リマインダー設定の保存に失敗しました' },
      { status: 500 }
    );
  }
}

// DELETE: リマインダー設定削除
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'ユーザーIDが必要です' },
        { status: 400 }
      );
    }

    const db = admin.firestore();
    await db
      .collection('reminders')
      .doc(userId)
      .delete();

    return NextResponse.json({
      success: true,
      message: 'リマインダー設定を削除しました'
    });

  } catch (error: any) {
    console.error('リマインダー設定削除エラー:', error);
    return NextResponse.json(
      { error: error.message || 'リマインダー設定の削除に失敗しました' },
      { status: 500 }
    );
  }
}