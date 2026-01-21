import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { FirestoreService } from '@/services/firestoreService';
import AIHealthService from '@/services/aiService';
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { admin } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { getCharacterPersona, getCharacterLanguage } from '@/utils/aiCharacterUtils';
import { calculateCalorieTarget, calculateMacroTargets } from '@/utils/calculations';
import { createMealFlexMessage, createMultipleMealTimesFlexMessage, createWeightFlexMessage, createCalorieOnlyFlexMessage } from './new_flex_message';
import { findFoodMatch, FOOD_DATABASE } from '@/utils/foodDatabase';
import { generateId } from '@/lib/utils';
import { apiCache, createCacheKey } from '@/lib/cache';
import { checkUsageLimit, recordUsage } from '@/utils/usageLimits';

// 画像キャッシュ（メモリに一時保存）
const imageCache = new Map<string, Buffer>();

// 学習済み食事をFirestoreから検索
async function findLearnedFood(userId: string, text: string) {
  try {
    const db = admin.firestore();
    const userFoodRef = db.collection('learned_foods').doc(userId);
    const doc = await userFoodRef.get();
    
    if (!doc.exists) return null;
    
    const learnedFoods = doc.data();
    const normalizedText = text.toLowerCase().replace(/\s/g, '');
    
    // 完全一致をチェック
    for (const [foodName, foodData] of Object.entries(learnedFoods)) {
      if (foodName === text || foodName.toLowerCase() === normalizedText) {
        return { food: foodName, data: foodData, confidence: 'high' };
      }
    }
    
    // 部分一致をチェック
    for (const [foodName, foodData] of Object.entries(learnedFoods)) {
      if (text.includes(foodName) || foodName.includes(text) ||
          normalizedText.includes(foodName.toLowerCase()) || foodName.toLowerCase().includes(normalizedText)) {
        return { food: foodName, data: foodData, confidence: 'medium' };
      }
    }
    
    return null;
  } catch (error) {
    console.error('❌ 学習済み食事の検索エラー:', error);
    return null;
  }
}

// 学習済み食事をFirestoreに保存
async function addToLearnedFoods(userId: string, mealName: string, nutritionData: any) {
  try {
    const db = admin.firestore();
    const userFoodRef = db.collection('learned_foods').doc(userId);
    
    // ユーザー固有の学習済み食事を保存
    await userFoodRef.set({
      [mealName]: {
        calories: nutritionData.calories || 0,
        protein: nutritionData.protein || 0,
        fat: nutritionData.fat || 0,
        carbs: nutritionData.carbs || 0,
        learnedAt: FieldValue.serverTimestamp(),
        usageCount: FieldValue.increment(1),
        isPatternMatched: nutritionData.isPatternMatched || false,
        matchConfidence: nutritionData.matchConfidence || 'ai_analyzed'
      }
    }, { merge: true });
    
    console.log(`📚 学習済み食事に追加: ${mealName} (ユーザー: ${userId})`);
  } catch (error) {
    console.error('❌ 学習済み食事の保存エラー:', error);
  }
}

// 画像キャッシュに保存
function cacheImage(userId: string, imageData: Buffer): string {
  const cacheKey = `${userId}_${Date.now()}`;
  imageCache.set(cacheKey, imageData);
  
  // 5分後に自動削除
  setTimeout(() => {
    imageCache.delete(cacheKey);
  }, 5 * 60 * 1000);
  
  return cacheKey;
}

// 画像キャッシュから取得
function getCachedImage(cacheKey: string): Buffer | null {
  return imageCache.get(cacheKey) || null;
}

// カウンセリング完了状態をチェック
async function isCounselingCompleted(userId: string): Promise<boolean> {
  try {
    const db = admin.firestore();
    const counselingRef = db.collection('users').doc(userId).collection('counseling').doc('result');
    const counselingSnap = await counselingRef.get();
    
    if (!counselingSnap.exists) {
      return false;
    }
    
    const counselingData = counselingSnap.data();
    const aiAnalysis = counselingData?.aiAnalysis;
    
    // aiAnalysisと栄養プランが存在し、カロリー目標が設定されているかチェック
    return !!(
      aiAnalysis?.nutritionPlan?.dailyCalories &&
      counselingData?.answers
    );
  } catch (error) {
    console.error('カウンセリング状態チェックエラー:', error);
    return false;
  }
}

// カウンセリング誘導メッセージを送信（友達追加時と同じ形式）
async function sendCounselingPrompt(replyToken: string, actionName: string) {
  const counselingMessage = {
    type: 'template',
    altText: `${actionName}を利用するには初期設定が必要です`,
    template: {
      type: 'buttons',
      text: `${actionName}を利用するには、まず初期設定（カウンセリング）を完了する必要があります。\n\nあなたについていくつか教えてもらえる？`,
      actions: [{
        type: 'uri',
        label: 'カウンセリング開始',
        uri: process.env.NEXT_PUBLIC_LIFF_ID ? `https://liff.line.me/${process.env.NEXT_PUBLIC_LIFF_ID}/counseling` : `${process.env.NEXT_PUBLIC_APP_URL}/counseling`
      }]
    }
  };

  await replyMessage(replyToken, [counselingMessage]);
}

// 統一モード：記録後のクイックリプライは削除済み

// 🔄 処理中フラグ管理（メモリベース）
const processingUsers = new Map<string, boolean>();

function isProcessing(userId: string): boolean {
  return processingUsers.get(userId) || false;
}

function setProcessing(userId: string, processing: boolean): void {
  if (processing) {
    processingUsers.set(userId, true);
  } else {
    processingUsers.delete(userId);
  }
}

// 🔄 連続入力防止（メモリベース）
const lastTapTime = new Map<string, number>();

function canProcessTap(userId: string): boolean {
  const now = Date.now();
  const lastTime = lastTapTime.get(userId) || 0;
  
  if (now - lastTime < 1000) { // 1秒以内の連続タップを防止
    return false;
  }
  
  lastTapTime.set(userId, now);
  return true;
}

