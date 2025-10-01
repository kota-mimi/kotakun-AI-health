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
    console.log('🔥 LINE Webhook呼び出し開始');
    const body = await request.text();
    const signature = request.headers.get('x-line-signature') || '';
    
    console.log('🔥 受信データ:', body.substring(0, 200));
    
    // LINE署名を検証
    if (!verifySignature(body, signature)) {
      console.log('🔥 署名検証失敗');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    console.log('🔥 署名検証成功');
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

  // 運動記録の判定（パターンマッチング + AI フォールバック）
  const exerciseResult = await handleExerciseMessage(replyToken, userId, text);
  if (exerciseResult) {
    return; // 運動記録として処理済み
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
    await replyMessage(replyToken, [responseMessage]);
    return;
  }

  // その他のメッセージには反応しない（運動記録、食事記録、記録ボタン以外）
  return NextResponse.json({ status: 'ignored' });
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
        text: '運動内容を教えてください！\n\n例：\n・ランニング30分\n・ベンチプレス45分\n・筋トレ1時間\n・ヨガ20分',
        quickReply: {
          items: [
            { type: 'action', action: { type: 'text', label: 'ランニング30分' } },
            { type: 'action', action: { type: 'text', label: '筋トレ45分' } },
            { type: 'action', action: { type: 'text', label: 'ウォーキング20分' } },
            { type: 'action', action: { type: 'text', label: 'ヨガ30分' } }
          ]
        }
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

// 運動記録機能
// 基本運動パターン（固定）
const BASIC_EXERCISE_PATTERNS = [
  // 詳細筋トレパターン（重量×回数×セット）
  { 
    pattern: /^(ベンチプレス|スクワット|デッドリフト|懸垂|腕立て伏せ|腹筋|背筋|肩トレ)\s*(\d+(?:\.\d+)?)kg\s*(\d+)回\s*(\d+)セット$/i, 
    type: 'strength_detailed',
    captureGroups: ['exercise', 'weight', 'reps', 'sets']
  },
  
  // 距離+時間パターン
  { 
    pattern: /^(ランニング|ウォーキング|ジョギング|サイクリング)\s*(\d+(?:\.\d+)?)km\s*(\d+)分$/i, 
    type: 'cardio_distance',
    captureGroups: ['exercise', 'distance', 'duration']
  },
  
  // 重量×回数パターン（セット数なし）
  { 
    pattern: /^(ベンチプレス|スクワット|デッドリフト|懸垂|腕立て伏せ|腹筋|背筋|肩トレ)\s*(\d+(?:\.\d+)?)kg\s*(\d+)回$/i, 
    type: 'strength_weight_reps',
    captureGroups: ['exercise', 'weight', 'reps']
  },
  
  // 距離のみパターン
  { 
    pattern: /^(ランニング|ウォーキング|ジョギング|サイクリング)\s*(\d+(?:\.\d+)?)km$/i, 
    type: 'cardio_distance_only',
    captureGroups: ['exercise', 'distance']
  },
  
  // 有酸素運動（時間のみ）
  { pattern: /^(ランニング|ウォーキング|ジョギング|サイクリング|水泳|エアロビクス)\s*(\d+)\s*(分|時間)$/i, type: 'cardio' },
  
  // 筋力トレーニング（時間・回数・セット）
  { pattern: /^(ベンチプレス|スクワット|デッドリフト|懸垂|腕立て伏せ|腹筋|背筋|肩トレ)\s*(\d+)\s*(分|回|セット)$/i, type: 'strength' },
  
  // スポーツ
  { pattern: /^(テニス|バドミントン|卓球|バスケ|サッカー|野球|ゴルフ)\s*(\d+)\s*(分|時間)$/i, type: 'sports' },
  
  // その他
  { pattern: /^(ヨガ|ピラティス|ストレッチ|ダンス|筋トレ|ジム)\s*(\d+)\s*(分|時間)$/i, type: 'flexibility' }
];

// METs値マップ（カロリー計算用）
const EXERCISE_METS = {
  'ランニング': 8.0,
  'ウォーキング': 3.5,
  'ジョギング': 6.0,
  'サイクリング': 6.8,
  '水泳': 6.0,
  'エアロビクス': 7.3,
  'ベンチプレス': 6.0,
  'スクワット': 5.0,
  'デッドリフト': 6.0,
  '懸垂': 8.0,
  '腕立て伏せ': 4.0,
  '腹筋': 4.0,
  '背筋': 4.0,
  '肩トレ': 5.0,
  'テニス': 7.3,
  'バドミントン': 5.5,
  '卓球': 4.0,
  'バスケ': 6.5,
  'サッカー': 7.0,
  '野球': 5.0,
  'ゴルフ': 4.8,
  'ヨガ': 2.5,
  'ピラティス': 3.0,
  'ストレッチ': 2.3,
  'ダンス': 4.8,
  '筋トレ': 6.0,
  'ジム': 5.5
};

// 動的パターンキャッシュ（ユーザー別）
const userExercisePatterns = new Map();

// ユーザーセッション管理（最後の運動を30分間記憶）
const userSessions = new Map();

// 継続セット記録のパターンチェック
function checkContinuationPattern(userId: string, text: string) {
  // ユーザーセッションを確認
  const session = userSessions.get(userId);
  if (!session) return null;
  
  // セッションが30分以内かチェック
  const now = Date.now();
  if (now - session.timestamp > 30 * 60 * 1000) {
    userSessions.delete(userId);
    return null;
  }
  
  // 継続パターン（重さ + 回数のみ）
  const patterns = [
    /^(\d+(?:\.\d+)?)kg?\s*(\d+)回?$/i,
    /^(\d+(?:\.\d+)?)\s*kg?\s*(\d+)\s*rep?s?$/i,
    /^(\d+(?:\.\d+)?)\s*(\d+)$/,  // "65 8" のような省略形
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return {
        weight: parseFloat(match[1]),
        reps: parseInt(match[2]),
        exerciseName: session.exerciseName,
        type: session.type,
        userId: userId,
        sessionId: session.sessionId
      };
    }
  }
  
  return null;
}

