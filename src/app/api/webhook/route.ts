import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-line-signature') || '';
    
    // LINE署名を検証
    if (!verifySignature(body, signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const events = JSON.parse(body).events;

    // 各イベントを処理
    for (const event of events) {
      await handleEvent(event);
    }

    return NextResponse.json({ status: 'OK' });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function verifySignature(body: string, signature: string): boolean {
  const channelSecret = process.env.LINE_CHANNEL_SECRET;
  if (!channelSecret) return false;

  const hash = crypto
    .createHmac('sha256', channelSecret)
    .update(body, 'utf8')
    .digest('base64');

  return hash === signature;
}

async function handleEvent(event: any) {
  const { type, replyToken, source, message } = event;

  switch (type) {
    case 'message':
      await handleMessage(replyToken, source, message);
      break;
    case 'follow':
      await handleFollow(replyToken, source);
      break;
    case 'unfollow':
      console.log('User unfollowed:', source.userId);
      break;
    default:
      console.log('Unknown event type:', type);
  }
}

async function handleMessage(replyToken: string, source: any, message: any) {
  const { userId } = source;
  
  switch (message.type) {
    case 'text':
      await handleTextMessage(replyToken, userId, message.text);
      break;
    case 'image':
      await handleImageMessage(replyToken, userId, message.id);
      break;
    default:
      await replyMessage(replyToken, [{
        type: 'text',
        text: 'すみません、このタイプのメッセージには対応していません。'
      }]);
  }
}

async function handleTextMessage(replyToken: string, userId: string, text: string) {
  let responseMessage;

  // キーワードに基づく自動応答
  if (text.includes('食事') || text.includes('料理') || text.includes('ごはん')) {
    responseMessage = {
      type: 'template',
      altText: '食事を記録しましょう',
      template: {
        type: 'buttons',
        text: '食事を記録しますか？',
        actions: [
          {
            type: 'uri',
            label: '食事を撮影して記録',
            uri: `${process.env.NEXT_PUBLIC_APP_URL}/meals/add`
          },
          {
            type: 'uri',
            label: 'アプリを開く',
            uri: process.env.NEXT_PUBLIC_LIFF_ID ? `https://liff.line.me/${process.env.NEXT_PUBLIC_LIFF_ID}` : process.env.NEXT_PUBLIC_APP_URL || ''
          }
        ]
      }
    };
  } else if (text.includes('レポート') || text.includes('分析') || text.includes('結果')) {
    responseMessage = {
      type: 'template',
      altText: '健康レポートを確認',
      template: {
        type: 'buttons',
        text: '健康レポートを確認しますか？',
        actions: [
          {
            type: 'uri',
            label: 'レポートを見る',
            uri: `${process.env.NEXT_PUBLIC_APP_URL}/reports`
          }
        ]
      }
    };
  } else {
    // デフォルトレスポンス
    responseMessage = {
      type: 'template',
      altText: 'LINE健康管理アプリ',
      template: {
        type: 'buttons',
        text: 'こんにちは！何をお手伝いしましょうか？',
        actions: [
          {
            type: 'uri',
            label: 'アプリを開く',
            uri: process.env.NEXT_PUBLIC_LIFF_ID ? `https://liff.line.me/${process.env.NEXT_PUBLIC_LIFF_ID}` : process.env.NEXT_PUBLIC_APP_URL || ''
          },
          {
            type: 'postback',
            label: '今日の記録を見る',
            data: 'action=today_summary'
          }
        ]
      }
    };
  }

  await replyMessage(replyToken, [responseMessage]);
}

async function handleImageMessage(replyToken: string, userId: string, messageId: string) {
  // 画像メッセージの処理（食事写真と仮定）
  const responseMessage = {
    type: 'template',
    altText: '食事写真を分析中...',
    template: {
      type: 'buttons',
      text: '食事写真を受け取りました！\nAIで分析してアプリに記録しますか？',
      actions: [
        {
          type: 'uri',
          label: '分析結果を見る',
          uri: `${process.env.NEXT_PUBLIC_APP_URL}/meals/analyze?messageId=${messageId}`
        },
        {
          type: 'postback',
          label: 'この写真を削除',
          data: `action=delete_image&messageId=${messageId}`
        }
      ]
    }
  };

  await replyMessage(replyToken, [responseMessage]);
}

async function handleFollow(replyToken: string, source: any) {
  const { userId } = source;
  
  // 新規ユーザーの場合、カウンセリングへ誘導
  const welcomeMessage = {
    type: 'template',
    altText: 'LINE健康管理へようこそ！',
    template: {
      type: 'buttons',
      text: 'LINE健康管理へようこそ！\n\nあなた専用の健康プランを作成しませんか？',
      actions: [
        {
          type: 'uri',
          label: 'カウンセリング開始',
          uri: process.env.NEXT_PUBLIC_LIFF_ID ? `https://liff.line.me/${process.env.NEXT_PUBLIC_LIFF_ID}/counseling` : `${process.env.NEXT_PUBLIC_APP_URL}/counseling`
        }
      ]
    }
  };

  await replyMessage(replyToken, [welcomeMessage]);
}

async function replyMessage(replyToken: string, messages: any[]) {
  const accessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  
  if (!accessToken) {
    console.error('LINE_CHANNEL_ACCESS_TOKEN is not set');
    return;
  }

  try {
    const response = await fetch('https://api.line.me/v2/bot/message/reply', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        replyToken,
        messages,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Failed to reply message:', error);
    }
  } catch (error) {
    console.error('Error replying message:', error);
  }
}

// プッシュメッセージ送信用の関数（他のAPIから呼び出し可能）
export async function pushMessage(userId: string, messages: any[]) {
  const accessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  
  if (!accessToken) {
    console.error('LINE_CHANNEL_ACCESS_TOKEN is not set');
    return;
  }

  try {
    const response = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        to: userId,
        messages,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Failed to push message:', error);
    }
  } catch (error) {
    console.error('Error pushing message:', error);
  }
}