// ID生成関数
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

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

    const data = JSON.parse(body);
    let events = data.events || [];

    // メンテナンスモードチェック（開発者ID除外）
    if (process.env.MAINTENANCE_MODE === 'true') {
      // 開発者ID一覧
      const DEVELOPER_IDS = [
        process.env.DEVELOPER_LINE_ID,
        'U7fd12476d6263912e0d9c99fc3a6bef9', // 半年プランテスト用ID（永続無料）
      ].filter(Boolean);
      
      // 開発者以外をブロック
      const nonDeveloperEvents = events.filter(event => {
        const userId = event.source?.userId;
        if (!userId) return true; // userIdがない場合はブロック
        
        if (DEVELOPER_IDS.includes(userId)) {
          console.log('🔧 開発者ID検出: メンテナンス中でもアクセス許可', userId);
          return false; // 開発者は通す
        }
        return true; // その他はブロック対象
      });
      
      if (nonDeveloperEvents.length > 0) {
        console.log('🔧 メンテナンスモード: 一般ユーザーリクエストをブロック');
        
        for (const event of nonDeveloperEvents) {
          if (event.replyToken && (event.type === 'message' || event.type === 'postback')) {
            const client = new (require('@line/bot-sdk')).Client({
              channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN
            });
            
            const maintenanceMessage = {
              type: 'text',
              text: '🔧 メンテナンス中 🔧\n\n大変申し訳ございません。\nただいまシステムメンテナンス中です。\n\nしばらくお待ちください。🙏'
            };
            
            try {
              await client.replyMessage(event.replyToken, maintenanceMessage);
              console.log('✅ メンテナンスメッセージ送信完了');
            } catch (error) {
              console.error('❌ メンテナンスメッセージ送信失敗:', error);
            }
          }
        }
      }
      
      // 開発者のイベントのみを処理対象として残す（メンテナンスモード時）
      const developerEvents = events.filter(event => {
        const userId = event.source?.userId;
        return userId && DEVELOPER_IDS.includes(userId);
      });
      
      // 開発者イベントが無い場合はここで終了
      if (developerEvents.length === 0) {
        return NextResponse.json({ status: 'maintenance_mode' });
      }
      
      // 処理対象を開発者イベントのみに変更
      events = developerEvents;
      
      console.log('🔧 開発者イベント継続処理:', events.length, '件');
    }
    
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
    // 統一モード：「記録」キーワードで記録判定（多言語機能は一時無効化）
    const isRecordIntent = text.includes('記録');
    
    // 多言語キーワード（将来復活予定）
    // const recordKeywords = [
    //   '記録', 'きろく',           // 日本語・ひらがな
    //   'record', 'log', 'save',   // 英語
    //   '기록', '기록해',          // 韓国語  
    //   '记录', '記錄',            // 中国語（簡体字・繁体字）
    //   'registro', 'registrar'    // スペイン語
    // ];
    // const isRecordIntent = recordKeywords.some(keyword => 
    //   text.toLowerCase().includes(keyword.toLowerCase())
    // );
    
    // AI会話の利用制限チェック（記録意図ではない場合のみ）
    if (!isRecordIntent) {
      const aiLimit = await checkUsageLimit(userId, 'ai');
      if (!aiLimit.allowed) {
        console.log('⚠️ AI会話制限達成', { userId, reason: aiLimit.reason });
        await stopLoadingAnimation(userId);
        await replyMessage(replyToken, [await createUsageLimitFlex('ai', userId)]);
        return;
      }
    }
    
    // Loading Animation開始（AIが考え中）
    await startLoadingAnimation(userId, 15);
    
    const aiService = new AIHealthService();
    
    // デバッグ: ステータス確認コマンド
    if (text.includes('ステータス') || text.includes('状態')) {
      await replyMessage(replyToken, [{
        type: 'text',
        text: `現在の状態: 統一モード（多言語記録キーワードで記録処理）\n対応キーワード: 記録/きろく/record/log/save/기록/记录/記錄/registro/registrar`
      }]);
      return;
    }
    
    if (isRecordIntent) {
      // 統一モード：多言語「記録」キーワードが含まれる場合のみ記録処理
      console.log('📝 統一モード - 多言語記録キーワード検出、記録処理開始:', text);
      
      // 連続入力防止
      if (!canProcessTap(userId)) {
        console.log('🚫 統一モード - 連続入力防止: 処理スキップ');
        return;
      }
      
      // 体重記録のパターンマッチング判定（AI呼び出しを削除）
      console.log('📊 統一モード - 体重記録パターン判定開始:', text);

      function analyzeWeightPattern(text: string) {
        try {
          // 🎯 体重文脈の事前チェック（優先判定）
          const hasWeightContext = /(体重|weight|kg|ｋｇ|キロ|キログラム)/i.test(text);
          
          // 疑問符チェック（質問・相談を除外）- ただし体重記録依頼は許可
          const hasQuestionMark = /[？?]/.test(text);
          const hasQuestionWords = /(どう|何|なに|いくつ|どのくらい|どれくらい)/.test(text);
          const isRecordRequest = /(記録|して|お願い|please)/i.test(text);
          
          if ((hasQuestionMark || hasQuestionWords) && !(hasWeightContext && isRecordRequest)) {
            console.log('❌ 体重判定 - 質問・相談として除外:', text);
            return { isWeightRecord: false, reason: '質問・相談' };
          }
          
          
          // 体重数値の抽出（優先度順）
          const patterns = [
            // 1. 明確な単位付き
            /(\d+(?:\.\d+)?)\s*(kg|ｋｇ|キロ|キログラム)/i,
            // 2. 体重文脈での数値のみ
            /体重.*?(\d+(?:\.\d+)?)/i,
            // 3. 数値のみ（体重関連キーワードが必要）
            /^(\d+(?:\.\d+)?)$/
          ];
          
          for (let i = 0; i < patterns.length; i++) {
            const match = text.match(patterns[i]);
            if (match) {
              const weight = parseFloat(match[1]);
              
              // 妥当性チェック（極端な値は記録するが警告）
              if (weight < 20 || weight > 300) {
                console.log('⚠️ 体重値が極端です:', weight);
                // でも記録は続行（ユーザーの意図を尊重）
              }
              
              // パターン3の場合は体重キーワードが必要
              if (i === 2) {
                const hasWeightContext = /体重|weight/i.test(text);
                if (!hasWeightContext) {
                  console.log('❌ 数値のみ - 体重文脈なし:', text);
                  continue;
                }
              }
              
              console.log('✅ 体重記録パターンマッチ成功:', { weight, pattern: i + 1 });
              return {
                isWeightRecord: true,
                weight: weight,
                confidence: i === 0 ? 0.95 : (i === 1 ? 0.9 : 0.8)
              };
            }
          }
          
          console.log('❌ 体重パターンマッチ失敗:', text);
          return { isWeightRecord: false, reason: 'パターン不一致' };
          
        } catch (error) {
          console.error('体重パターン判定エラー:', error);
          return { isWeightRecord: false, reason: 'エラー' };
        }
      }

      const weightJudgment = analyzeWeightPattern(text);
      console.log('📊 統一モード - 体重パターン判定結果:', JSON.stringify(weightJudgment, null, 2));

      if (weightJudgment.isWeightRecord) {
        // 記録実行前に制限チェック
        const recordLimit = await checkUsageLimit(userId, 'record');
        if (!recordLimit.allowed) {
          console.log('⚠️ 記録制限達成（体重記録時）', { userId, reason: recordLimit.reason });
          await stopLoadingAnimation(userId);
          await replyMessage(replyToken, [await createUsageLimitFlex('record', userId)]);
          return;
        }
        
        await handleWeightRecord(userId, weightJudgment, replyToken);
        // 記録成功時に使用回数を記録
        await recordUsage(userId, 'record');
        return;
      }
      
      // 食事記録の判定
      console.log('🍽️ 統一モード - 食事記録判定開始:', text);
      try {
        const mealJudgment = await aiService.analyzeFoodRecordIntent(text);
        console.log('🍽️ 統一モード - 食事判定結果:', JSON.stringify(mealJudgment, null, 2));
        
        if (mealJudgment.isFoodRecord) {
          console.log('🍽️ 記録モード - 食事として認識、パターンマッチング開始');
          
          // Step 1: 学習済み食事を検索
          const learnedFood = await findLearnedFood(userId, mealJudgment.foodText || text);
          let mealAnalysis;
          
          if (false) { // 学習済み食事マッチを無効化してAI分析を強制
            console.log('🎯 学習済み食事マッチ:', learnedFood.food, '信頼度:', learnedFood.confidence);
            mealAnalysis = {
              calories: learnedFood.data.calories,
              protein: learnedFood.data.protein,
              fat: learnedFood.data.fat,
              carbs: learnedFood.data.carbs,
              foodItems: [learnedFood.food],
              displayName: learnedFood.food,
              baseFood: learnedFood.food,
              isPatternMatched: true,
              matchConfidence: 'learned_food',
              source: 'learned'
            };
            
            // 使用回数を増やす
            await addToLearnedFoods(userId, learnedFood.food, mealAnalysis);
            
          } else {
            // Step 2: 基本データベースでパターンマッチング
            const foodMatch = findFoodMatch(mealJudgment.foodText || text);
            
            if (foodMatch && foodMatch.confidence === 'high') {
              console.log('✅ パターンマッチング成功:', foodMatch.food.name, '信頼度:', foodMatch.confidence);
              // パターンマッチングで栄養価を計算
              const food = foodMatch.food;
              const servingSize = food.commonServing || 100; // デフォルト100g
              
              mealAnalysis = {
                calories: Math.round((food.calories * servingSize) / 100),
                protein: Number(((food.protein * servingSize) / 100).toFixed(1)),
                fat: Number(((food.fat * servingSize) / 100).toFixed(1)),
                carbs: Number(((food.carbs * servingSize) / 100).toFixed(1)),
                foodItems: [food.name],
                displayName: food.name,
                baseFood: food.name,
                portion: `${servingSize}g`,
                isPatternMatched: true,
                matchConfidence: foodMatch.confidence,
                source: 'database'
              };
              
              // 学習済み食事としてFirestoreに保存
              await addToLearnedFoods(userId, food.name, mealAnalysis);
              
            } else {
              console.log('❌ パターンマッチング失敗、AI分析開始');
              // Step 3: パターンマッチングできない場合はAI分析
              mealAnalysis = await aiService.analyzeMealFromText(mealJudgment.foodText || text);
              
              // AI分析成功時も学習済み食事として保存
              if (mealAnalysis && mealAnalysis.foodItems && mealAnalysis.foodItems.length > 0) {
                mealAnalysis.source = 'ai_analyzed';
                await addToLearnedFoods(userId, mealAnalysis.foodItems[0], mealAnalysis);
              }
            }
          }
          
          console.log('🍽️ 記録モード - 最終分析結果:', JSON.stringify(mealAnalysis, null, 2));
          await storeTempMealAnalysis(userId, mealAnalysis, null, text);
          
          // 記録実行前に制限チェック
          const recordLimit = await checkUsageLimit(userId, 'record');
          if (!recordLimit.allowed) {
            console.log('⚠️ 記録制限達成（食事記録時）', { userId, reason: recordLimit.reason });
            await stopLoadingAnimation(userId);
            await replyMessage(replyToken, [await createUsageLimitFlex('record', userId)]);
            return;
          }
          
          if (mealJudgment.isMultipleMealTimes) {
            // 複数食事時間の処理
            await handleMultipleMealTimesRecord(userId, mealJudgment.mealTimes, replyToken);
            // 記録成功時に使用回数を記録
            await recordUsage(userId, 'record');
            // 記録後もクイックリプライで記録モード継続
            return;
          } else if (mealJudgment.hasSpecificMealTime) {
            const mealType = mealJudgment.mealTime;
            await saveMealRecord(userId, mealType, replyToken);
            // 記録成功時に使用回数を記録
            await recordUsage(userId, 'record');
            // 記録後もクイックリプライで記録モード継続
            return;
          } else {
            // 食事タイプ選択のクイックリプライ表示（日本語固定）
            await stopLoadingAnimation(userId);
            await replyMessage(replyToken, [{
              type: 'text',
              text: `どの食事を記録しますか？`,
              quickReply: {
                items: [
                  { type: 'action', action: { type: 'postback', label: '朝食', data: 'action=meal_breakfast' }},
                  { type: 'action', action: { type: 'postback', label: '昼食', data: 'action=meal_lunch' }},
                  { type: 'action', action: { type: 'postback', label: '夕食', data: 'action=meal_dinner' }},
                  { type: 'action', action: { type: 'postback', label: '間食', data: 'action=meal_snack' }},
                  { type: 'action', action: { type: 'postback', label: '記録しない', data: 'action=cancel_record' }}
                ]
              }
            }]);
            return;
          }
        }
      } catch (mealAnalysisError) {
        console.error('🔥 食事記録判定エラー:', {
          error: mealAnalysisError.message,
          stack: mealAnalysisError.stack,
          text: text
        });
        // エラー時は通常のAI会話に移行
      }
    }
    
    console.log('🤖 通常モード - AI会話で応答');
    
    // 厳格なレシピ判定
    console.log('🔍 厳格レシピ判定開始:', text.substring(0, 50));
    const isRecipe = await aiService.isRecipeQuestion(text);
    console.log('🍳 厳格レシピ判定結果:', { isRecipe, text });
    
    let aiResponse;
    
    if (isRecipe) {
      console.log('🍳 レシピFlexメッセージ生成開始');
      const recipeResult = await aiService.generateRecipeWithFlex(text, userId);
      console.log('🍳 レシピ生成完了:', { hasFlexMessage: !!recipeResult.flexMessage });
      
      if (recipeResult.flexMessage) {
        console.log('🍳 レシピFlexメッセージ送信開始');
        // Flexメッセージを送信
        await stopLoadingAnimation(userId);
        await replyMessage(replyToken, [
          recipeResult.flexMessage
        ]);
        
        // 会話履歴を保存
        await aiService.saveConversation(userId, text, recipeResult.textResponse);
        // AI応答成功時に使用回数を記録
        await recordUsage(userId, 'ai');
        console.log('🍳 レシピFlexメッセージ送信完了');
        return;
      } else {
        aiResponse = recipeResult.textResponse;
      }
    } else {
      // 通常のAI会話
      const characterSettings = null;
      aiResponse = await aiService.generateGeneralResponse(text, userId, characterSettings);
    }
    
    // 会話履歴を保存
    if (aiResponse) {
      await aiService.saveConversation(userId, text, aiResponse);
      // AI応答成功時に使用回数を記録
      await recordUsage(userId, 'ai');
    }
    
    await stopLoadingAnimation(userId);
    await replyMessage(replyToken, [{
      type: 'text',
      text: aiResponse || 'すみません、よく分からなかったです。健康管理についてお手伝いできることがあれば、お気軽にお声がけください！'
    }]);
    
  } catch (error) {
    console.error('テキストメッセージ処理エラー:', error);
    // エラー時は一般会話で応答
    const aiService = new AIHealthService();
    const characterSettings = null;
    const aiResponse = await aiService.generateGeneralResponse(text, userId, characterSettings);
    
    // 会話履歴を保存
    if (aiResponse) {
      await aiService.saveConversation(userId, text, aiResponse);
    }
    
    await stopLoadingAnimation(userId);
    await replyMessage(replyToken, [{
      type: 'text',
      text: aiResponse || 'すみません、よく分からなかったです。健康管理についてお手伝いできることがあれば、お気軽にお声がけください！'
    }]);
  }
}

