import { NextRequest, NextResponse } from 'next/server';
import { admin } from '@/lib/firebase-admin';

interface ReminderSetting {
  id: string;
  name: string;
  enabled: boolean;
  time: string;
  message: string;
}

interface UserReminder {
  userId: string;
  reminders: ReminderSetting[];
}

// 現在時刻（JST）の時:分を取得
function getCurrentTimeJST(): string {
  const now = new Date();
  const jstTime = new Date(now.getTime() + (9 * 60 * 60 * 1000)); // JST = UTC+9
  return jstTime.toTimeString().slice(0, 5); // "HH:MM" 形式
}

// LINE Messaging APIでプッシュメッセージを送信
async function sendLineMessage(userId: string, message: string): Promise<boolean> {
  try {
    const lineAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
    
    if (!lineAccessToken) {
      console.error('❌ LINE_CHANNEL_ACCESS_TOKEN が設定されていません');
      return false;
    }

    const response = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${lineAccessToken}`,
      },
      body: JSON.stringify({
        to: userId,
        messages: [
          {
            type: 'text',
            text: message
          }
        ]
      }),
    });

    if (response.ok) {
      console.log(`✅ LINE通知送信成功: ${userId}`);
      return true;
    } else {
      const errorText = await response.text();
      console.error(`❌ LINE通知送信失敗: ${response.status} - ${errorText}`);
      return false;
    }
  } catch (error) {
    console.error('❌ LINE通知送信エラー:', error);
    return false;
  }
}

// GET: リマインダーチェック実行
export async function GET(request: NextRequest) {
  try {
    console.log('🔔 リマインダーチェック開始');
    
    const currentTime = getCurrentTimeJST();
    console.log(`⏰ 現在時刻 (JST): ${currentTime}`);

    const db = admin.firestore();
    
    // 全ユーザーのリマインダー設定を取得
    const usersCollection = await db.collection('users').get();
    
    if (usersCollection.empty) {
      console.log('📝 ユーザーが見つかりません');
      return NextResponse.json({
        success: true,
        message: 'ユーザーなし',
        checkedTime: currentTime
      });
    }

    let notificationsSent = 0;
    const notifications: Array<{userId: string, reminder: string, status: string}> = [];

    // 各ユーザーの設定をチェック
    for (const userDoc of usersCollection.docs) {
      const userId = userDoc.id;
      
      // ユーザーのリマインダー設定を取得
      const reminderDoc = await db
        .collection('users')
        .doc(userId)
        .collection('reminders')
        .doc('settings')
        .get();
      
      if (!reminderDoc.exists) {
        continue;
      }
      
      const data = reminderDoc.data() as { reminders: ReminderSetting[] };
      
      if (!data.reminders || !Array.isArray(data.reminders)) {
        continue;
      }

      // 現在時刻と一致するリマインダーを検索
      for (const reminder of data.reminders) {
        if (reminder.enabled && reminder.time === currentTime) {
          console.log(`🔔 リマインダー発火: ${userId} - ${reminder.name} (${reminder.time})`);
          
          const success = await sendLineMessage(userId, reminder.message);
          
          notifications.push({
            userId,
            reminder: `${reminder.name} (${reminder.time})`,
            status: success ? 'success' : 'failed'
          });

          if (success) {
            notificationsSent++;
          }
        }
      }
    }

    console.log(`✅ リマインダーチェック完了: ${notificationsSent}件送信`);

    return NextResponse.json({
      success: true,
      message: `リマインダーチェック完了`,
      checkedTime: currentTime,
      notificationsSent,
      notifications
    });

  } catch (error: any) {
    console.error('❌ リマインダーチェックエラー:', error);
    return NextResponse.json(
      { error: error.message || 'リマインダーチェックに失敗しました' },
      { status: 500 }
    );
  }
}

// POST: 手動リマインダーテスト（開発用）
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, message } = body;

    if (!userId || !message) {
      return NextResponse.json(
        { error: 'userIdとmessageが必要です' },
        { status: 400 }
      );
    }

    console.log(`🧪 手動リマインダーテスト: ${userId}`);
    
    const success = await sendLineMessage(userId, message);

    return NextResponse.json({
      success,
      message: success ? 'テスト通知送信成功' : 'テスト通知送信失敗',
      userId,
      testMessage: message
    });

  } catch (error: any) {
    console.error('❌ 手動リマインダーテストエラー:', error);
    return NextResponse.json(
      { error: error.message || '手動テストに失敗しました' },
      { status: 500 }
    );
  }
}