// 継続セット記録処理
async function recordContinuationSet(userId: string, match: any, replyToken: string) {
  try {
    const firestoreService = new FirestoreService();
    const dateStr = new Date().toISOString().split('T')[0];
    
    // 既存の運動記録を取得
    const dailyRecord = await firestoreService.getDailyRecord(userId, dateStr);
    
    if (!dailyRecord || !dailyRecord.exercises) {
      throw new Error('既存の運動記録が見つかりません');
    }
    
    // 同じセッションIDの運動を探す
    const session = userSessions.get(userId);
    let targetExercise = null;
    
    console.log('🔍 継続セット記録 - セッション情報:', session);
    console.log('🔍 継続セット記録 - 利用可能な運動一覧:', dailyRecord.exercises.map(ex => ({ name: ex.name, id: ex.id })));
    
    for (let i = dailyRecord.exercises.length - 1; i >= 0; i--) {
      const exercise = dailyRecord.exercises[i];
      console.log(`🔍 検索中: ${exercise.name} === ${match.exerciseName} && ${exercise.id} === ${session.sessionId}`);
      if (exercise.name === match.exerciseName && exercise.id === session.sessionId) {
        targetExercise = exercise;
        console.log('✅ 対象運動発見:', targetExercise);
        break;
      }
    }
    
    if (!targetExercise) {
      throw new Error('対象の運動記録が見つかりません');
    }
    
    // 新しいセットを追加
    const newSet = {
      weight: match.weight,
      reps: match.reps
    };
    
    if (!targetExercise.sets) {
      targetExercise.sets = [];
    }
    targetExercise.sets.push(newSet);
    
    // セット数に応じてカロリーと時間を更新
    const setCount = targetExercise.sets.length;
    targetExercise.duration = setCount * 3; // 1セットあたり3分と仮定
    targetExercise.calories = Math.round(setCount * 25 * (match.weight / 60)); // 重量に応じてカロリー調整
    
    // Firestoreを更新
    await firestoreService.saveDailyRecord(userId, dateStr, dailyRecord);
    
    // 返信メッセージ
    const setNumber = targetExercise.sets.length;
    const message = `${match.exerciseName} ${setNumber}セット目を記録しました！\n${match.weight}kg × ${match.reps}回\n\n続けて重さと回数を送信すると${setNumber + 1}セット目として記録されます。`;
    
    await replyMessage(replyToken, [{
      type: 'text',
      text: message
    }]);
    
    console.log('継続セット記録完了:', { exerciseName: match.exerciseName, setNumber, weight: match.weight, reps: match.reps });
    
  } catch (error) {
    console.error('継続セット記録エラー:', error);
    await replyMessage(replyToken, [{
      type: 'text',
      text: '継続セットの記録でエラーが発生しました。最初から運動名と一緒に記録してください。'
    }]);
  }
}