// 複数食事時間記録処理
async function handleMultipleMealTimesRecord(userId: string, mealTimes: any[], replyToken: string) {
  try {
    console.log('🍽️ 複数食事時間記録開始:', { userId, mealTimes });
    
    // 🚨 既存と同じ流れ：一時保存されたデータを取得
    const tempData = await getTempMealAnalysis(userId);
    if (!tempData) {
      await stopLoadingAnimation(userId);
      await pushMessage(userId, [{
        type: 'text',
        text: 'データが見つかりません。もう一度食事内容を送ってください。'
      }]);
      return;
    }
    
    // 🚨 重複防止：一時データを即座に削除（既存と同じ）
    await deleteTempMealAnalysis(userId);
    console.log('🔒 重複防止: 一時データを削除しました');
    
    const aiService = new AIHealthService();
    const mealData = {};
    
    // 各食事時間ごとに分析・記録
    for (const mealTimeInfo of mealTimes) {
      const { mealTime, foodText } = mealTimeInfo;
      
      console.log(`🍽️ 食事時間 ${mealTime} の分析開始: ${foodText}`);
      
      // 食事内容を分析
      const mealAnalysis = await aiService.analyzeMealFromText(foodText);
      
      if (mealAnalysis.isMultipleMeals) {
        // 複数食事の場合
        mealData[mealTime] = mealAnalysis.meals.map(meal => ({
          ...meal,
          name: meal.displayName || meal.name,
          type: mealTime,
          time: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Tokyo' }),
          images: [],
          foodItems: [mealAnalysis.displayName || foodText],
          timestamp: new Date(),
          createdAt: new Date(),
          id: generateId(),
          lineUserId: userId
        }));
      } else {
        // 単一食事の場合
        mealData[mealTime] = [{
          name: mealAnalysis.displayName || mealAnalysis.foodItems?.[0] || foodText,
          displayName: mealAnalysis.displayName || foodText,
          baseFood: mealAnalysis.baseFood || foodText,
          portion: mealAnalysis.portion || '',
          calories: mealAnalysis.calories || 0,
          protein: mealAnalysis.protein || 0,
          fat: mealAnalysis.fat || 0,
          carbs: mealAnalysis.carbs || 0,
          type: mealTime,
          time: new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Tokyo' }),
          images: [],
          foodItems: [mealAnalysis.displayName || foodText],
          timestamp: new Date(),
          createdAt: new Date(),
          id: generateId(),
          lineUserId: userId
        }];
      }
      
      // Firestoreに保存
      console.log(`🍽️ ${mealTime} 保存データ:`, JSON.stringify(mealData[mealTime], null, 2));
      await saveMultipleMealsByType(userId, mealTime, mealData[mealTime]);
      console.log(`🍽️ ${mealTime} 保存完了`);
    }
    
    // 複数食事時間用のFlexメッセージを作成・送信
    const flexMessage = createMultipleMealTimesFlexMessage(mealData, null);
    
    await stopLoadingAnimation(userId);
    await pushMessage(userId, [flexMessage]);
    
    console.log('🍽️ 複数食事時間記録完了');
    
  } catch (error) {
    console.error('🍽️ 複数食事時間記録エラー:', error);
    await stopLoadingAnimation(userId);
    await replyMessage(replyToken, [{
      type: 'text',
      text: '複数食事の記録でエラーが発生しました。もう一度お試しください。',
    }]);
  }
}

