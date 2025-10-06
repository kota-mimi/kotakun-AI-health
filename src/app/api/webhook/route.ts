import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { FirestoreService } from '@/services/firestoreService';
import AIHealthService from '@/services/aiService';
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { admin } from '@/lib/firebase-admin';
import { createMealFlexMessage } from './new_flex_message';
import { generateId } from '@/lib/utils';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  try {
    console.log('🔥 LINE Webhook呼び出し開始');
    const body = await request.text();
    const signature = request.headers.get('x-line-signature') || '';
    
    // LINE署名を検証
    if (!verifySignature(body, signature)) {
      console.error('🔥 署名検証失敗');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const parsedBody = JSON.parse(body);
    const events = parsedBody.events;
    
    // 各イベントを処理
    for (const event of events) {
      await handleEvent(event);
    }

    return NextResponse.json({ status: 'OK' });
  } catch (error) {
    console.error('🔥 致命的なWebhookエラー:', error);
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
    case 'postback':
      await handlePostback(replyToken, source, event.postback);
      break;
    default:
      console.log('Unknown event type:', type);
  }
}

async function handleMessage(replyToken: string, source: any, message: any) {
  const { userId } = source;
  
  // ユーザー認証
  const db = admin.firestore();
  const userRef = db.collection('users').doc(userId);
  const userSnap = await userRef.get();
  
  const user = userSnap.exists ? {
    ...userSnap.data(),
    userId: userSnap.id,
  } : null;
  
  if (!user || !user.profile) {
    // 未登録ユーザーへの応答
    await replyMessage(replyToken, [{
      type: 'template',
      altText: 'アプリに登録して健康管理を始めましょう！',
      template: {
        type: 'buttons',
        text: 'まずはアプリに登録して\nあなた専用の健康プランを作成しませんか？',
        actions: [{
          type: 'uri',
          label: 'アプリに登録する',
          uri: process.env.NEXT_PUBLIC_LIFF_ID ? `https://liff.line.me/${process.env.NEXT_PUBLIC_LIFF_ID}/counseling` : `${process.env.NEXT_PUBLIC_APP_URL}/counseling`
        }]
      }
    }]);
    return;
  }
  
  switch (message.type) {
    case 'text':
      await handleTextMessage(replyToken, userId, message.text, user);
      break;
    case 'image':
      await handleImageMessage(replyToken, userId, message.id, user);
      break;
    default:
      await replyMessage(replyToken, [{
        type: 'text',
        text: 'すみません、このタイプのメッセージには対応していません。'
      }]);
  }
}

async function handleTextMessage(replyToken: string, userId: string, text: string, user: any) {
  // 食事記録かチェック
  const isFoodName = (
    /カレー|ラーメン|うどん|そば|パン|おにぎり|弁当|サラダ|寿司|パスタ|ご飯|丼|定食|ハンバーグ|唐揚げ|焼き魚|天ぷら|味噌汁|スープ/.test(text) &&
    !/(記録|食べた|です|でした|ました|だった|？|\?|って|どう|カロリー|栄養|太る|痩せる|ダイエット|健康|教えて|知りたい)/.test(text) &&
    text.length <= 15
  );

  if (isFoodName) {
    // テキスト分析して食事タイプ選択表示
    try {
      const aiService = new AIHealthService();
      const mealAnalysis = await aiService.analyzeMealFromText(text);
      
      // 分析結果を一時保存
      await storeTempMealAnalysis(userId, mealAnalysis);
      
      // 食事タイプ選択のクイックリプライ表示
      await showMealTypeSelection(replyToken);
      
      return;
    } catch (error) {
      console.error('テキスト分析エラー:', error);
    }
  }

  // その他のメッセージには一般会話AIで応答
  const aiService = new AIHealthService();
  const aiResponse = await aiService.generateGeneralResponse(text);
  
  await replyMessage(replyToken, [{
    type: 'text',
    text: aiResponse || 'すみません、よく分からなかったです。健康管理についてお手伝いできることがあれば、お気軽にお声がけください！'
  }]);
}