// 運動記録のメイン処理
async function handleExerciseMessage(replyToken: string, userId: string, text: string): Promise<boolean> {
  try {
    console.log('=== 運動記録処理開始 ===');
    console.log('入力テキスト:', text);
    
    // 継続セット記録機能は無効化
    // const continuationMatch = checkContinuationPattern(userId, text);
    // if (continuationMatch) {
    //   console.log('継続セット記録:', continuationMatch);
    //   await recordContinuationSet(userId, continuationMatch, replyToken);
    //   return true;
    // }
    
    // Step 1: 基本パターンマッチング
    let match = checkBasicExercisePatterns(text);
    console.log('基本パターンマッチ結果:', match);
    
    if (!match) {
      // Step 2: ユーザー固有の動的パターンチェック
      await updateUserExercisePatterns(userId);
      match = checkUserExercisePatterns(userId, text);
      console.log('ユーザーパターンマッチ結果:', match);
    }
    
    if (match) {
      // パターンマッチング成功 - 即座に記録
      console.log('パターンマッチ成功、記録開始');
      await recordExerciseFromMatch(userId, match, replyToken);
      return true;
    }
    
    // Step 3: 運動キーワード検出
    const hasKeywords = containsExerciseKeywords(text);
    console.log('運動キーワード検出:', hasKeywords);
    
    if (hasKeywords) {
      // Step 4: AI解析フォールバック
      const aiResult = await analyzeExerciseWithAI(userId, text);
      if (aiResult) {
        await handleAIExerciseResult(userId, aiResult, replyToken);
        return true;
      }
      
      // AI解析でも不明な場合は確認
      console.log('AI解析失敗、確認メッセージ送信');
      await askForExerciseDetails(replyToken, text);
      return true;
    }
    
    console.log('運動関連ではないと判定');
    return false; // 運動関連ではない
    
  } catch (error) {
    console.error('運動記録処理エラー:', error);
    return false;
  }
}

// 基本パターンマッチング
function checkBasicExercisePatterns(text: string) {
  for (const patternObj of BASIC_EXERCISE_PATTERNS) {
    const { pattern, type, captureGroups } = patternObj;
    const match = text.match(pattern);
    if (match) {
      // 詳細パターンの処理
      if (type === 'strength_detailed') {
        return {
          exerciseName: match[1],
          weight: parseFloat(match[2]),
          reps: parseInt(match[3]),
          sets: parseInt(match[4]),
          type: 'strength',
          source: 'detailed_pattern',
          detailType: 'weight_reps_sets'
        };
      }
      
      if (type === 'cardio_distance') {
        return {
          exerciseName: match[1],
          distance: parseFloat(match[2]),
          duration: parseInt(match[3]),
          type: 'cardio',
          source: 'detailed_pattern',
          detailType: 'distance_duration'
        };
      }
      
      if (type === 'strength_weight_reps') {
        return {
          exerciseName: match[1],
          weight: parseFloat(match[2]),
          reps: parseInt(match[3]),
          sets: 1, // デフォルト1セット
          type: 'strength',
          source: 'detailed_pattern',
          detailType: 'weight_reps'
        };
      }
      
      if (type === 'cardio_distance_only') {
        return {
          exerciseName: match[1],
          distance: parseFloat(match[2]),
          duration: null, // 時間なし
          type: 'cardio',
          source: 'detailed_pattern',
          detailType: 'distance_only'
        };
      }
      
      // 従来の基本パターン
      return {
        exerciseName: match[1],
        value: parseInt(match[2]),
        unit: match[3],
        type: type,
        source: 'basic_pattern'
      };
    }
  }
  return null;
}

// ユーザー固有パターンの動的生成・更新
async function updateUserExercisePatterns(userId: string) {
  try {
    const firestoreService = new FirestoreService();
    
    // ユーザーの過去の運動記録を取得（最近30日分）
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    
    const userExercises = await getUserExerciseHistory(userId, startDate, endDate);
    
    if (userExercises.length > 0) {
      const uniqueExercises = [...new Set(userExercises.map(ex => ex.name))];
      const patterns = generateUserExercisePatterns(uniqueExercises);
      userExercisePatterns.set(userId, patterns);
      console.log(`ユーザー ${userId} の動的パターン更新: ${uniqueExercises.join(', ')}`);
    }
  } catch (error) {
    console.error('ユーザーパターン更新エラー:', error);
  }
}