// 複数食事を食事タイプ別にFirestoreに保存
async function saveMultipleMealsByType(userId: string, mealType: string, meals: any[]) {
  try {
    console.log(`🍽️ ${mealType} 保存開始:`, { userId, meals: meals.length });
    const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' });
    const recordRef = admin.firestore().collection('users').doc(userId).collection('dailyRecords').doc(today);
    
    const recordDoc = await recordRef.get();
    const existingData = recordDoc.exists ? recordDoc.data() : {};
    const existingMeals = existingData.meals || [];
    
    // 新しい食事を追加
    const updatedMeals = [...existingMeals, ...meals];
    
    await recordRef.set({
      ...existingData,
      meals: updatedMeals,
      lastModified: new Date()
    }, { merge: true });
    
    console.log(`🍽️ ${mealType} 保存完了:`, updatedMeals.length, '件');
  } catch (error) {
    console.error(`🍽️ ${mealType} 保存エラー:`, error);
    throw error;
  }
}

async function handleImageMessage(replyToken: string, userId: string, messageId: string, user: any) {
  try {
    console.log('🔥 統一モード画像処理開始:', { userId, messageId });
    
    // 処理中チェック（重複画像処理防止）
    if (isProcessing(userId)) {
      console.log('⏳ 処理中: 画像処理を無視');
      await replyMessage(replyToken, [{
        type: 'text',
        text: '処理中です。少々お待ちください...'
      }]);
      return;
    }
    
    // 処理開始フラグを設定
    setProcessing(userId, true);
    
    try {
      // Loading Animation開始（AIが画像分析中）
      await startLoadingAnimation(userId, 30);
      
      // 1. 画像を取得
      const imageContent = await getImageContent(messageId);
      if (!imageContent) {
        await stopLoadingAnimation(userId);
        await replyMessage(replyToken, [{
          type: 'text',
          text: '画像がうまく受け取れませんでした。もう一度送ってみてください。'
        }]);
        return;
      }

      // 2. 統一モード：まず画像を分析して食事かどうか判定
      const aiService = new AIHealthService();
      const mealAnalysis = await aiService.analyzeMealFromImage(imageContent);
      
      console.log('🔍 画像分析結果:', { 
        isFoodImage: mealAnalysis.isFoodImage, 
        description: mealAnalysis.description 
      });
      
      // 3. 食事画像の場合：クイックリプライで記録選択肢を表示
      if (mealAnalysis.isFoodImage) {
        // 記録制限チェック（食事画像の場合のみ）
        const recordLimit = await checkUsageLimit(userId, 'record');
        if (!recordLimit.allowed) {
          console.log('🔄 記録制限に達しました:', userId);
          await replyMessage(replyToken, [await createUsageLimitFlex('record', userId)]);
          return;
        }
        
        // 食事画像をキャッシュに保存し、分析結果を一時保存
        const imageCacheKey = cacheImage(userId, imageContent);
        await storeTempMealAnalysis(userId, mealAnalysis, null, '', imageCacheKey);
        
        // 画像記録として使用回数をカウント
        await recordUsage(userId, 'record');
        
        // 食事タイプ選択のクイックリプライ表示（「しない」オプション含む）
        await showMealTypeSelection(replyToken);
        await stopLoadingAnimation(userId);
        
        console.log('🍽️ 食事画像検出: クイックリプライ表示');
        return;
      }
      
      // 4. 食事以外の画像の場合：通常AI会話として処理
      console.log('🤖 非食事画像: 通常AI会話として処理');
      
      // AI制限チェック（非食事画像の場合）
      const aiLimit = await checkUsageLimit(userId, 'ai');
      if (!aiLimit.allowed) {
        console.log('🔄 AI制限に達しました:', userId);
        await replyMessage(replyToken, [await createUsageLimitFlex('ai', userId)]);
        return;
      }
      
      // 一般的な画像解析を実行
      const imageDescription = await aiService.analyzeGeneralImage(imageContent);
      
      // 画像の内容を含めてAI会話
      const characterSettings = null;
      const prompt = `画像を送ってもらいました。画像の内容：「${imageDescription}」。この画像について何か話しましょう。`;
      const aiResponse = await aiService.generateGeneralResponse(prompt, userId, characterSettings);
      
      // 会話履歴を保存
      if (aiResponse) {
        await aiService.saveConversation(userId, '画像を送信', aiResponse);
      }
      
      // AI応答成功時に使用回数を記録
      await recordUsage(userId, 'ai');
      
      await stopLoadingAnimation(userId);
      await replyMessage(replyToken, [{
        type: 'text',
        text: aiResponse
      }]);
      return;
      
    } catch (error) {
      console.error('🔥 統一モード画像処理エラー:', {
        error: error.message,
        stack: error.stack,
        userId,
        messageId
      });
      await stopLoadingAnimation(userId);
      await replyMessage(replyToken, [{
        type: 'text',
        text: `すみません、画像の処理中にエラーが発生しました。エラー詳細: ${error.message} もう一度試してみてください。`
      }]);
    } finally {
      // 処理完了フラグをクリア
      setProcessing(userId, false);
    }
  } catch (outerError) {
    // 外側のtryブロックでのエラー（処理フラグ設定前のエラー）
    console.error('🔥 統一モード画像処理外側エラー:', {
      error: outerError.message,
      stack: outerError.stack,
      userId,
      messageId
    });
    await replyMessage(replyToken, [{
      type: 'text',
      text: `すみません、画像の処理中にエラーが発生しました。外側エラー: ${outerError.message} もう一度試してみてください。`
    }]);
  }
}