async function handleImageMessage(replyToken: string, userId: string, messageId: string, user: any) {
  try {
    console.log('🔥 シンプル画像処理開始:', { userId, messageId });
    
    // 1. 画像を取得
    const imageContent = await getImageContent(messageId);
    if (!imageContent) {
      await replyMessage(replyToken, [{
        type: 'text',
        text: '画像がうまく受け取れなかった！もう一度送ってみて？'
      }]);
      return;
    }

    // 2. AI分析実行
    const aiService = new AIHealthService();
    const mealAnalysis = await aiService.analyzeMealFromImage(imageContent);
    
    // 3. 分析結果を一時保存（食事タイプ選択のため）
    await storeTempMealAnalysis(userId, mealAnalysis, imageContent);
    
    // 4. 食事タイプ選択のクイックリプライ表示
    await showMealTypeSelection(replyToken);
    
    console.log('🔥 シンプル画像処理完了');
    
  } catch (error) {
    console.error('🔥 画像処理エラー:', error);
    await replyMessage(replyToken, [{
      type: 'text',
      text: '画像の処理でちょっと問題が起きちゃった！もう一度試してみて？'
    }]);
  }
}

async function handleFollow(replyToken: string, source: any) {
  const welcomeMessage = {
    type: 'template',
    altText: 'LINE健康管理へようこそ！',
    template: {
      type: 'buttons',
      text: 'LINE健康管理へようこそ！\n\nあなた専用の健康プランを作成しませんか？',
      actions: [{
        type: 'uri',
        label: 'カウンセリング開始',
        uri: process.env.NEXT_PUBLIC_LIFF_ID ? `https://liff.line.me/${process.env.NEXT_PUBLIC_LIFF_ID}/counseling` : `${process.env.NEXT_PUBLIC_APP_URL}/counseling`
      }]
    }
  };

  await replyMessage(replyToken, [welcomeMessage]);
}

async function handlePostback(replyToken: string, source: any, postback: any) {
  const { userId } = source;
  const { data } = postback;
  
  const params = new URLSearchParams(data);
  const action = params.get('action');

  switch (action) {
    case 'meal_breakfast':
    case 'meal_lunch':
    case 'meal_dinner':
    case 'meal_snack':
      const mealType = action.replace('meal_', '');
      await saveMealRecord(userId, mealType, replyToken);
      break;
    default:
      console.log('Unknown postback action:', action);
  }
}

// 食事タイプ選択画面
async function showMealTypeSelection(replyToken: string) {
  const responseMessage = {
    type: 'text',
    text: 'どの食事を記録しますか？',
    quickReply: {
      items: [
        {
          type: 'action',
          action: {
            type: 'postback',
            label: '朝食',
            data: 'action=meal_breakfast'
          }
        },
        {
          type: 'action',
          action: {
            type: 'postback',
            label: '昼食',
            data: 'action=meal_lunch'
          }
        },
        {
          type: 'action',
          action: {
            type: 'postback',
            label: '夕食',
            data: 'action=meal_dinner'
          }
        },
        {
          type: 'action',
          action: {
            type: 'postback',
            label: '間食',
            data: 'action=meal_snack'
          }
        }
      ]
    }
  };
  
  await replyMessage(replyToken, [responseMessage]);
}

// 食事記録を保存
async function saveMealRecord(userId: string, mealType: string, replyToken: string) {
  try {
    console.log('🔥 食事保存開始:', { userId, mealType });
    
    // 一時保存されたAI分析結果を取得
    const tempData = await getTempMealAnalysis(userId);
    if (!tempData) {
      await replyMessage(replyToken, [{
        type: 'text',
        text: 'データが見つかりません。もう一度食事内容を送ってください。'
      }]);
      return;
    }

    // Flexメッセージ作成・送信
    const user = await getUserData(userId);
    const flexMessage = createMealFlexMessage(tempData.analysis, user);
    await replyMessage(replyToken, [flexMessage]);
    
    // 直接保存
    await saveMealDirectly(userId, mealType, tempData.analysis, tempData.imageContent);
    
    console.log('🔥 食事保存完了');
    
  } catch (error) {
    console.error('🔥 食事保存エラー:', error);
    await replyMessage(replyToken, [{
      type: 'text',
      text: '保存中にエラーが発生しました。もう一度お試しください。'
    }]);
  }
}

