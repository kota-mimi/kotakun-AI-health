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
    case 'postback':
      await handlePostback(replyToken, source, event.postback);
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

  // 体重記録の判定（数字のみまたは数字+kg）
  const weightMatch = text.match(/^(\d{1,3}(?:\.\d+)?)\s*(?:kg)?$/);
  if (weightMatch) {
    const weight = parseFloat(weightMatch[1]);
    if (weight >= 20 && weight <= 300) { // 妥当な体重範囲
      await recordWeight(userId, weight);
      responseMessage = {
        type: 'text',
        text: `体重 ${weight}kg を記録しました！\n\n継続的な記録で健康管理を頑張りましょう 💪`
      };
      await replyMessage(replyToken, [responseMessage]);
      return;
    }
  }

  // 「記録」ボタンの応答
  if (text === '記録' || text.includes('記録')) {
    responseMessage = {
      type: 'template',
      altText: '何を記録しますか？',
      template: {
        type: 'buttons',
        text: '何を記録しますか？',
        actions: [
          {
            type: 'postback',
            label: '📊 体重',
            data: 'action=record_weight'
          },
          {
            type: 'postback',
            label: '🍽️ 食事',
            data: 'action=record_meal'
          },
          {
            type: 'postback',
            label: '🏃‍♂️ 運動',
            data: 'action=record_exercise'
          }
        ]
      }
    };
    await replyMessage(replyToken, [responseMessage]);
    return;
  }

  // 食事内容の判定を強化（より多くの食事を認識）
  const isFoodMessage = (
    // 基本的な食事キーワード
    text.includes('食事') || text.includes('料理') || text.includes('ごはん') || 
    text.includes('食べた') || text.includes('食べる') ||
    
    // 食材・主食
    text.includes('パン') || text.includes('米') || text.includes('ご飯') ||
    text.includes('麺') || text.includes('うどん') || text.includes('そば') ||
    text.includes('ラーメン') || text.includes('そうめん') || text.includes('パスタ') ||
    
    // 主菜
    text.includes('肉') || text.includes('魚') || text.includes('鶏') || text.includes('豚') ||
    text.includes('牛') || text.includes('卵') || text.includes('豆腐') ||
    
    // 野菜・副菜
    text.includes('野菜') || text.includes('サラダ') || text.includes('スープ') ||
    
    // 具体的な料理名（ひらがな・カタカナ）
    /おにぎり|おむすび|弁当|丼|カレー|シチュー|ハンバーグ|コロッケ|唐揚げ|から揚げ|焼き魚|刺身|寿司|天ぷら|フライ|煮物|炒め物|味噌汁|お味噌汁/.test(text) ||
    
    // カタカナ料理名（2文字以上）
    /[ア-ン]{2,}/.test(text) ||
    
    // 食事時間
    /朝食|昼食|夕食|夜食|間食|おやつ|朝ごはん|昼ごはん|夜ごはん|晩ごはん/.test(text) ||
    
    // 短い食べ物名（ひらがな2-4文字）
    /^[あ-ん]{2,4}$/.test(text) ||
    
    // 「○○を食べた」「○○食べました」パターン
    /を食べ|食べまし|いただき/.test(text)
  );

  if (isFoodMessage) {
    
    // 食事内容を一時保存（postbackで使用）
    await storeTempMealData(userId, text);
    
    responseMessage = {
      type: 'text',
      text: `「${text.length > 20 ? text.substring(0, 20) + '...' : text}」\n\nどうしますか？`,
      quickReply: {
        items: [
          {
            type: 'action',
            action: {
              type: 'postback',
              label: '食事を記録',
              data: 'action=save_meal'
            }
          },
          {
            type: 'action',
            action: {
              type: 'postback',
              label: 'カロリーを知るだけ',
              data: 'action=analyze_meal'
            }
          }
        ]
      }
    };
  } else {
    // その他のメッセージには反応しない
    return NextResponse.json({ status: 'ignored' });
  }

  await replyMessage(replyToken, [responseMessage]);
}