async function handleFollow(replyToken: string, source: any) {
  const welcomeMessage = {
    type: 'template',
    altText: 'LINE健康管理へようこそ！',
    template: {
      type: 'buttons',
      text: 'こんにちは！ヘルシーくんです！\n\n健康管理をお手伝いするために、あなたについていくつか教えてもらえる？',
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
  
  console.log('📤 Postback受信:', { userId, data, timestamp: new Date().toISOString() });
  
  const params = new URLSearchParams(data);
  const action = params.get('action');
  
  console.log('🎯 Postbackアクション:', { userId, action });

  switch (action) {
    // 古い6つボタン関連処理削除済み
    case 'meal_breakfast':
    case 'meal_lunch':
    case 'meal_dinner':
    case 'meal_snack':
      const mealType = action.replace('meal_', '');
      await saveMealRecord(userId, mealType, replyToken);
      break;
    case 'no_record':
      await handleNoRecordSelection(userId, replyToken);
      break;
    case 'calorie_analysis':
      await handleCalorieAnalysis(userId, replyToken);
      break;
    // 記録ボタン削除済み - 統一モードに移行
    case 'daily_feedback':
      // 利用制限チェック（フィードバック機能）
      try {
        const feedbackLimit = await checkUsageLimit(userId, 'record'); // フィードバックは記録制限と同様
        if (!feedbackLimit.allowed) {
          // 利用制限に達した場合
          console.log('🚫 フィードバック制限:', userId);
          await replyMessage(replyToken, [await createUsageLimitFlex('feedback', userId)]);
          return;
        }
      } catch (limitError) {
        console.error('❌ フィードバック制限チェックエラー:', limitError);
        // エラーの場合は制限なしで続行
      }

      // フィードバック生成中かチェック
      const isFeedbackProcessing = isProcessing(userId);
      if (isFeedbackProcessing) {
        console.log('⚠️ フィードバック生成中: ボタン押下を無視');
        return;
      }
      
      // 重複実行防止フラグを設定
      setProcessing(userId, true);
      
      try {
        await handleDailyFeedback(replyToken, userId);
      } finally {
        setProcessing(userId, false);
      }
      break;
    case 'my_page':
      // マイページボタン → LIFFアプリのダッシュボード
      await replyMessage(replyToken, [{
        type: 'template',
        altText: 'マイページを開きます',
        template: {
          type: 'buttons',
          title: '📊 マイページ',
          text: 'あなたの健康データを確認できます',
          actions: [{
            type: 'uri',
            label: 'マイページを開く',
            uri: process.env.NEXT_PUBLIC_LIFF_ID ? `https://liff.line.me/${process.env.NEXT_PUBLIC_LIFF_ID}/dashboard` : `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`
          }]
        }
      }]);
      break;
    case 'usage_guide':
      // 使い方ボタン → 使い方ガイド
      await replyMessage(replyToken, [{
        type: 'template',
        altText: '使い方ガイドを開きます',
        template: {
          type: 'buttons',
          title: '📖 使い方ガイド',
          text: 'ヘルシーくんの使い方を確認できます',
          actions: [{
            type: 'uri',
            label: '使い方を見る',
            uri: process.env.NEXT_PUBLIC_LIFF_ID ? `https://liff.line.me/${process.env.NEXT_PUBLIC_LIFF_ID}/guide` : `${process.env.NEXT_PUBLIC_APP_URL}/guide`
          }]
        }
      }]);
      break;
    case 'open_keyboard':
      // キーボードを開くための空のメッセージ（自動でキーボードが開く）
      break;
    case 'cancel_record':
      console.log('📝 記録しないボタン押下:', { userId, timestamp: new Date().toISOString() });
      try {
        await replyMessage(replyToken, [{
          type: 'text',
          text: 'また記録してね！'
        }]);
        console.log('✅ 記録しないボタン処理完了:', userId);
      } catch (error) {
        console.error('❌ 記録しないボタン処理エラー:', error);
        // フォールバック: シンプルなメッセージ
        await replyMessage(replyToken, [{
          type: 'text',
          text: 'また記録してね！'
        }]);
      }
      break;
    case 'confirm_record':
      const confirm = params.get('confirm');
      if (confirm === 'no') {
        const tempData = await getTempMealAnalysis(userId);
        await deleteTempMealAnalysis(userId);
        
        const aiService = new AIHealthService();
        const characterSettings = null;
        const generalResponse = await aiService.generateGeneralResponse(tempData?.originalText || 'こんにちは', userId, characterSettings);
        
        // 会話履歴を保存
        if (generalResponse) {
          await aiService.saveConversation(userId, tempData?.originalText || 'こんにちは', generalResponse);
        }
        
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

async function handleDailyFeedback(replyToken: string, userId: string) {
  try {
    console.log('📊 1日フィードバック開始:', userId);
    
    // ローディングアニメーション開始
    await startLoadingAnimation(userId);
    
    // 今日の日付を取得
    const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' });
    
    // 1日フィードバックAPIを呼び出し
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'https://kotakun-ai-health.vercel.app'}/api/daily-feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: userId,
        date: today
      }),
    });
    
    await stopLoadingAnimation(userId);
    
    if (response.ok) {
      const result = await response.json();
      
      // Flexメッセージでフィードバックを送信
      if (result.flexMessage) {
        await replyMessage(replyToken, [result.flexMessage]);
        console.log('✅ 1日フィードバック（Flexメッセージ）送信完了:', userId);
      } else {
        // フォールバック: テキストメッセージ
        await replyMessage(replyToken, [{
          type: 'text',
          text: result.feedback
        }]);
        console.log('✅ 1日フィードバック（テキスト）送信完了:', userId);
      }
      
      // フィードバック送信完了
      console.log('✅ フィードバック送信完了:', userId);
    } else if (response.status === 403) {
      // 利用制限エラーの場合
      console.log('🚫 フィードバック制限:', userId);
      await replyMessage(replyToken, [await createUsageLimitFlex('feedback', userId)]);
      console.log('🚫 フィードバック利用制限:', userId);
    } else {
      throw new Error(`API呼び出し失敗: ${response.status}`);
    }
    
  } catch (error) {
    console.error('❌ 1日フィードバックエラー:', error);
    
    await stopLoadingAnimation(userId);
    
    // エラー時のフォールバックメッセージ
    await replyMessage(replyToken, [{
      type: 'text',
      text: '申し訳ございません。1日のフィードバック生成でエラーが発生しました。\n\nしばらく時間をおいてからもう一度お試しください。🙏'
    }]);
  }
}

