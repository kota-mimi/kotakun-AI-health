import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { FirestoreService } from '@/services/firestoreService';
import AIHealthService from '@/services/aiService';
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { admin } from '@/lib/firebase-admin';
import { createMealFlexMessage } from './new_flex_message';
import { generateId } from '@/lib/utils';

// 🔒 UserIDをハッシュ化する関数
function hashUserId(userId: string): string {
  return crypto.createHash('sha256').update(userId + process.env.LINE_CHANNEL_SECRET).digest('hex').substring(0, 16);
}

// 🔒 セキュアな処理済みイベント追跡（UserIDハッシュ化 + 5分TTL）
async function checkAndMarkProcessed(eventKey: string): Promise<boolean> {
  try {
    const db = admin.firestore();
    
    // 🔒 イベントキーをハッシュ化（UserIDを含む場合があるため）
    const hashedEventKey = crypto.createHash('sha256').update(eventKey).digest('hex').substring(0, 20);
    const docRef = db.collection('processedEvents').doc(hashedEventKey);
    const doc = await docRef.get();
    
    if (doc.exists) {
      console.log('🚫 重複イベント検出 (Firestore):', hashedEventKey);
      return true; // 既に処理済み
    }
    
    // 🚨 セキュリティ改善: 5分TTL + 自動削除設定
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5分後
    await docRef.set({
      processedAt: new Date(),
      expiresAt: expiresAt,
      // 🔒 Firestoreの自動削除（TTL）を設定
      ttl: expiresAt
    });
    
    return false; // 新しいイベント
  } catch (error) {
    console.error('重複チェックエラー:', error);
    return false; // エラー時は処理を継続
  }
}

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
      // 重複チェック（Firestoreベース）
      const eventKey = `${event.source?.userId || 'unknown'}_${event.message?.id || event.timestamp}`;
      
      const isProcessed = await checkAndMarkProcessed(eventKey);
      if (isProcessed) {
        continue; // 重複をスキップ
      }
      
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
  try {
    // AIで食事記録の判定を行う
    const aiService = new AIHealthService();
    const mealJudgment = await aiService.analyzeFoodRecordIntent(text);
    
    if (mealJudgment.isFoodRecord) {
      // AI分析で食べ物と判定された場合
      const mealAnalysis = await aiService.analyzeMealFromText(mealJudgment.foodText || text);
      await storeTempMealAnalysis(userId, mealAnalysis);
      
      if (mealJudgment.hasSpecificMealTime) {
        // 「朝に唐揚げ食べた記録して」のような具体的な食事時間がある場合
        const mealType = mealJudgment.mealTime; // 'breakfast', 'lunch', 'dinner', 'snack'
        await saveMealRecord(userId, mealType, replyToken);
        return;
      } else if (mealJudgment.isDefiniteRecord) {
        // 「唐揚げ食べた」のような明確な記録意図がある場合、食事タイプ選択
        await showMealTypeSelection(replyToken);
        return;
      } else {
        // 「今日唐揚げ食べた！」のような曖昧な場合、確認のクイックリプライ
        await replyMessage(replyToken, [{
          type: 'text',
          text: `${mealJudgment.foodText || text}の記録をしますか？`,
          quickReply: {
            items: [
              {
                type: 'action',
                action: {
                  type: 'postback',
                  label: '📝 記録する',
                  data: 'action=confirm_record&confirm=yes'
                }
              },
              {
                type: 'action',
                action: {
                  type: 'postback',
                  label: '❌ 記録しない',
                  data: 'action=confirm_record&confirm=no'
                }
              }
            ]
          }
        }]);
        return;
      }
    }
    
    // 食事記録ではない場合、一般会話AIで応答
    const aiResponse = await aiService.generateGeneralResponse(text);
    
    await replyMessage(replyToken, [{
      type: 'text',
      text: aiResponse || 'すみません、よく分からなかったです。健康管理についてお手伝いできることがあれば、お気軽にお声がけください！'
    }]);
    
  } catch (error) {
    console.error('テキストメッセージ処理エラー:', error);
    // エラー時は一般会話で応答
    const aiService = new AIHealthService();
    const aiResponse = await aiService.generateGeneralResponse(text);
    
    await replyMessage(replyToken, [{
      type: 'text',
      text: aiResponse || 'すみません、よく分からなかったです。健康管理についてお手伝いできることがあれば、お気軽にお声がけください！'
    }]);
  }
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
    case 'text_record':
      await showMealTypeSelection(replyToken);
      break;
    case 'photo_record':
      await replyMessage(replyToken, [{
        type: 'text',
        text: 'カメラで撮影してください📸',
        quickReply: {
          items: [
            {
              type: 'action',
              action: {
                type: 'camera',
                label: 'カメラ'
              }
            }
          ]
        }
      }]);
      break;
    case 'confirm_record':
      const confirm = params.get('confirm');
      if (confirm === 'yes') {
        await showMealTypeSelection(replyToken);
      } else if (confirm === 'no') {
        const tempData = await getTempMealAnalysis(userId);
        await deleteTempMealAnalysis(userId);
        
        const generalResponse = await aiService.generateGeneralResponse(tempData?.originalText || 'こんにちは');
        await replyMessage(replyToken, [{
          type: 'text',
          text: generalResponse
        }]);
      }
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
    
    // 🚨 重複防止: 一時データを即座に削除（最重要！）
    await deleteTempMealAnalysis(userId);
    console.log('🔒 重複防止: 一時データを削除しました');

    // Flexメッセージ作成・送信
    const user = await getUserData(userId);
    const mealTypeJa = {
      breakfast: '朝食',
      lunch: '昼食', 
      dinner: '夕食',
      snack: '間食'
    }[mealType] || '食事';
    
    // 画像URLを取得（保存されていれば）
    let imageUrl = null;
    console.log('🖼️ 画像チェック:', {
      hasImageContent: !!tempData.imageContent,
      imageContentSize: tempData.imageContent?.length || 0
    });
    
    if (tempData.imageContent) {
      // Admin SDKを使用して画像をアップロード
      try {
        // 🔧 環境変数から正しいバケット名を取得
        console.log('🔍 環境変数確認:', {
          storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        });
        
        const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET 
          || `${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.appspot.com`
          || 'kotakun-19990629-gmailcoms-projects.appspot.com'; // フォールバック
        
        console.log('🔍 最終的に使用するバケット名:', bucketName);
        const bucket = admin.storage().bucket(bucketName);
        
        const imageId = `meal_${generateId()}`;
        const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' });
        const fileName = `meals/${userId}/${today}/${imageId}.jpg`;
        
        console.log('🔍 アップロード先:', fileName);
        const file = bucket.file(fileName);
        await file.save(tempData.imageContent, {
          metadata: {
            contentType: 'image/jpeg',
          },
        });
        
        // Public URLを生成
        await file.makePublic();
        imageUrl = `https://storage.googleapis.com/${bucketName}/${fileName}`;
        console.log('✅ 画像アップロード成功 (Admin SDK):', imageUrl);
      } catch (error) {
        console.error('❌ Admin SDK画像アップロードエラー:', error);
        
        // 🔄 フォールバック: Client SDK を使用して再試行
        try {
          console.log('🔄 Client SDK でのアップロードを試行...');
          const clientStorage = storage;
          const storageRef = ref(clientStorage, `meals/${userId}/${new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' })}/meal_${generateId()}.jpg`);
          
          const snapshot = await uploadBytes(storageRef, tempData.imageContent, {
            contentType: 'image/jpeg'
          });
          
          imageUrl = await getDownloadURL(snapshot.ref);
          console.log('✅ フォールバック画像アップロード成功 (Client SDK):', imageUrl);
        } catch (clientError) {
          console.error('❌ Client SDK フォールバックも失敗:', clientError);
          // 🎯 最後の手段: 画像データを一時的にbase64で保存（後で改善）
          console.log('⚠️ 画像アップロード完全失敗 - 画像なしで記録継続');
        }
      }
    } else {
      console.log('⚠️ 画像データが見つかりません');
    }
    
    const mealName = tempData.analysis.foodItems?.[0] || tempData.analysis.meals?.[0]?.name || '食事';
    const flexMessage = createMealFlexMessage(mealTypeJa, tempData.analysis, imageUrl, mealName);
    
    // 直接保存（画像URLを使用）
    await saveMealDirectly(userId, mealType, tempData.analysis, imageUrl);
    
    // pushMessageでFlexメッセージ送信
    await pushMessage(userId, [flexMessage]);
    
    // replyMessageで記録完了メッセージ（クイックリプライ無効化）
    await replyMessage(replyToken, [{
      type: 'text',
      text: `✅ ${mealTypeJa}を記録しました！`
    }]);
    
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
async function saveMealDirectly(userId: string, mealType: string, mealAnalysis: any, imageUrl?: string) {
  try {
    console.log('🔥 直接保存開始:', { userId, mealType, hasImage: !!imageUrl });
    
    const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' });
    const currentTime = new Date().toLocaleTimeString('ja-JP', { 
      hour: '2-digit', 
      minute: '2-digit',
      timeZone: 'Asia/Tokyo'
    });
    
    // 食事データ作成（アプリと整合性のある形式）
    const mealData = {
      id: generateId(),
      name: mealAnalysis.foodItems?.[0] || mealAnalysis.meals?.[0]?.name || '食事',
      type: mealType, // アプリが期待するフィールド名
      calories: mealAnalysis.calories || mealAnalysis.totalCalories || 400,
      protein: mealAnalysis.protein || mealAnalysis.totalProtein || 20,
      fat: mealAnalysis.fat || mealAnalysis.totalFat || 15,
      carbs: mealAnalysis.carbs || mealAnalysis.totalCarbs || 50,
      time: currentTime,
      image: imageUrl,
      images: imageUrl ? [imageUrl] : [],
      foodItems: mealAnalysis.foodItems || [mealAnalysis.foodItems?.[0] || mealAnalysis.meals?.[0]?.name || '食事'],
      timestamp: new Date(),
      createdAt: new Date(),
      lineUserId: userId,
      // 複数食事の場合
      isMultipleMeals: mealAnalysis.isMultipleMeals || false,
      meals: mealAnalysis.meals || []
    };
    
    // Firestoreに直接保存（アプリが期待する形式）
    const db = admin.firestore();
    const recordRef = db.collection('users').doc(userId).collection('dailyRecords').doc(today);
    const recordDoc = await recordRef.get();
    const existingData = recordDoc.exists ? recordDoc.data() : {};
    const existingMeals = existingData.meals || [];
    
    // 新しい食事を追加
    const updatedMeals = [...existingMeals, mealData];
    
    await recordRef.set({
      ...existingData,
      meals: updatedMeals,
      date: today,
      lineUserId: userId,
      updatedAt: new Date()
    }, { merge: true });
    
    console.log('🔥 直接保存完了:', { mealId: mealData.id, mealType });
    
  } catch (error) {
    console.error('🔥 直接保存エラー:', error);
    throw error;
  }
}

