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
    // Loading Animation開始（AIが考え中）
    await startLoadingAnimation(userId, 15);
    
    const aiService = new AIHealthService();
    
    // まず体重記録の判定を行う
    const weightJudgment = await aiService.analyzeWeightRecordIntent(text);
    
    if (weightJudgment.isWeightRecord) {
      // 体重記録処理
      await handleWeightRecord(userId, weightJudgment, replyToken);
      return;
    }
    
    // 運動記録の判定（パターンマッチング）
    const exerciseResult = await handleExerciseMessage(replyToken, userId, text, user);
    if (exerciseResult) {
      return; // 運動記録として処理済み
    }
    
    // 体重記録でも運動記録でもない場合、食事記録の判定を行う
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
      } else {
        // 「唐揚げ食べた」や「今日唐揚げ食べた！」の場合、5つの選択肢を表示
        await stopLoadingAnimation(userId);
        await replyMessage(replyToken, [{
          type: 'text',
          text: `${mealJudgment.foodText || text}の記録をしますか？`,
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
              },
              {
                type: 'action',
                action: {
                  type: 'postback',
                  label: '記録しない',
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
    
    await stopLoadingAnimation(userId);
    await replyMessage(replyToken, [{
      type: 'text',
      text: aiResponse || 'すみません、よく分からなかったです。健康管理についてお手伝いできることがあれば、お気軽にお声がけください！'
    }]);
    
  } catch (error) {
    console.error('テキストメッセージ処理エラー:', error);
    // エラー時は一般会話で応答
    const aiService = new AIHealthService();
    const aiResponse = await aiService.generateGeneralResponse(text);
    
    await stopLoadingAnimation(userId);
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
      if (confirm === 'no') {
        const tempData = await getTempMealAnalysis(userId);
        await deleteTempMealAnalysis(userId);
        
        const aiService = new AIHealthService();
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

// 体重記録処理
async function handleWeightRecord(userId: string, weightData: any, replyToken: string) {
  try {
    console.log('📊 体重記録開始:', { userId, weight: weightData.weight, bodyFat: weightData.bodyFat });
    
    // 内部APIを使用（動作確認済みの方法）
    const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' });
    
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'https://kotakun-ai-health.vercel.app'}/api/weight`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        lineUserId: userId,
        date: today,
        weight: weightData.weight,
        bodyFat: weightData.hasBodyFat ? weightData.bodyFat : undefined,
        note: `LINE記録 ${new Date().toLocaleTimeString('ja-JP', { timeZone: 'Asia/Tokyo' })}`
      }),
    });
    
    await stopLoadingAnimation(userId);
    
    if (response.ok) {
      let message = `体重 ${weightData.weight}kg を記録したよ！`;
      if (weightData.hasBodyFat && weightData.bodyFat) {
        message = `体重 ${weightData.weight}kg、体脂肪率 ${weightData.bodyFat}% を記録したよ！`;
      }
      
      await replyMessage(replyToken, [{
        type: 'text',
        text: message
      }]);
      
      console.log('📊 体重記録完了');
    } else {
      const errorData = await response.json();
      console.error('体重記録API エラー:', errorData);
      
      await replyMessage(replyToken, [{
        type: 'text',
        text: '体重記録でエラーが発生しました。もう一度お試しください。'
      }]);
    }
    
  } catch (error) {
    console.error('体重記録処理エラー:', error);
    await stopLoadingAnimation(userId);
    await replyMessage(replyToken, [{
      type: 'text',
      text: '体重記録でエラーが発生しました。もう一度お試しください。'
    }]);
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
    
    // replyMessageでクイックリプライ無効化
    await replyMessage(replyToken, [{
      type: 'text',
      text: '記録したよ！'
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

// Loading Animation開始
async function startLoadingAnimation(userId: string, seconds: number = 20) {
  const accessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  
  if (!accessToken) {
    console.error('LINE_CHANNEL_ACCESS_TOKEN is not set');
    return;
  }

  try {
    const response = await fetch('https://api.line.me/v2/bot/chat/loading/start', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        chatId: userId,
        loadingSeconds: Math.min(seconds, 60) // 最大60秒
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Loading animation start failed:', error);
    } else {
      console.log('✨ Loading animation started');
    }
  } catch (error) {
    console.error('Error starting loading animation:', error);
  }
}

// Loading Animation停止
async function stopLoadingAnimation(userId: string) {
  const accessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  
  if (!accessToken) {
    console.error('LINE_CHANNEL_ACCESS_TOKEN is not set');
    return;
  }

  try {
    const response = await fetch('https://api.line.me/v2/bot/chat/loading/stop', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        chatId: userId
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Loading animation stop failed:', error);
    } else {
      console.log('⏹️ Loading animation stopped');
    }
  } catch (error) {
    console.error('Error stopping loading animation:', error);
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

// === 運動記録機能 ===
// 動的パターンキャッシュ（ユーザー別）
const userExercisePatterns = new Map();

// 基本運動パターン（詳細版）
const BASIC_EXERCISE_PATTERNS = [
  // 詳細筋トレパターン（重量×回数×セット）
  { 
    pattern: /^(ベンチプレス|スクワット|デッドリフト|懸垂|腕立て伏せ|腕立て|腹筋|背筋|肩トレ|ショルダープレス|ラットプルダウン|レッグプレス|カールアップ|プランク|バーベルカール|ダンベルカール|チンアップ|プルアップ|ディップス|レッグエクステンション|レッグカール|カーフレイズ|アームカール|サイドレイズ|フロントレイズ|リアレイズ|アップライトロウ|シュラッグ|クランチ|サイドクランチ|ロシアンツイスト|レッグレイズ|マウンテンクライマー|バーピー|ジャンピングジャック)\s*(\d+(?:\.\d+)?)\s*(kg|キロ|ｋｇ|KG)\s*(\d+)\s*(回|レップ|rep|reps)\s*(\d+)\s*(セット|set|sets)$/i, 
    type: 'strength_detailed',
    captureGroups: ['exercise', 'weight', 'weightUnit', 'reps', 'repsUnit', 'sets', 'setsUnit']
  },
  
  // 距離+時間パターン
  { 
    pattern: /^(ランニング|ウォーキング|ジョギング|サイクリング|走る|歩く|ジョグ|自転車|チャリ|散歩|早歩き|マラソン|ハイキング|トレッキング|ウォーク|ラン|サイクル)\s*(\d+(?:\.\d+)?)\s*(km|キロ|ｋｍ|KM|キロメートル|m|メートル|ｍ|M)\s*(\d+)\s*(分|時間|秒|min|mins|hour|hours|sec|secs|分間|時|h|m|s)$/i, 
    type: 'cardio_distance',
    captureGroups: ['exercise', 'distance', 'distanceUnit', 'duration', 'durationUnit']
  },
  
  // 重量×回数パターン（セット数なし）
  { 
    pattern: /^(ベンチプレス|スクワット|デッドリフト|懸垂|腕立て伏せ|腕立て|腹筋|背筋|肩トレ|ショルダープレス|ラットプルダウン|レッグプレス|カールアップ|プランク|バーベルカール|ダンベルカール|チンアップ|プルアップ|ディップス|レッグエクステンション|レッグカール|カーフレイズ|アームカール|サイドレイズ|フロントレイズ|リアレイズ|アップライトロウ|シュラッグ|クランチ|サイドクランチ|ロシアンツイスト|レッグレイズ|マウンテンクライマー|バーピー|ジャンピングジャック)\s*(\d+(?:\.\d+)?)\s*(kg|キロ|ｋｇ|KG)\s*(\d+)\s*(回|レップ|rep|reps)$/i, 
    type: 'strength_weight_reps',
    captureGroups: ['exercise', 'weight', 'weightUnit', 'reps', 'repsUnit']
  },
  
  // 距離のみパターン
  { 
    pattern: /^(ランニング|ウォーキング|ジョギング|サイクリング|走る|歩く|ジョグ|自転車|チャリ|散歩|早歩き|マラソン|ハイキング|トレッキング|ウォーク|ラン|サイクル)\s*(\d+(?:\.\d+)?)\s*(km|キロ|ｋｍ|KM|キロメートル|m|メートル|ｍ|M)$/i, 
    type: 'cardio_distance_only',
    captureGroups: ['exercise', 'distance', 'distanceUnit']
  },
  
  // 有酸素運動（時間のみ）
  { 
    pattern: /^(ランニング|ウォーキング|ジョギング|サイクリング|水泳|エアロビクス|走る|歩く|泳ぐ|ジョグ|自転車|チャリ|散歩|早歩き|マラソン|ハイキング|トレッキング|ウォーク|ラン|サイクル|スイミング|プール|クロール|平泳ぎ|背泳ぎ|バタフライ|水中ウォーキング|アクアビクス|ズンバ|エアロ|ステップ|踏み台昇降|縄跳び|なわとび|ロープジャンプ|ボクシング|キックボクシング|ムエタイ|格闘技|太極拳|気功|ダンス|社交ダンス|フラダンス|ベリーダンス|ヒップホップ|ジャズダンス|バレエ|フィットネス|有酸素|カーディオ|HIIT|タバタ|インターバル|クロストレーニング|ローイング|ボート漕ぎ|エリプティカル|トレッドミル|ランニングマシン|ウォーキングマシン|エアロバイク|スピンバイク|ステッパー|クライミング|ボルダリング|登山)\s*(\d+)\s*(分|時間|秒|min|mins|hour|hours|sec|secs|分間|時|h|m|s)$/i, 
    type: 'cardio' 
  },
  
  // 筋力トレーニング（時間・回数・セット）
  { 
    pattern: /^(ベンチプレス|スクワット|デッドリフト|懸垂|腕立て伏せ|腕立て|腹筋|背筋|肩トレ|ショルダープレス|ラットプルダウン|レッグプレス|カールアップ|プランク|バーベルカール|ダンベルカール|チンアップ|プルアップ|ディップス|レッグエクステンション|レッグカール|カーフレイズ|アームカール|サイドレイズ|フロントレイズ|リアレイズ|アップライトロウ|シュラッグ|クランチ|サイドクランチ|ロシアンツイスト|レッグレイズ|マウンテンクライマー|バーピー|ジャンピングジャック|筋トレ|ウェイトトレーニング|マシントレーニング|フリーウェイト|ダンベル|バーベル|ケトルベル|チューブ|エクササイズ|ストレングス|レジスタンス|体幹|コア|インナーマッスル|アウターマッスル|上半身|下半身|胸筋|背筋|腹筋|脚|腕|肩|太もも|ふくらはぎ|お尻|臀筋|大胸筋|広背筋|僧帽筋|三角筋|上腕二頭筋|上腕三頭筋|前腕|大腿四頭筋|ハムストリング|腓腹筋|ヒラメ筋)\s*(\d+)\s*(分|時間|秒|回|セット|min|mins|hour|hours|sec|secs|rep|reps|set|sets|分間|時|h|m|s)$/i, 
    type: 'strength' 
  },
  
  // スポーツ
  { 
    pattern: /^(テニス|バドミントン|卓球|バスケ|サッカー|野球|ゴルフ|バレーボール|ハンドボール|ラグビー|アメフト|ホッケー|フィールドホッケー|アイスホッケー|スケート|フィギュアスケート|スピードスケート|アイススケート|ローラースケート|インラインスケート|スキー|スノーボード|スノボ|クロスカントリー|アルペン|ジャンプ|ノルディック|水上スキー|ジェットスキー|サーフィン|ウィンドサーフィン|セーリング|ヨット|カヌー|カヤック|ラフティング|釣り|フィッシング|弓道|アーチェリー|射撃|フェンシング|剣道|柔道|空手|合気道|少林寺拳法|テコンドー|ボクシング|キックボクシング|レスリング|相撲|体操|新体操|器械体操|トランポリン|陸上|短距離|中距離|長距離|マラソン|駅伝|ハードル|走り幅跳び|走り高跳び|棒高跳び|砲丸投げ|ハンマー投げ|やり投げ|円盤投げ|十種競技|七種競技|競歩|クライミング|ボルダリング|登山|ハイキング|トレッキング|オリエンテーリング|トライアスロン|アイアンマン|デュアスロン|アクアスロン|ペンタスロン|モダンペンタスロン|バイアスロン)\s*(\d+)\s*(分|時間|秒|min|mins|hour|hours|sec|secs|分間|時|h|m|s)$/i, 
    type: 'sports' 
  },
  
  // ストレッチ・柔軟性・リラクゼーション
  { 
    pattern: /^(ヨガ|ピラティス|ストレッチ|柔軟|柔軟体操|ラジオ体操|準備運動|整理運動|クールダウン|ウォームアップ|マッサージ|セルフマッサージ|リンパマッサージ|指圧|ツボ押し|整体|カイロプラクティック|オステオパシー|リフレクソロジー|アロマテラピー|瞑想|メディテーション|呼吸法|深呼吸|腹式呼吸|胸式呼吸|ブレス|ブリージング|リラックス|リラクゼーション|ストレス解消|癒し|ヒーリング)\s*(\d+)\s*(分|時間|秒|min|mins|hour|hours|sec|secs|分間|時|h|m|s)$/i, 
    type: 'flexibility' 
  },
  
  // 日常生活活動（NEAT）
  { 
    pattern: /^(掃除|そうじ|清掃|洗濯|せんたく|料理|りょうり|クッキング|調理|買い物|かいもの|ショッピング|庭仕事|にわしごと|ガーデニング|草取り|くさとり|除草|水やり|みずやり|植物の世話|しょくぶつのせわ|ペットの散歩|ペットのさんぽ|犬の散歩|いぬのさんぽ|猫の世話|ねこのせわ|階段昇降|かいだんしょうこう|階段|かいだん|エスカレーター回避|階段利用|かいだんりよう|立ち仕事|たちしごと)\s*(\d+)\s*(分|時間|秒|min|mins|hour|hours|sec|secs|分間|時|h|m|s)$/i, 
    type: 'daily_activity' 
  },
  
  // 種目名のみパターン（時間なし）
  { 
    pattern: /^(ランニング|ウォーキング|ジョギング|サイクリング|水泳|エアロビクス|走る|歩く|泳ぐ|ジョグ|自転車|チャリ|散歩|早歩き|マラソン|ハイキング|トレッキング|ウォーク|ラン|サイクル|スイミング|プール|クロール|平泳ぎ|背泳ぎ|バタフライ|水中ウォーキング|アクアビクス|ズンバ|エアロ|ステップ|踏み台昇降|縄跳び|なわとび|ロープジャンプ|ボクシング|キックボクシング|ムエタイ|格闘技|太極拳|気功|ダンス|社交ダンス|フラダンス|ベリーダンス|ヒップホップ|ジャズダンス|バレエ|フィットネス|有酸素|カーディオ|HIIT|タバタ|インターバル|クロストレーニング|ローイング|ボート漕ぎ|エリプティカル|トレッドミル|ランニングマシン|ウォーキングマシン|エアロバイク|スピンバイク|ステッパー|クライミング|ボルダリング|登山|ベンチプレス|スクワット|デッドリフト|懸垂|腕立て伏せ|腕立て|腹筋|背筋|肩トレ|ショルダープレス|ラットプルダウン|レッグプレス|カールアップ|プランク|バーベルカール|ダンベルカール|チンアップ|プルアップ|ディップス|レッグエクステンション|レッグカール|カーフレイズ|アームカール|サイドレイズ|フロントレイズ|リアレイズ|アップライトロウ|シュラッグ|クランチ|サイドクランチ|ロシアンツイスト|レッグレイズ|マウンテンクライマー|バーピー|ジャンピングジャック|筋トレ|ウェイトトレーニング|マシントレーニング|フリーウェイト|ダンベル|バーベル|ケトルベル|チューブ|エクササイズ|ストレングス|レジスタンス|体幹|コア|インナーマッスル|アウターマッスル|上半身|下半身|胸筋|背筋|腹筋|脚|腕|肩|太もも|ふくらはぎ|お尻|臀筋|大胸筋|広背筋|僧帽筋|三角筋|上腕二頭筋|上腕三頭筋|前腕|大腿四頭筋|ハムストリング|腓腹筋|ヒラメ筋|テニス|バドミントン|卓球|バスケ|サッカー|野球|ゴルフ|バレーボール|ハンドボール|ラグビー|アメフト|ホッケー|フィールドホッケー|アイスホッケー|スケート|フィギュアスケート|スピードスケート|アイススケート|ローラースケート|インラインスケート|スキー|スノーボード|スノボ|クロスカントリー|アルペン|ジャンプ|ノルディック|水上スキー|ジェットスキー|サーフィン|ウィンドサーフィン|セーリング|ヨット|カヌー|カヤック|ラフティング|釣り|フィッシング|弓道|アーチェリー|射撃|フェンシング|剣道|柔道|空手|合気道|少林寺拳法|テコンドー|レスリング|相撲|体操|新体操|器械体操|トランポリン|陸上|短距離|中距離|長距離|駅伝|ハードル|走り幅跳び|走り高跳び|棒高跳び|砲丸投げ|ハンマー投げ|やり投げ|円盤投げ|十種競技|七種競技|競歩|オリエンテーリング|トライアスロン|アイアンマン|デュアスロン|アクアスロン|ペンタスロン|モダンペンタスロン|バイアスロン|ヨガ|ピラティス|ストレッチ|柔軟|柔軟体操|ラジオ体操|準備運動|整理運動|クールダウン|ウォームアップ|マッサージ|セルフマッサージ|リンパマッサージ|指圧|ツボ押し|整体|カイロプラクティック|オステオパシー|リフレクソロジー|アロマテラピー|瞑想|メディテーション|呼吸法|深呼吸|腹式呼吸|胸式呼吸|ブレス|ブリージング|リラックス|リラクゼーション|ストレス解消|癒し|ヒーリング|掃除|そうじ|清掃|洗濯|せんたく|料理|りょうり|クッキング|調理|買い物|かいもの|ショッピング|庭仕事|にわしごと|ガーデニング|草取り|くさとり|除草|水やり|みずやり|植物の世話|しょくぶつのせわ|ペットの散歩|ペットのさんぽ|犬の散歩|いぬのさんぽ|猫の世話|ねこのせわ|階段昇降|かいだんしょうこう|階段|かいだん|エスカレーター回避|階段利用|かいだんりよう|立ち仕事|たちしごと)$/i, 
    type: 'exercise_only' 
  }
];

// METs値マップ（カロリー計算用）
const EXERCISE_METS = {
  // 有酸素運動
  'ランニング': 8.0, '走る': 8.0, 'ラン': 8.0,
  'ウォーキング': 3.5, '歩く': 3.5, 'ウォーク': 3.5, '散歩': 3.0, '早歩き': 4.0,
  'ジョギング': 6.0, 'ジョグ': 6.0,
  'サイクリング': 6.8, '自転車': 6.8, 'チャリ': 6.8, 'サイクル': 6.8,
  'マラソン': 9.0,
  'ハイキング': 6.0, 'トレッキング': 7.0, '登山': 8.0,
  
  // 水泳・水中運動
  '水泳': 6.0, '泳ぐ': 6.0, 'スイミング': 6.0, 'プール': 6.0,
  'クロール': 8.0, '平泳ぎ': 6.0, '背泳ぎ': 7.0, 'バタフライ': 10.0,
  '水中ウォーキング': 4.0, 'アクアビクス': 5.0,
  
  // エアロビクス・ダンス
  'エアロビクス': 7.3, 'エアロ': 7.3, 'ズンバ': 8.0,
  'ステップ': 8.0, '踏み台昇降': 7.0,
  'ダンス': 4.8, '社交ダンス': 4.0, 'フラダンス': 3.0, 'ベリーダンス': 4.0,
  'ヒップホップ': 6.0, 'ジャズダンス': 5.0, 'バレエ': 4.0,
  
  // 筋力トレーニング
  'ベンチプレス': 6.0, 'スクワット': 5.0, 'デッドリフト': 6.0,
  '懸垂': 8.0, 'チンアップ': 8.0, 'プルアップ': 8.0,
  '腕立て伏せ': 4.0, '腕立て': 4.0,
  '腹筋': 4.0, 'クランチ': 4.0, 'サイドクランチ': 4.0,
  '背筋': 4.0, '肩トレ': 5.0, 'ショルダープレス': 5.0, 'サイドレイズ': 4.0,
  'ラットプルダウン': 5.0, 'レッグプレス': 6.0,
  'プランク': 3.5, 'バーベルカール': 4.0, 'ダンベルカール': 4.0, 'アームカール': 4.0,
  'ディップス': 6.0, 'レッグエクステンション': 4.0, 'レッグカール': 4.0,
  'カーフレイズ': 3.0, 'シュラッグ': 3.5,
  'ロシアンツイスト': 5.0, 'レッグレイズ': 4.0,
  'マウンテンクライマー': 8.0, 'バーピー': 8.0, 'ジャンピングジャック': 7.0,
  '筋トレ': 6.0, 'ウェイトトレーニング': 6.0, 'マシントレーニング': 5.0,
  'フリーウェイト': 6.0, 'ダンベル': 5.0, 'バーベル': 6.0, 'ケトルベル': 8.0,
  
  // 体幹・コア
  '体幹': 4.0, 'コア': 4.0, 'インナーマッスル': 3.5,
  
  // 格闘技・武道
  'ボクシング': 12.0, 'キックボクシング': 10.0, 'ムエタイ': 10.0,
  '格闘技': 10.0, '剣道': 8.0, '柔道': 10.0, '空手': 8.0,
  '合気道': 6.0, '少林寺拳法': 8.0, 'テコンドー': 8.0,
  'レスリング': 12.0, '相撲': 10.0, 'フェンシング': 6.0,
  '太極拳': 3.0, '気功': 2.5,
  
  // 球技・スポーツ
  'テニス': 7.3, 'バドミントン': 5.5, '卓球': 4.0,
  'バスケ': 6.5, 'サッカー': 7.0, '野球': 5.0,
  'ゴルフ': 4.8, 'バレーボール': 6.0, 'ハンドボール': 8.0,
  'ラグビー': 10.0, 'アメフト': 8.0, 'ホッケー': 8.0,
  
  // ウィンタースポーツ
  'スキー': 7.0, 'スノーボード': 6.0, 'スノボ': 6.0,
  'クロスカントリー': 9.0, 'アルペン': 6.0,
  'スケート': 7.0, 'フィギュアスケート': 6.0, 'スピードスケート': 9.0,
  'アイススケート': 7.0, 'ローラースケート': 7.0, 'インラインスケート': 8.0,
  
  // ウォータースポーツ
  'サーフィン': 6.0, 'ウィンドサーフィン': 8.0, 'セーリング': 3.0, 'ヨット': 3.0,
  'カヌー': 5.0, 'カヤック': 5.0, 'ラフティング': 5.0,
  '水上スキー': 6.0, 'ジェットスキー': 4.0,
  
  // アウトドア・その他
  'クライミング': 8.0, 'ボルダリング': 8.0,
  '釣り': 2.5, 'フィッシング': 2.5,
  '弓道': 3.5, 'アーチェリー': 4.0, '射撃': 2.5,
  
  // 体操・陸上
  '体操': 4.0, '新体操': 4.0, '器械体操': 4.0, 'トランポリン': 4.0,
  '陸上': 8.0, '短距離': 9.0, '中距離': 8.0, '長距離': 8.0,
  '駅伝': 8.0, 'ハードル': 9.0, '走り幅跳び': 6.0, '走り高跳び': 6.0,
  '棒高跳び': 6.0, '砲丸投げ': 4.0, 'ハンマー投げ': 4.0, 'やり投げ': 4.0,
  '円盤投げ': 4.0, '競歩': 6.5,
  
  // 複合競技
  'トライアスロン': 9.0, 'アイアンマン': 9.0, 'デュアスロン': 8.0,
  'アクアスロン': 8.0, 'ペンタスロン': 7.0, 'モダンペンタスロン': 7.0,
  'バイアスロン': 8.0, '十種競技': 7.0, '七種競技': 7.0,
  'オリエンテーリング': 6.0,
  
  // ストレッチ・リラクゼーション
  'ヨガ': 2.5, 'ピラティス': 3.0, 'ストレッチ': 2.3,
  '柔軟': 2.3, '柔軟体操': 2.3, 'ラジオ体操': 3.0,
  '準備運動': 3.0, '整理運動': 2.5, 'クールダウン': 2.5, 'ウォームアップ': 3.0,
  'マッサージ': 1.5, 'セルフマッサージ': 2.0, 'リンパマッサージ': 2.0,
  '瞑想': 1.2, 'メディテーション': 1.2, '呼吸法': 1.2, '深呼吸': 1.2,
  'リラックス': 1.2, 'リラクゼーション': 1.2,
  
  // マシン・器具
  'トレッドミル': 8.0, 'ランニングマシン': 8.0, 'ウォーキングマシン': 3.5,
  'エアロバイク': 6.8, 'スピンバイク': 8.0, 'ステッパー': 7.0,
  'エリプティカル': 7.0, 'ローイング': 8.0, 'ボート漕ぎ': 8.0,
  
  // フィットネス
  'フィットネス': 5.0, '有酸素': 6.0, 'カーディオ': 6.0,
  'HIIT': 8.0, 'タバタ': 8.0, 'インターバル': 8.0,
  'クロストレーニング': 6.0,
  
  // 日常生活活動（NEAT）
  '掃除': 3.5, 'そうじ': 3.5, '清掃': 3.5,
  '洗濯': 2.0, 'せんたく': 2.0,
  '料理': 2.5, 'りょうり': 2.5, 'クッキング': 2.5, '調理': 2.5,
  '買い物': 2.3, 'かいもの': 2.3, 'ショッピング': 2.3,
  '庭仕事': 4.0, 'にわしごと': 4.0, 'ガーデニング': 4.0,
  '草取り': 4.5, 'くさとり': 4.5, '除草': 4.5,
  '水やり': 2.5, 'みずやり': 2.5, '植物の世話': 2.5,
  'ペットの散歩': 3.0, '犬の散歩': 3.0,
  '階段昇降': 8.0, '階段': 8.0, '階段利用': 8.0,
  '立ち仕事': 2.5
};

// 運動記録処理の主要関数
async function handleExerciseMessage(replyToken: string, userId: string, text: string, user: any): Promise<boolean> {
  try {
    console.log('=== 運動記録処理開始 ===');
    console.log('入力テキスト:', text);
    
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
      await recordExerciseFromMatch(userId, match, replyToken, user);
      return true;
    }
    
    // 運動キーワード検出
    const hasKeywords = containsExerciseKeywords(text);
    console.log('運動キーワード検出:', hasKeywords);
    
    if (hasKeywords) {
      // 確認メッセージ送信
      console.log('運動キーワード検出、確認メッセージ送信');
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

// 基本パターンチェック関数
function checkBasicExercisePatterns(text: string) {
  for (const patternObj of BASIC_EXERCISE_PATTERNS) {
    const { pattern, type, captureGroups } = patternObj;
    const match = text.match(pattern);
    if (match) {
      console.log('🎯 パターンマッチ成功:', { type, match: match.slice(1) });
      
      // 詳細パターンの処理
      if (type === 'strength_detailed') {
        const weight = convertWeightToKg(parseFloat(match[2]), match[3]);
        const reps = parseInt(match[4]);
        const sets = parseInt(match[6]);
        
        return {
          exerciseName: match[1],
          weight: weight,
          reps: reps,
          sets: sets,
          type: 'strength',
          source: 'detailed_pattern',
          detailType: 'weight_reps_sets'
        };
      }
      
      if (type === 'cardio_distance') {
        const distance = convertDistanceToKm(parseFloat(match[2]), match[3]);
        const duration = convertTimeToMinutes(parseInt(match[4]), match[5]);
        
        return {
          exerciseName: match[1],
          distance: distance,
          duration: duration,
          type: 'cardio',
          source: 'distance_time_pattern'
        };
      }
      
      if (type === 'strength_weight_reps') {
        const weight = convertWeightToKg(parseFloat(match[2]), match[3]);
        const reps = parseInt(match[4]);
        
        return {
          exerciseName: match[1],
          weight: weight,
          reps: reps,
          sets: 1, // デフォルト
          type: 'strength',
          source: 'weight_reps_pattern'
        };
      }
      
      if (type === 'cardio_distance_only') {
        const distance = convertDistanceToKm(parseFloat(match[2]), match[3]);
        
        return {
          exerciseName: match[1],
          distance: distance,
          duration: estimateDurationFromDistance(distance, match[1]),
          type: 'cardio',
          source: 'distance_only_pattern'
        };
      }
      
      // 時間ベースのパターン
      if (['cardio', 'strength', 'sports', 'flexibility', 'daily_activity'].includes(type)) {
        const duration = convertTimeToMinutes(parseInt(match[2]), match[3]);
        
        return {
          exerciseName: match[1],
          duration: duration,
          type: type,
          source: 'time_pattern'
        };
      }
      
      // 種目名のみパターン
      if (type === 'exercise_only') {
        return {
          exerciseName: match[1],
          duration: 30, // デフォルト30分
          type: getExerciseType(match[1]),
          source: 'exercise_only_pattern'
        };
      }
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
async function recordExerciseFromMatch(userId: string, match: any, replyToken: string, user: any) {
  try {
    await stopLoadingAnimation(userId);
    
    const { exerciseName, type, source, detailType } = match;
    
    // 詳細パターンの処理
    if (source === 'detailed_pattern') {
      return await recordDetailedExercise(userId, match, replyToken, user);
    }
    
    // 基本パターンの処理
    const duration = match.duration || 30;
    const exerciseType = getExerciseType(exerciseName, type);
    
    // カロリー計算
    const userWeight = await getUserWeight(userId) || 70;
    const mets = EXERCISE_METS[exerciseName] || 5.0;
    const caloriesBurned = Math.round((mets * userWeight * duration) / 60);
    
    // 運動データ作成
    const exerciseData = {
      id: generateId(),
      name: exerciseName,
      type: exerciseType,
      duration: duration,
      intensity: getIntensity(mets),
      caloriesBurned: caloriesBurned,
      notes: `LINE記録 ${new Date().toLocaleTimeString('ja-JP', { timeZone: 'Asia/Tokyo' })}`,
      timestamp: new Date(),
      time: new Date().toLocaleTimeString('ja-JP', { 
        hour: '2-digit', 
        minute: '2-digit',
        timeZone: 'Asia/Tokyo'
      }),
      lineUserId: userId
    };
    
    // 追加情報があれば設定
    if (match.distance) {
      exerciseData.distance = match.distance;
    }
    if (match.weight) {
      exerciseData.weight = match.weight;
    }
    if (match.reps) {
      exerciseData.reps = match.reps;
    }
    if (match.sets) {
      exerciseData.sets = match.sets;
    }
    
    // Firestoreに保存
    const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' });
    const db = admin.firestore();
    const recordRef = db.collection('users').doc(userId).collection('dailyRecords').doc(today);
    const recordDoc = await recordRef.get();
    const existingData = recordDoc.exists ? recordDoc.data() : {};
    const existingExercises = existingData.exercises || [];
    
    // 新しい運動を追加
    const updatedExercises = [...existingExercises, exerciseData];
    
    await recordRef.set({
      ...existingData,
      exercises: updatedExercises,
      date: today,
      lineUserId: userId,
      updatedAt: new Date()
    }, { merge: true });
    
    // 応答メッセージ作成
    let responseText = `${exerciseName} ${duration}分 を記録したよ！\n消費カロリー: ${caloriesBurned}kcal`;
    
    if (match.distance) {
      responseText = `${exerciseName} ${match.distance}km ${duration}分 を記録したよ！\n消費カロリー: ${caloriesBurned}kcal`;
    } else if (match.weight && match.reps && match.sets) {
      responseText = `${exerciseName} ${match.weight}kg ${match.reps}回 ${match.sets}セット を記録したよ！\n消費カロリー: ${caloriesBurned}kcal`;
    } else if (match.weight && match.reps) {
      responseText = `${exerciseName} ${match.weight}kg ${match.reps}回 を記録したよ！\n消費カロリー: ${caloriesBurned}kcal`;
    }
    
    await replyMessage(replyToken, [{
      type: 'text',
      text: responseText
    }]);
    
    console.log('✅ 運動記録完了:', exerciseData);
    
  } catch (error) {
    console.error('❌ 運動記録エラー:', error);
    await replyMessage(replyToken, [{
      type: 'text',
      text: '運動記録でエラーが発生しました。もう一度お試しください。'
    }]);
  }
}

// 詳細運動記録（重量・回数・セット）
async function recordDetailedExercise(userId: string, match: any, replyToken: string, user: any) {
  try {
    const { exerciseName, weight, reps, sets } = match;
    
    // 筋トレの場合の時間推定（セット間休憩含む）
    const estimatedDuration = sets * 3 + (sets - 1) * 2; // セット時間3分 + 休憩2分
    
    // カロリー計算（筋トレ用）
    const userWeight = await getUserWeight(userId) || 70;
    const baseMets = EXERCISE_METS[exerciseName] || 6.0;
    const caloriesBurned = Math.round((baseMets * userWeight * estimatedDuration) / 60);
    
    // 運動データ作成
    const exerciseData = {
      id: generateId(),
      name: exerciseName,
      type: 'strength',
      duration: estimatedDuration,
      intensity: 'moderate',
      caloriesBurned: caloriesBurned,
      weight: weight,
      reps: reps,
      sets: sets,
      notes: `LINE記録 ${new Date().toLocaleTimeString('ja-JP', { timeZone: 'Asia/Tokyo' })}`,
      timestamp: new Date(),
      time: new Date().toLocaleTimeString('ja-JP', { 
        hour: '2-digit', 
        minute: '2-digit',
        timeZone: 'Asia/Tokyo'
      }),
      lineUserId: userId
    };
    
    // Firestoreに保存
    const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' });
    const db = admin.firestore();
    const recordRef = db.collection('users').doc(userId).collection('dailyRecords').doc(today);
    const recordDoc = await recordRef.get();
    const existingData = recordDoc.exists ? recordDoc.data() : {};
    const existingExercises = existingData.exercises || [];
    
    const updatedExercises = [...existingExercises, exerciseData];
    
    await recordRef.set({
      ...existingData,
      exercises: updatedExercises,
      date: today,
      lineUserId: userId,
      updatedAt: new Date()
    }, { merge: true });
    
    await replyMessage(replyToken, [{
      type: 'text',
      text: `${exerciseName} ${weight}kg ${reps}回 ${sets}セット を記録したよ！\n推定時間: ${estimatedDuration}分\n消費カロリー: ${caloriesBurned}kcal`
    }]);
    
    console.log('✅ 詳細運動記録完了:', exerciseData);
    
  } catch (error) {
    console.error('❌ 詳細運動記録エラー:', error);
    throw error;
  }
}

// 運動詳細の確認
async function askForExerciseDetails(replyToken: string, originalText: string) {
  await replyMessage(replyToken, [{
    type: 'text',
    text: `運動を記録しますか？\n具体的な運動名と時間を教えてください。\n\n例：「ランニング30分」「ベンチプレス 50kg 10回 3セット」`,
    quickReply: {
      items: [
        { type: 'action', action: { type: 'text', label: 'ランニング30分' } },
        { type: 'action', action: { type: 'text', label: '筋トレ45分' } },
        { type: 'action', action: { type: 'text', label: 'ウォーキング20分' } }
      ]
    }
  }]);
}

// ユーティリティ関数
function convertWeightToKg(value: number, unit: string): number {
  if (unit.toLowerCase().includes('kg') || unit === 'キロ') {
    return value;
  }
  return value; // デフォルトはkg
}

function convertDistanceToKm(value: number, unit: string): number {
  if (unit.toLowerCase().includes('km') || unit === 'キロ') {
    return value;
  }
  if (unit.toLowerCase().includes('m') || unit === 'メートル') {
    return value / 1000;
  }
  return value; // デフォルトはkm
}

function convertTimeToMinutes(value: number, unit: string): number {
  const timeUnits = {
    '秒': value / 60,
    'sec': value / 60,
    's': value / 60,
    '分': value,
    'min': value,
    'm': value,
    '時間': value * 60,
    'hour': value * 60,
    'h': value * 60
  };
  
  for (const [unitKey, convertedValue] of Object.entries(timeUnits)) {
    if (unit.includes(unitKey)) {
      return convertedValue;
    }
  }
  
  return value; // デフォルトは分
}

function estimateDurationFromDistance(distance: number, exerciseName: string): number {
  // 距離から時間を推定（速度ベース）
  const speeds = {
    'ランニング': 10, // 10km/h
    'ウォーキング': 5, // 5km/h
    'ジョギング': 8, // 8km/h
    'サイクリング': 20, // 20km/h
    '自転車': 20
  };
  
  const speed = speeds[exerciseName] || 8; // デフォルト8km/h
  return Math.round((distance / speed) * 60); // 分に変換
}

function getExerciseType(exerciseName: string, patternType?: string): string {
  if (patternType) return patternType;
  
  const cardioExercises = [
    'ランニング', 'ウォーキング', 'ジョギング', 'サイクリング', '水泳', 'エアロビクス',
    '走る', '歩く', '泳ぐ', 'ジョグ', '自転車', 'チャリ', '散歩', '早歩き', 'マラソン'
  ];
  
  const strengthExercises = [
    'ベンチプレス', 'スクワット', 'デッドリフト', '懸垂', '腕立て伏せ', '腕立て', '腹筋', 
    '背筋', '肩トレ', 'ショルダープレス', 'ラットプルダウン', 'レッグプレス', 'プランク',
    'バーベルカール', 'ダンベルカール', 'チンアップ', 'プルアップ', 'ディップス'
  ];
  
  const flexibilityExercises = [
    'ヨガ', 'ピラティス', 'ストレッチ', '柔軟', '柔軟体操', 'ラジオ体操'
  ];
  
  const sportsExercises = [
    'テニス', 'バドミントン', '卓球', 'バスケ', 'サッカー', '野球', 'ゴルフ',
    'バレーボール', 'ハンドボール', 'ラグビー', 'アメフト'
  ];
  
  if (cardioExercises.includes(exerciseName)) return 'cardio';
  if (strengthExercises.includes(exerciseName)) return 'strength';
  if (flexibilityExercises.includes(exerciseName)) return 'flexibility';
  if (sportsExercises.includes(exerciseName)) return 'sports';
  
  return 'other';
}

function getIntensity(mets: number): string {
  if (mets < 3) return 'low';
  if (mets < 6) return 'moderate';
  return 'high';
}

// ユーザーの体重を取得
async function getUserWeight(userId: string): Promise<number | null> {
  try {
    const db = admin.firestore();
    
    // 最近7日間の体重記録をチェック
    for (let i = 0; i < 7; i++) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' });
      
      try {
        const recordRef = db.collection('users').doc(userId).collection('dailyRecords').doc(dateStr);
        const dailyDoc = await recordRef.get();
        const dailyData = dailyDoc.exists ? dailyDoc.data() : null;
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

// === ユーザー固有パターン機能 ===
// ユーザー固有パターンの動的生成・更新
async function updateUserExercisePatterns(userId: string) {
  try {
    const db = admin.firestore();
    
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
    const db = admin.firestore();
    const exercises = [];
    
    // 期間内の各日をチェック
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateStr = currentDate.toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' });
      try {
        const recordRef = db.collection('users').doc(userId).collection('dailyRecords').doc(dateStr);
        const dailyDoc = await recordRef.get();
        const dailyData = dailyDoc.exists ? dailyDoc.data() : null;
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
  // 既存の基本パターンに含まれない運動名だけを抽出
  const basicExerciseNames = new Set();
  BASIC_EXERCISE_PATTERNS.forEach(patternObj => {
    const patternStr = patternObj.pattern.source;
    // 最初のグループから運動名を抽出
    const match = patternStr.match(/\^\(([^)]+)\)/);
    if (match) {
      const names = match[1].split('|');
      names.forEach(name => {
        if (name.includes('\\\\')) {
          // エスケープされた文字を元に戻す
          basicExerciseNames.add(name.replace(/\\\\/g, ''));
        } else {
          basicExerciseNames.add(name);
        }
      });
    }
  });
  
  // 新しい運動名のみをフィルタリング
  const newExerciseNames = exerciseNames.filter(name => !basicExerciseNames.has(name));
  
  if (newExerciseNames.length === 0) {
    return [];
  }
  
  const escapedNames = newExerciseNames.map(name => name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const namePattern = `(${escapedNames.join('|')})`;
  
  return [
    { pattern: new RegExp(`^${namePattern}\\s*(\\d+)\\s*(分|時間|min|mins|hour|hours|h|m)$`, 'i'), type: 'user_exercise_time' },
    { pattern: new RegExp(`^${namePattern}\\s*(\\d+)\\s*(回|レップ|セット|rep|reps|set|sets)$`, 'i'), type: 'user_exercise_reps' },
    { pattern: new RegExp(`^${namePattern}\\s*(\\d+)$`, 'i'), type: 'user_exercise_simple' }, // 単位なし
    { pattern: new RegExp(`^${namePattern}$`, 'i'), type: 'user_exercise_only' } // 運動名のみ
  ];
}

// ユーザーパターンチェック
function checkUserExercisePatterns(userId: string, text: string) {
  const patterns = userExercisePatterns.get(userId);
  if (!patterns || patterns.length === 0) return null;
  
  for (const { pattern, type } of patterns) {
    const match = text.match(pattern);
    if (match) {
      console.log('🎯 ユーザーパターンマッチ:', { type, exerciseName: match[1], match: match.slice(1) });
      
      if (type === 'user_exercise_time') {
        const duration = convertTimeToMinutes(parseInt(match[2]), match[3]);
        return {
          exerciseName: match[1],
          duration: duration,
          type: getExerciseType(match[1]),
          source: 'user_time_pattern'
        };
      }
      
      if (type === 'user_exercise_reps') {
        const value = parseInt(match[2]);
        const unit = match[3];
        
        if (unit.includes('回') || unit.includes('レップ') || unit.includes('rep')) {
          // 回数ベースの場合、時間を推定
          const estimatedDuration = Math.max(value / 10, 5); // 10回=1分、最低5分
          return {
            exerciseName: match[1],
            duration: estimatedDuration,
            reps: value,
            type: getExerciseType(match[1]),
            source: 'user_reps_pattern'
          };
        } else {
          // セットベースの場合
          const estimatedDuration = value * 3; // 1セット=3分
          return {
            exerciseName: match[1],
            duration: estimatedDuration,
            sets: value,
            type: getExerciseType(match[1]),
            source: 'user_sets_pattern'
          };
        }
      }
      
      if (type === 'user_exercise_simple') {
        // 数値のみの場合、デフォルトで分として処理
        return {
          exerciseName: match[1],
          duration: parseInt(match[2]),
          type: getExerciseType(match[1]),
          source: 'user_simple_pattern'
        };
      }
      
      if (type === 'user_exercise_only') {
        // 運動名のみの場合、デフォルト30分
        return {
          exerciseName: match[1],
          duration: 30,
          type: getExerciseType(match[1]),
          source: 'user_only_pattern'
        };
      }
    }
  }
  return null;
}