// ユーザーの運動履歴を取得
async function getUserExerciseHistory(userId: string, startDate: Date, endDate: Date) {
  try {
    const firestoreService = new FirestoreService();
    const exercises = [];
    
    // 期間内の各日をチェック
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      try {
        const dailyData = await firestoreService.getDailyRecord(userId, dateStr);
        if (dailyData && dailyData.exercises) {
          exercises.push(...dailyData.exercises);
        }
      } catch (error) {
        // 日付データがない場合は無視
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return exercises;
  } catch (error) {
    console.error('運動履歴取得エラー:', error);
    return [];
  }
}

// ユーザー固有パターンの生成
function generateUserExercisePatterns(exerciseNames: string[]) {
  const escapedNames = exerciseNames.map(name => name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const namePattern = `(${escapedNames.join('|')})`;
  
  return [
    { pattern: new RegExp(`^${namePattern}\\s*(\\d+)\\s*(分|時間)$`, 'i'), type: 'user_exercise' },
    { pattern: new RegExp(`^${namePattern}\\s*(\\d+)\\s*(回|セット)$`, 'i'), type: 'user_exercise' },
    { pattern: new RegExp(`^${namePattern}\\s*(\\d+)$`, 'i'), type: 'user_exercise' } // 単位なし
  ];
}

// ユーザーパターンチェック
function checkUserExercisePatterns(userId: string, text: string) {
  const patterns = userExercisePatterns.get(userId);
  if (!patterns) return null;
  
  for (const { pattern, type } of patterns) {
    const match = text.match(pattern);
    if (match) {
      return {
        exerciseName: match[1],
        value: parseInt(match[2]),
        unit: match[3] || '分', // デフォルト単位
        type: type,
        source: 'user_pattern'
      };
    }
  }
  return null;
}

// 運動キーワード検出
function containsExerciseKeywords(text: string): boolean {
  const exerciseKeywords = [
    '運動', '筋トレ', 'トレーニング', 'ワークアウト', 'ジム', 'フィットネス',
    'ランニング', 'ウォーキング', 'ジョギング', 'マラソン',
    'ベンチプレス', 'スクワット', 'デッドリフト', '懸垂', '腕立て', '腹筋',
    'ヨガ', 'ピラティス', 'ストレッチ', 'ダンス',
    'テニス', 'バドミントン', '卓球', 'バスケ', 'サッカー', '野球', 'ゴルフ',
    '水泳', 'サイクリング', 'エアロビクス'
  ];
  
  return exerciseKeywords.some(keyword => text.includes(keyword));
}

// パターンマッチ結果から運動記録
async function recordExerciseFromMatch(userId: string, match: any, replyToken: string) {
  try {
    const { exerciseName, type, source, detailType } = match;
    
    // 詳細パターンの処理
    if (source === 'detailed_pattern') {
      return await recordDetailedExercise(userId, match, replyToken);
    }
    
    // 従来の基本パターンの処理
    const { value, unit } = match;
    
    // 時間を分に統一
    let durationInMinutes = value;
    if (unit === '時間') {
      durationInMinutes = value * 60;
    } else if (unit === '回' || unit === 'セット') {
      // 回数・セット数の場合は推定時間を計算（1回=0.5分、1セット=5分）
      durationInMinutes = unit === '回' ? Math.max(value * 0.5, 5) : value * 5;
    }
    
    // カロリー計算
    const userWeight = await getUserWeight(userId);
    const mets = EXERCISE_METS[exerciseName] || 5.0; // デフォルトMETs値
    const calories = Math.round(mets * userWeight * (durationInMinutes / 60) * 1.05);
    
    // 運動データ作成
    const exerciseData = {
      id: generateId(),
      name: exerciseName,
      type: getExerciseType(exerciseName, type),
      duration: durationInMinutes,
      calories: calories,
      time: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
      timestamp: new Date()
    };
    
    // 回数・セット情報がある場合は追加
    if (unit === '回') {
      exerciseData.sets = [{ weight: 0, reps: value }];
    } else if (unit === 'セット') {
      exerciseData.sets = Array(value).fill({ weight: 0, reps: 10 }); // デフォルト10回/セット
    }
    
    // Firestoreに保存
    const firestoreService = new FirestoreService();
    const today = new Date().toISOString().split('T')[0];
    await firestoreService.addExercise(userId, today, exerciseData);
    
    // 応答メッセージ
    let unitText = '';
    if (unit === '回') unitText = `${value}回`;
    else if (unit === 'セット') unitText = `${value}セット`;
    else unitText = `${durationInMinutes}分`;
    
    const responseMessage = {
      type: 'text',
      text: `${exerciseName} ${unitText} を記録しました！\n\n⚡ 消費カロリー: 約${calories}kcal\n💪 今日も頑張りましたね！`
    };
    
    await replyMessage(replyToken, [responseMessage]);
    
  } catch (error) {
    console.error('運動記録保存エラー:', error);
    await replyMessage(replyToken, [{
      type: 'text',
      text: '運動記録の保存でエラーが発生しました。もう一度お試しください。'
    }]);
  }
}

// 詳細運動記録の処理
async function recordDetailedExercise(userId: string, match: any, replyToken: string) {
  try {
    const { exerciseName, type, detailType } = match;
    
    // ユーザーの体重取得
    const userWeight = await getUserWeight(userId);
    const mets = EXERCISE_METS[exerciseName] || 5.0;
    
    let exerciseData = {
      id: generateId(),
      name: exerciseName,
      type: getExerciseType(exerciseName, type),
      time: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' }),
      timestamp: new Date()
    };
    
    let responseText = '';
    
    // 詳細タイプ別の処理
    switch (detailType) {
      case 'weight_reps_sets':
        const { weight, reps, sets } = match;
        const totalReps = reps * sets;
        const estimatedDuration = Math.max(sets * 3, 10); // 1セット3分、最低10分
        
        exerciseData.duration = estimatedDuration;
        exerciseData.calories = Math.round(mets * userWeight * (estimatedDuration / 60) * 1.05);
        exerciseData.sets = Array(sets).fill({ weight: weight, reps: reps });
        
        responseText = `${exerciseName} ${weight}kg×${reps}回×${sets}セット を記録しました！\n\n⚡ 消費カロリー: 約${exerciseData.calories}kcal\n💪 総レップ数: ${totalReps}回`;
        break;
        
      case 'distance_duration':
        const { distance, duration } = match;
        exerciseData.duration = duration;
        exerciseData.distance = distance;
        exerciseData.calories = Math.round(mets * userWeight * (duration / 60) * 1.05);
        
        const pace = (duration / distance).toFixed(1); // 分/km
        responseText = `${exerciseName} ${distance}km（${duration}分）を記録しました！\n\n⚡ 消費カロリー: 約${exerciseData.calories}kcal\n🏃 ペース: ${pace}分/km`;
        break;
        
      case 'weight_reps':
        const { weight: w, reps: r } = match;
        const estDuration = Math.max(r * 0.5, 5); // 1回0.5分、最低5分
        
        exerciseData.duration = estDuration;
        exerciseData.calories = Math.round(mets * userWeight * (estDuration / 60) * 1.05);
        exerciseData.sets = [{ weight: w, reps: r }];
        
        responseText = `${exerciseName} ${w}kg×${r}回 を記録しました！\n\n⚡ 消費カロリー: 約${exerciseData.calories}kcal\n💪 1セット完了`;
        break;
        
      case 'distance_only':
        const { distance: d } = match;
        const estimatedTime = Math.round(d * 6); // 1km=6分と仮定
        
        exerciseData.duration = estimatedTime;
        exerciseData.distance = d;
        exerciseData.calories = Math.round(mets * userWeight * (estimatedTime / 60) * 1.05);
        
        responseText = `${exerciseName} ${d}km を記録しました！\n\n⚡ 消費カロリー: 約${exerciseData.calories}kcal\n🏃 推定時間: ${estimatedTime}分`;
        break;
    }
    
    // Firestoreに保存
    const firestoreService = new FirestoreService();
    const today = new Date().toISOString().split('T')[0];
    await firestoreService.addExercise(userId, today, exerciseData);
    
    // 継続セッション保存機能は無効化
    // if (detailType === 'weight_reps_sets' || detailType === 'weight_reps') {
    //   console.log('🔄 セッション保存:', {
    //     userId,
    //     exerciseName,
    //     sessionId: exerciseData.id,
    //     detailType
    //   });
    //   
    //   userSessions.set(userId, {
    //     exerciseName,
    //     type: exerciseData.type,
    //     sessionId: exerciseData.id,
    //     timestamp: Date.now()
    //   });
    //   
    //   // 継続セット可能なことを伝える
    //   responseText += '\n\n📝 続けて重さと回数を送信すると追加セットとして記録されます！\n（例：「65kg 8回」「70 10」）';
    // }
    
    // 応答メッセージ
    const responseMessage = {
      type: 'text',
      text: responseText
    };
    
    await replyMessage(replyToken, [responseMessage]);
    
  } catch (error) {
    console.error('詳細運動記録保存エラー:', error);
    await replyMessage(replyToken, [{
      type: 'text',
      text: '運動記録の保存でエラーが発生しました。もう一度お試しください。'
    }]);
  }
}

// 運動タイプの判定
function getExerciseType(exerciseName: string, patternType: string): string {
  const cardioExercises = ['ランニング', 'ウォーキング', 'ジョギング', 'サイクリング', '水泳', 'エアロビクス'];
  const strengthExercises = ['ベンチプレス', 'スクワット', 'デッドリフト', '懸垂', '腕立て伏せ', '腹筋', '背筋', '肩トレ', '筋トレ'];
  const sportsExercises = ['テニス', 'バドミントン', '卓球', 'バスケ', 'サッカー', '野球', 'ゴルフ'];
  const flexibilityExercises = ['ヨガ', 'ピラティス', 'ストレッチ'];
  
  if (cardioExercises.includes(exerciseName)) return 'cardio';
  if (strengthExercises.includes(exerciseName)) return 'strength';
  if (sportsExercises.includes(exerciseName)) return 'sports';
  if (flexibilityExercises.includes(exerciseName)) return 'flexibility';
  
  // パターンタイプからフォールバック
  if (patternType === 'cardio') return 'cardio';
  if (patternType === 'strength') return 'strength';
  if (patternType === 'sports') return 'sports';
  if (patternType === 'flexibility') return 'flexibility';
  
  return 'cardio'; // デフォルト
}

// ユーザーの体重を取得
async function getUserWeight(userId: string): Promise<number> {
  try {
    const firestoreService = new FirestoreService();
    const today = new Date().toISOString().split('T')[0];
    
    // 最近7日間の体重データを探す
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      try {
        const dailyData = await firestoreService.getDailyRecord(userId, dateStr);
        if (dailyData && dailyData.weight) {
          return dailyData.weight;
        }
      } catch (error) {
        continue;
      }
    }
    
    return 70; // デフォルト体重
  } catch (error) {
    console.error('体重取得エラー:', error);
    return 70;
  }
}

// AI解析フォールバック（簡易版）
async function analyzeExerciseWithAI(userId: string, text: string) {
  try {
    // AI解析は一旦スキップして、シンプルなキーワードマッチングで対応
    console.log('運動AI解析スキップ:', text);
    return null;
  } catch (error) {
    console.error('AI運動解析エラー:', error);
    return null;
  }
}

// AI結果の処理
async function handleAIExerciseResult(userId: string, aiResult: any, replyToken: string) {
  if (aiResult.confidence > 0.8) {
    // 確信度が高い場合は自動記録
    const match = {
      exerciseName: aiResult.exercise,
      value: aiResult.duration || 30,
      unit: '分',
      type: aiResult.type || 'cardio',
      source: 'ai_analysis'
    };
    await recordExerciseFromMatch(userId, match, replyToken);
  } else {
    // 確信度が低い場合は確認
    await replyMessage(replyToken, [{
      type: 'text',
      text: `「${aiResult.exercise}」の運動を記録しますか？\n時間を教えてください（例：30分）`,
      quickReply: {
        items: [
          { type: 'action', action: { type: 'text', label: '15分' } },
          { type: 'action', action: { type: 'text', label: '30分' } },
          { type: 'action', action: { type: 'text', label: '60分' } }
        ]
      }
    }]);
  }
}

// 運動詳細の確認
async function askForExerciseDetails(replyToken: string, originalText: string) {
  await replyMessage(replyToken, [{
    type: 'text',
    text: `運動を記録しますか？\n具体的な運動名と時間を教えてください。\n\n例：「ランニング30分」「ベンチプレス45分」`,
    quickReply: {
      items: [
        { type: 'action', action: { type: 'text', label: 'ランニング30分' } },
        { type: 'action', action: { type: 'text', label: '筋トレ45分' } },
        { type: 'action', action: { type: 'text', label: 'ウォーキング20分' } }
      ]
    }
  }]);
}