// 簡単な一時保存関数
async function storeTempMealAnalysis(userId: string, mealAnalysis: any, imageContent?: Buffer) {
  try {
    // AIアドバイスを除去してクリーンなデータのみ保存
    const cleanAnalysis = {
      calories: mealAnalysis.calories || mealAnalysis.totalCalories || 0,
      protein: mealAnalysis.protein || mealAnalysis.totalProtein || 0,
      fat: mealAnalysis.fat || mealAnalysis.totalFat || 0,
      carbs: mealAnalysis.carbs || mealAnalysis.totalCarbs || 0,
      foodItems: mealAnalysis.foodItems || [],
      meals: mealAnalysis.meals || [],
      isMultipleMeals: mealAnalysis.isMultipleMeals || false
      // adviceは意図的に除外
    };
    
    const db = admin.firestore();
    await db.collection('users').doc(userId).collection('tempMealData').doc('current').set({
      analysis: cleanAnalysis,
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

async function deleteTempMealAnalysis(userId: string) {
  try {
    const db = admin.firestore();
    await db.collection('users').doc(userId).collection('tempMealData').doc('current').delete();
    console.log('🧹 一時データ削除完了:', userId);
  } catch (error) {
    console.error('一時データ削除エラー:', error);
  }
}

// 🚨 緊急: 全ユーザーの一時データを削除する関数
export async function cleanupAllTempMealData() {
  try {
    const db = admin.firestore();
    const usersRef = db.collection('users');
    const snapshot = await usersRef.get();
    
    let cleanedCount = 0;
    const batch = db.batch();
    
    for (const userDoc of snapshot.docs) {
      const tempRef = userDoc.ref.collection('tempMealData').doc('current');
      batch.delete(tempRef);
      cleanedCount++;
    }
    
    await batch.commit();
    console.log(`🧹 緊急清掃完了: ${cleanedCount}件の一時データを削除`);
    return { success: true, cleaned: cleanedCount };
  } catch (error) {
    console.error('🚨 緊急清掃エラー:', error);
    return { success: false, error: error.message };
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