// シンプルな直接保存関数
async function saveMealDirectly(userId: string, mealType: string, mealAnalysis: any, imageContent?: Buffer) {
  try {
    console.log('🔥 直接保存開始:', { userId, mealType, hasImage: !!imageContent });
    
    const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' });
    const currentTime = new Date().toLocaleTimeString('ja-JP', { 
      hour: '2-digit', 
      minute: '2-digit',
      timeZone: 'Asia/Tokyo'
    });
    
    // 画像をFirebase Storageに保存（あれば）
    let imageUrl = null;
    if (imageContent) {
      const imageId = `meal_${generateId()}`;
      const storageRef = ref(storage, `meals/${userId}/${today}/${imageId}.jpg`);
      await uploadBytes(storageRef, imageContent);
      imageUrl = await getDownloadURL(storageRef);
    }
    
    // 食事データ作成
    const mealData = {
      id: generateId(),
      name: mealAnalysis.foodItems?.[0] || mealAnalysis.meals?.[0]?.name || '食事',
      calories: mealAnalysis.calories || mealAnalysis.totalCalories || 400,
      protein: mealAnalysis.protein || mealAnalysis.totalProtein || 20,
      fat: mealAnalysis.fat || mealAnalysis.totalFat || 15,
      carbs: mealAnalysis.carbs || mealAnalysis.totalCarbs || 50,
      time: currentTime,
      image: imageUrl,
      createdAt: new Date(),
      lineUserId: userId
    };
    
    // Firestoreに直接保存
    const db = admin.firestore();
    await db.collection('users').doc(userId)
      .collection('dailyRecords').doc(today)
      .collection('meals').doc(mealData.id)
      .set({
        ...mealData,
        mealType
      });
    
    console.log('🔥 直接保存完了:', { mealId: mealData.id, mealType });
    
  } catch (error) {
    console.error('🔥 直接保存エラー:', error);
    throw error;
  }
}

// 簡単な一時保存関数
async function storeTempMealAnalysis(userId: string, mealAnalysis: any, imageContent?: Buffer) {
  try {
    const db = admin.firestore();
    await db.collection('users').doc(userId).collection('tempMealData').doc('current').set({
      analysis: mealAnalysis,
      image: imageContent ? imageContent.toString('base64') : null,
      createdAt: new Date()
    });
  } catch (error) {
    console.error('一時保存エラー:', error);
  }
}

async function getTempMealAnalysis(userId: string) {
  try {
    const db = admin.firestore();
    const doc = await db.collection('users').doc(userId).collection('tempMealData').doc('current').get();
    if (doc.exists) {
      const data = doc.data();
      return {
        analysis: data.analysis,
        imageContent: data.image ? Buffer.from(data.image, 'base64') : null
      };
    }
    return null;
  } catch (error) {
    console.error('一時取得エラー:', error);
    return null;
  }
}

// ユーザーデータ取得関数
async function getUserData(userId: string) {
  try {
    const db = admin.firestore();
    const userDoc = await db.collection('users').doc(userId).get();
    return userDoc.exists ? userDoc.data() : {};
  } catch (error) {
    console.error('ユーザーデータ取得エラー:', error);
    return {};
  }
}

async function getImageContent(messageId: string): Promise<Buffer | null> {
  try {
    const accessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
    if (!accessToken) {
      console.error('LINE_CHANNEL_ACCESS_TOKEN が設定されていません');
      return null;
    }

    const response = await fetch(`https://api-data.line.me/v2/bot/message/${messageId}/content`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      console.error('画像取得失敗:', response.status, response.statusText);
      return null;
    }
    
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    console.error('画像取得エラー:', error);
    return null;
  }
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