async function handleImageMessage(replyToken: string, userId: string, messageId: string) {
  try {
    // 画像を取得してAI解析
    const imageContent = await getImageContent(messageId);
    if (!imageContent) {
      await replyMessage(replyToken, [{
        type: 'text',
        text: '画像の取得に失敗しました。もう一度お試しください。'
      }]);
      return;
    }

    // 食事画像を一時保存
    await storeTempMealData(userId, '', imageContent);

    const responseMessage = {
      type: 'text',
      text: '食事写真を受け取りました！\nAIで分析しますか？',
      quickReply: {
        items: [
          {
            type: 'action',
            action: {
              type: 'postback',
              label: '食事を記録',
              data: 'action=save_meal_image'
            }
          },
          {
            type: 'action',
            action: {
              type: 'postback',
              label: 'カロリーを知るだけ',
              data: 'action=analyze_meal_image'
            }
          }
        ]
      }
    };

    await replyMessage(replyToken, [responseMessage]);
  } catch (error) {
    console.error('画像処理エラー:', error);
    await replyMessage(replyToken, [{
      type: 'text',
      text: '画像の処理中にエラーが発生しました。もう一度お試しください。'
    }]);
  }
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

// Postback処理
async function handlePostback(replyToken: string, source: any, postback: any) {
  const { userId } = source;
  const { data } = postback;
  
  const params = new URLSearchParams(data);
  const action = params.get('action');

  switch (action) {
    case 'start_record':
      // 記録ボタンと同じ処理
      await replyMessage(replyToken, [{
        type: 'template',
        altText: '何を記録しますか？',
        template: {
          type: 'buttons',
          text: '何を記録しますか？',
          actions: [
            {
              type: 'postback',
              label: '📊 体重',
              data: 'action=record_weight'
            },
            {
              type: 'postback',
              label: '🍽️ 食事',
              data: 'action=record_meal'
            },
            {
              type: 'postback',
              label: '🏃‍♂️ 運動',
              data: 'action=record_exercise'
            }
          ]
        }
      }]);
      break;

    case 'record_weight':
      await replyMessage(replyToken, [{
        type: 'text',
        text: '体重を数字で教えてください（例：65.5 または 65.5kg）'
      }]);
      break;

    case 'record_meal':
      await replyMessage(replyToken, [{
        type: 'text',
        text: '食事内容を教えてください。\nテキストまたは写真で送ってください！\n\n例：「朝食：パンとコーヒー」'
      }]);
      break;

    case 'record_exercise':
      await replyMessage(replyToken, [{
        type: 'text',
        text: '運動記録機能は準備中です！\nもうしばらくお待ちください 🏃‍♂️'
      }]);
      break;

    case 'save_meal':
    case 'save_meal_image':
      // 食事を記録する - 食事タイプ選択
      await showMealTypeSelection(replyToken);
      break;

    case 'analyze_meal':
    case 'analyze_meal_image':
      // カロリー分析のみ
      await analyzeMealOnly(userId, replyToken);
      break;

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

// 体重記録
async function recordWeight(userId: string, weight: number) {
  try {
    const firestoreService = new FirestoreService();
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    await firestoreService.updateWeight(userId, today, weight);
    console.log(`体重記録完了: ${userId}, ${weight}kg`);
  } catch (error) {
    console.error('体重記録エラー:', error);
  }
}

// 一時的な食事データ保存（メモリ）
const tempMealData = new Map<string, { text?: string; image?: Buffer; timestamp: number }>();

async function storeTempMealData(userId: string, text: string, image?: Buffer) {
  tempMealData.set(userId, {
    text,
    image,
    timestamp: Date.now()
  });
  
  // 10分後にデータを削除
  setTimeout(() => {
    tempMealData.delete(userId);
  }, 10 * 60 * 1000);
}

// 食事内容のAI分析（カロリーのみ）
async function analyzeMealOnly(userId: string, replyToken: string) {
  try {
    const tempData = tempMealData.get(userId);
    if (!tempData) {
      await replyMessage(replyToken, [{
        type: 'text',
        text: 'データが見つかりません。もう一度食事内容を送ってください。'
      }]);
      return;
    }

    const aiService = new AIHealthService();
    let analysis;

    if (tempData.image) {
      // 画像分析
      analysis = await aiService.analyzeMealFromImage(tempData.image);
    } else {
      // テキスト分析
      analysis = await aiService.analyzeMealFromText(tempData.text || '');
    }

    const originalMealName = tempData.text || analysis.foodItems?.[0] || '食事';
    const { createCalorieAnalysisFlexMessage } = await import('./new_flex_message');
    const flexMessage = createCalorieAnalysisFlexMessage(analysis, originalMealName);

    await replyMessage(replyToken, [flexMessage]);

    // 一時データを削除
    tempMealData.delete(userId);

  } catch (error) {
    console.error('食事分析エラー:', error);
    await replyMessage(replyToken, [{
      type: 'text',
      text: '分析中にエラーが発生しました。もう一度お試しください。'
    }]);
  }
}

// 食事記録を保存
async function saveMealRecord(userId: string, mealType: string, replyToken: string) {
  try {
    const tempData = tempMealData.get(userId);
    if (!tempData) {
      await replyMessage(replyToken, [{
        type: 'text',
        text: 'データが見つかりません。もう一度食事内容を送ってください。'
      }]);
      return;
    }

    const aiService = new AIHealthService();
    let analysis;

    try {
      if (tempData.image) {
        analysis = await aiService.analyzeMealFromImage(tempData.image);
      } else {
        analysis = await aiService.analyzeMealFromText(tempData.text || '');
      }
    } catch (aiError) {
      console.error('AI分析エラー、フォールバック値を使用:', aiError);
      // フォールバック分析結果
      analysis = {
        foodItems: tempData.text ? [tempData.text] : ['食事'],
        calories: 400,
        protein: 20,
        carbs: 50,
        fat: 15,
        advice: "バランスの良い食事を心がけましょう"
      };
    }

    // Firestoreに保存
    const firestoreService = new FirestoreService();
    const today = new Date().toISOString().split('T')[0];
    
    // 画像がある場合は圧縮して一時保存し、外部URLで提供
    let imageUrl = null;
    let imageId = null;
    if (tempData.image) {
      try {
        const sharp = require('sharp');
        
        // 画像を圧縮（200x200ピクセル、品質60%）
        const compressedImage = await sharp(tempData.image)
          .resize(200, 200, { fit: 'cover' })
          .jpeg({ quality: 60 })
          .toBuffer();
        
        // Base64エンコード
        const base64Data = compressedImage.toString('base64');
        
        // 一意のIDを生成
        imageId = `meal_${generateId()}`;
        
        try {
          // Firestoreの画像コレクションに保存を試行
          await admin.firestore()
            .collection('images')
            .doc(imageId)
            .set({
              base64Data: `data:image/jpeg;base64,${base64Data}`,
              mimeType: 'image/jpeg',
              createdAt: new Date(),
              userId: userId
            });
          
          // 画像URLを生成
          imageUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/image/${imageId}`;
          console.log(`画像Firestore保存完了: ${imageId}`);
        } catch (firestoreError) {
          console.error('Firestore保存エラー、フォールバックを使用:', firestoreError);
          // フォールバック: グローバルキャッシュに保存して、画像URL生成
          global.imageCache = global.imageCache || new Map();
          global.imageCache.set(imageId, `data:image/jpeg;base64,${base64Data}`);
          imageUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/image/${imageId}`;
          console.log(`フォールバック画像URL生成: ${imageUrl}`);
        }
        
        console.log(`画像圧縮完了: ${tempData.image.length} bytes → ${compressedImage.length} bytes`);
      } catch (error) {
        console.error('画像処理エラー:', error);
        // 画像なしで進行（ダミー画像は使用しない）
        imageUrl = null;
        console.log('画像処理エラー、画像なしで進行');
      }
    }
    
    // 複数食事対応の食事データ作成
    let mealData;
    if (analysis.isMultipleMeals) {
      mealData = {
        id: generateId(),
        name: tempData.text || analysis.meals?.map((m: any) => m.name).join('、') || '食事',
        mealTime: mealType as 'breakfast' | 'lunch' | 'dinner' | 'snack',
        time: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
        type: mealType,
        items: analysis.meals?.map((m: any) => m.name) || [],
        calories: analysis.totalCalories || 0,
        protein: analysis.totalProtein || 0,
        fat: analysis.totalFat || 0,
        carbs: analysis.totalCarbs || 0,
        foodItems: analysis.meals?.map((m: any) => m.name) || [],
        images: imageUrl ? [imageUrl] : [],
        image: imageUrl,
        timestamp: new Date(),
        // 複数食事の詳細情報
        meals: analysis.meals || [],
        isMultipleMeals: true
      };
    } else {
      mealData = {
        id: generateId(),
        name: tempData.text || (analysis.foodItems?.[0]) || '食事',
        mealTime: mealType as 'breakfast' | 'lunch' | 'dinner' | 'snack',
        time: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
        type: mealType,
        items: analysis.foodItems || [],
        calories: analysis.calories || 0,
        protein: analysis.protein || 0,
        fat: analysis.fat || 0,
        carbs: analysis.carbs || 0,
        foodItems: analysis.foodItems || [],
        images: imageUrl ? [imageUrl] : [],
        image: imageUrl,
        timestamp: new Date(),
        isMultipleMeals: false
      };
    }

    console.log('保存する食事データ:', JSON.stringify(mealData, null, 2));
    await firestoreService.addMeal(userId, today, mealData);

    const mealTypeJa = {
      breakfast: '朝食',
      lunch: '昼食', 
      dinner: '夕食',
      snack: '間食'
    }[mealType] || '食事';

    // スクリーンショット通りのシンプルなFlexメッセージ（食事名を渡す）
    const mealName = tempData.text || (analysis.foodItems?.[0]) || '食事'; // テキスト優先、次にAI認識した料理名
    const flexMessage = createMealFlexMessage(mealTypeJa, analysis, imageUrl, mealName);

    await replyMessage(replyToken, [flexMessage]);

    // 一時データを削除
    tempMealData.delete(userId);

  } catch (error) {
    console.error('食事記録エラー:', error);
    await replyMessage(replyToken, [{
      type: 'text',
      text: '記録中にエラーが発生しました。もう一度お試しください。'
    }]);
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