// 体重記録処理
async function handleWeightRecord(userId: string, weightData: any, replyToken: string) {
  try {
    console.log('📊 体重記録開始:', { userId, weight: weightData.weight });
    
    // 内部APIを使用（動作確認済みの方法）
    const now = new Date();
    const today = now.toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' });
    console.log('📅 日付計算:', { 
      UTC: now.toISOString(), 
      JST_full: now.toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }),
      JST_date: today 
    });
    
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'https://kotakun-ai-health.vercel.app'}/api/weight`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        lineUserId: userId,
        date: today,
        weight: weightData.weight,
        note: `LINE記録 ${new Date().toLocaleTimeString('ja-JP', { timeZone: 'Asia/Tokyo' })}`
      }),
    });
    
    await stopLoadingAnimation(userId);
    
    if (response.ok) {
      // キャッシュ更新（アプリからの記録と同様に）
      const cacheKey = createCacheKey('weight', userId, 'month');
      const cachedData = apiCache.get(cacheKey);
      if (cachedData && Array.isArray(cachedData)) {
        const newEntry = { date: today, weight: weightData.weight };
        const filteredData = cachedData.filter(item => item.date !== today);
        const updatedData = [...filteredData, newEntry].sort((a, b) => 
          new Date(a.date).getTime() - new Date(b.date).getTime()
        );
        apiCache.set(cacheKey, updatedData, 5 * 60 * 1000);
        console.log('⚡ LINE記録後：キャッシュも即座に更新');
      }
      
      const weightFlexMessage = createWeightFlexMessage(
        weightData.weight,
        undefined
      );
      
      await replyMessage(replyToken, [{
        ...weightFlexMessage
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
        },
        {
          type: 'action',
          action: {
            type: 'postback',
            label: 'カロリー',
            data: 'action=calorie_analysis'
          }
        }
      ]
    }
  };
  
  await replyMessage(replyToken, [responseMessage]);
}

// 記録しない選択時の処理（統一モード用）
async function handleNoRecordSelection(userId: string, replyToken: string) {
  try {
    console.log('🔄 記録しない選択: 画像について会話します', { userId });
    
    // AI制限チェック
    const aiLimit = await checkUsageLimit(userId, 'ai');
    if (!aiLimit.allowed) {
      console.log('🔄 AI制限に達しました:', userId);
      await replyMessage(replyToken, [await createUsageLimitFlex('ai', userId)]);
      return;
    }
    
    // 保存済みの画像解析結果を取得
    const tempAnalysis = await getTempMealAnalysis(userId);
    
    // 食事として記録しないため、キャッシュをクリア
    await clearTempMealAnalysis(userId);
    clearImageCache(userId);
    
    // 画像について会話
    const aiService = new AIHealthService();
    let aiResponse;
    
    if (tempAnalysis?.analysis?.description) {
      // 画像解析結果がある場合
      const imageDescription = tempAnalysis.analysis.description;
      const prompt = `画像を送ってもらいました。画像の内容：「${imageDescription}」。食事記録ではなく、この画像について自然に会話してください。`;
      aiResponse = await aiService.generateGeneralResponse(prompt, userId, null);
    } else {
      // 画像解析結果がない場合はシンプルに応答
      aiResponse = 'おいしそうな写真ですね！他に何かお話ししましょうか？';
    }
    
    // 会話履歴を保存
    if (aiResponse) {
      await aiService.saveConversation(userId, '画像について会話', aiResponse);
    }
    
    // AI応答成功時に使用回数を記録
    await recordUsage(userId, 'ai');
    
    await replyMessage(replyToken, [{
      type: 'text',
      text: aiResponse
    }]);
    
    console.log('✅ 記録しない選択処理完了');
  } catch (error) {
    console.error('❌ 記録しない選択処理エラー:', error);
    // シンプルなフォールバック
    await replyMessage(replyToken, [{
      type: 'text',
      text: 'おいしそうな写真ですね！他に何かお話ししましょうか？'
    }]);
  }
}

// 食事記録を保存
async function saveMealRecord(userId: string, mealType: string, replyToken: string) {
  try {
    console.log('🔥 食事保存開始:', { userId, mealType });
    
    // クイックリプライを即座に消すため
    
    // クイックリプライ押下後すぐにローディング開始
    await startLoadingAnimation(userId, 15);
    
    // 一時保存されたAI分析結果を取得
    const tempData = await getTempMealAnalysis(userId);
    if (!tempData) {
      await stopLoadingAnimation(userId);
      await pushMessage(userId, [{
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
        
        const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET 
          || `${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.appspot.com`
          || 'kotakun-19990629-gmailcoms-projects.appspot.com'; // フォールバック
        
        const bucket = admin.storage().bucket(bucketName);
        
        const imageId = `meal_${generateId()}`;
        const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' });
        const fileName = `meals/${userId}/${today}/${imageId}.jpg`;
        
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
    
    // 元のユーザー入力テキストを取得
    const originalText = tempData.originalText || tempData.analysis.displayName || tempData.analysis.foodItems?.[0] || tempData.analysis.meals?.[0]?.name || '食事';
    
    // 🧠 AIアドバイス生成
    console.log('🧠 パーソナル食事アドバイス生成開始');
    const aiService = new AIHealthService();
    const characterSettings = null;
    
    // ユーザープロフィール取得（アドバイスの個別化のため）
    let userProfile = null;
    try {
      const db = admin.firestore();
      const profileSnapshot = await db
        .collection('users')
        .doc(userId)
        .collection('profileHistory')
        .orderBy('changeDate', 'desc')
        .limit(1)
        .get();
      
      if (!profileSnapshot.empty) {
        userProfile = profileSnapshot.docs[0].data();
        console.log('📊 ユーザープロフィール取得成功');
      }
    } catch (profileError) {
      console.log('⚠️ ユーザープロフィール取得失敗（アドバイス生成は継続）:', profileError);
    }
    
    // 今日の栄養進捗取得（アドバイスの精度向上のため）
    let dailyProgress = null;
    try {
      const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' });
      const recordRef = admin.firestore().collection('users').doc(userId).collection('dailyRecords').doc(today);
      const recordDoc = await recordRef.get();
      
      if (recordDoc.exists) {
        const dayData = recordDoc.data();
        
        // 今日の合計栄養計算（この食事含む）
        const meals = dayData.meals || [];
        const totalCalories = meals.reduce((sum, meal) => sum + (meal.calories || 0), 0);
        const totalProtein = meals.reduce((sum, meal) => sum + (meal.protein || 0), 0);
        const totalFat = meals.reduce((sum, meal) => sum + (meal.fat || 0), 0);
        const totalCarbs = meals.reduce((sum, meal) => sum + (meal.carbs || 0), 0);
        
        // 目標値計算（プロフィールベース）
        const targetCalories = userProfile ? calculateCalorieTarget(userProfile) : 2000;
        const targetProtein = userProfile ? calculateMacroTargets(userProfile, targetCalories).protein : 120;
        const targetFat = userProfile ? calculateMacroTargets(userProfile, targetCalories).fat : 67;
        const targetCarbs = userProfile ? calculateMacroTargets(userProfile, targetCalories).carbs : 250;
        
        dailyProgress = {
          totalCalories: totalCalories + (tempData.analysis.calories || tempData.analysis.totalCalories || 0),
          totalProtein: totalProtein + (tempData.analysis.protein || tempData.analysis.totalProtein || 0),
          totalFat: totalFat + (tempData.analysis.fat || tempData.analysis.totalFat || 0),
          totalCarbs: totalCarbs + (tempData.analysis.carbs || tempData.analysis.totalCarbs || 0),
          targetCalories,
          targetProtein,
          targetFat,
          targetCarbs,
          mealCount: meals.length + 1
        };
        
        console.log('📈 今日の栄養進捗計算成功');
      }
    } catch (progressError) {
      console.log('⚠️ 今日の栄養進捗取得失敗（アドバイス生成は継続）:', progressError);
    }
    
    // パーソナルアドバイス生成
    let aiAdvice = null;
    try {
      aiAdvice = await aiService.generateMealAdvice(
        tempData.analysis,
        mealType,
        userId,
        userProfile,
        dailyProgress,
        characterSettings
      );
      console.log('✅ パーソナル食事アドバイス生成完了:', aiAdvice);
    } catch (adviceError) {
      console.error('❌ パーソナル食事アドバイス生成エラー:', adviceError);
      // エラーでもFlexメッセージは送信
      aiAdvice = null;
    }
    
    const flexMessage = createMealFlexMessage(mealTypeJa, tempData.analysis, imageUrl, originalText, aiAdvice);
    
    // 直接保存（画像URLを使用）
    await saveMealDirectly(userId, mealType, tempData.analysis, imageUrl);
    
    // pushMessageでFlexメッセージ送信（統一モード：クイックリプライなし）
    await pushMessage(userId, [flexMessage]);
    
    // 記録完了
    
    // ローディング停止
    await stopLoadingAnimation(userId);
    
    console.log('🔥 食事保存完了');
    
  } catch (error) {
    console.error('🔥 食事保存エラー:', error);
    await stopLoadingAnimation(userId);
    await pushMessage(userId, [{
      type: 'text',
      text: '保存中にエラーが発生しました。もう一度お試しください。'
    }]);
  }
}

// シンプルな直接保存関数
async function saveMealDirectly(userId: string, mealType: string, mealAnalysis: any, imageUrl?: string) {
  try {
    console.log('🔥 直接保存開始:', { userId, mealType, hasImage: !!imageUrl });
    
    const now = new Date();
    const today = now.toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' });
    console.log('📅 食事記録日付計算:', { 
      UTC: now.toISOString(), 
      JST_full: now.toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }),
      JST_date: today 
    });
    const currentTime = new Date().toLocaleTimeString('ja-JP', { 
      hour: '2-digit', 
      minute: '2-digit',
      timeZone: 'Asia/Tokyo'
    });
    
    // Firestoreに直接保存（アプリが期待する形式）
    const db = admin.firestore();
    const recordRef = db.collection('users').doc(userId).collection('dailyRecords').doc(today);
    const recordDoc = await recordRef.get();
    const existingData = recordDoc.exists ? recordDoc.data() : {};
    const existingMeals = existingData.meals || [];
    
    let mealsToAdd = [];
    
    // 複数食事の場合はテキスト記録と同じ形式で処理
    if (mealAnalysis.isMultipleMeals && mealAnalysis.meals && mealAnalysis.meals.length > 0) {
      console.log('🔥 複数食事として保存:', mealAnalysis.meals.length, '個');
      
      // 各食事を個別のオブジェクトとして作成（テキスト記録と同じ形式）
      mealsToAdd = mealAnalysis.meals.map((meal: any) => ({
        id: generateId(),
        name: meal.displayName || meal.name,
        type: mealType,
        time: currentTime,
        calories: meal.calories || 0,
        protein: meal.protein || 0,
        fat: meal.fat || 0,
        carbs: meal.carbs || 0,
        image: imageUrl,
        images: imageUrl ? [imageUrl] : [],
        foodItems: [meal.displayName || meal.name],
        timestamp: new Date(),
        createdAt: new Date(),
        lineUserId: userId,
        displayName: meal.displayName || meal.name,
        baseFood: meal.baseFood || '',
        portion: meal.portion || ''
      }));
    } else {
      // 単一食事の場合
      console.log('🔥 単一食事として保存');
      
      const mealData = {
        id: generateId(),
        name: mealAnalysis.displayName || mealAnalysis.foodItems?.[0] || mealAnalysis.meals?.[0]?.name || '食事',
        type: mealType,
        calories: mealAnalysis.calories || mealAnalysis.totalCalories || 400,
        protein: mealAnalysis.protein || mealAnalysis.totalProtein || 20,
        fat: mealAnalysis.fat || mealAnalysis.totalFat || 15,
        carbs: mealAnalysis.carbs || mealAnalysis.totalCarbs || 50,
        time: currentTime,
        image: imageUrl,
        images: imageUrl ? [imageUrl] : [],
        foodItems: mealAnalysis.foodItems || [mealAnalysis.displayName || mealAnalysis.foodItems?.[0] || mealAnalysis.meals?.[0]?.name || '食事'],
        timestamp: new Date(),
        createdAt: new Date(),
        lineUserId: userId,
        displayName: mealAnalysis.displayName || '',
        baseFood: mealAnalysis.baseFood || '',
        portion: mealAnalysis.portion || ''
      };
      
      mealsToAdd = [mealData];
    }
    
    // 新しい食事を追加
    const updatedMeals = [...existingMeals, ...mealsToAdd];
    
    await recordRef.set({
      ...existingData,
      meals: updatedMeals,
      date: today,
      lineUserId: userId,
      updatedAt: new Date()
    }, { merge: true });
    
    console.log('🔥 直接保存完了:', { mealsCount: mealsToAdd.length, mealType });
    
  } catch (error) {
    console.error('🔥 直接保存エラー:', error);
    throw error;
  }
}

// 簡単な一時保存関数
async function storeTempMealAnalysis(userId: string, mealAnalysis: any, imageContent?: Buffer, originalText?: string, imageCacheKey?: string) {
  try {
    // AIアドバイスを除去してクリーンなデータのみ保存
    const cleanAnalysis = {
      calories: mealAnalysis.calories || mealAnalysis.totalCalories || 0,
      protein: mealAnalysis.protein || mealAnalysis.totalProtein || 0,
      fat: mealAnalysis.fat || mealAnalysis.totalFat || 0,
      carbs: mealAnalysis.carbs || mealAnalysis.totalCarbs || 0,
      foodItems: mealAnalysis.foodItems || [],
      meals: (mealAnalysis.meals || []).map(meal => ({
        ...meal,
        name: meal.displayName || meal.name // displayNameを優先
      })),
      isMultipleMeals: mealAnalysis.isMultipleMeals || false,
      // 分量情報を追加
      displayName: mealAnalysis.displayName || '',
      baseFood: mealAnalysis.baseFood || '',
      portion: mealAnalysis.portion || ''
    };
    
    const db = admin.firestore();
    await db.collection('users').doc(userId).collection('tempMealData').doc('current').set({
      analysis: cleanAnalysis,
      imageCacheKey: imageCacheKey || null, // 画像キャッシュキーのみ保存
      originalText: originalText || '', // 元のテキストを保存
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
        imageContent: data.imageCacheKey ? getCachedImage(data.imageCacheKey) : null,
        originalText: data.originalText || ''
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
// TODO: この関数は別ファイルに移動する必要があります
/* export */ async function cleanupAllTempMealData() {
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
    const originalBuffer = Buffer.from(arrayBuffer);
    
    // 画像圧縮でコスト削減（95%削減効果）
    try {
      const sharp = (await import('sharp')).default;
      const compressedBuffer = await sharp(originalBuffer)
        .resize(512, 512, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 75, progressive: true })
        .toBuffer();
      
      console.log(`🗜️ 画像圧縮: ${originalBuffer.length} bytes → ${compressedBuffer.length} bytes (${(100 - (compressedBuffer.length / originalBuffer.length) * 100).toFixed(1)}% 削減)`);
      
      return compressedBuffer;
    } catch (compressionError) {
      console.error('画像圧縮エラー（元画像を使用）:', compressionError);
      return originalBuffer;
    }
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
