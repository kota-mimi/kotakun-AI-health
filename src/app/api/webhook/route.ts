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
import { createMealFlexMessage, createMultipleMealTimesFlexMessage, createWeightFlexMessage, createExerciseFlexMessage, createCalorieOnlyFlexMessage } from './new_flex_message';
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
    const events = data.events || [];

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
      
      // 開発者のイベントのみを処理対象として残す
      events = events.filter(event => {
        const userId = event.source?.userId;
        return userId && DEVELOPER_IDS.includes(userId);
      });
      
      // 開発者イベントが無い場合はここで終了
      if (events.length === 0) {
        return NextResponse.json({ status: 'maintenance_mode' });
      }
      
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
    
    // 利用制限チェック
    if (isRecordIntent) {
      // 記録意図の場合は記録制限をチェック
      const recordLimit = await checkUsageLimit(userId, 'record');
      if (!recordLimit.allowed) {
        console.log('⚠️ 記録制限達成', { userId, reason: recordLimit.reason });
        await stopLoadingAnimation(userId);
        await replyMessage(replyToken, [createUsageLimitFlex('record', userId)]);
        return;
      }
    } else {
      // 通常会話の場合はAI会話制限をチェック
      const aiLimit = await checkUsageLimit(userId, 'ai');
      if (!aiLimit.allowed) {
        console.log('⚠️ AI会話制限達成', { userId, reason: aiLimit.reason });
        await stopLoadingAnimation(userId);
        await replyMessage(replyToken, [createUsageLimitFlex('ai', userId)]);
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
          
          // 運動文脈チェック（運動記録を除外）- ただし体重文脈は除外対象外
          const exerciseKeywords = /(ベンチ|プレス|スクワット|デッド|リフト|腕立て|腹筋|背筋|ランニング|ジョギング|ウォーキング|走|歩|泳|筋トレ|ジム|トレーニング|セット|回|やった|した|行った|練習|カール|プル|プッシュ)/i;
          const hasExerciseContext = exerciseKeywords.test(text);
          
          if (hasExerciseContext) {
            console.log('❌ 体重判定 - 運動文脈として除外:', text);
            return { isWeightRecord: false, reason: '運動文脈' };
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
        await handleWeightRecord(userId, weightJudgment, replyToken);
        // 記録成功時に使用回数を記録
        await recordUsage(userId, 'record');
        return;
      }
      
      // 運動記録の判定
      console.log('🏃‍♂️ 統一モード - AI運動記録判定開始:', { 
        userId,
        text, 
        timestamp: new Date().toISOString() 
      });
      try {
        const exerciseJudgment = await aiService.analyzeExerciseRecordIntent(text);
        console.log('🏃‍♂️ 統一モード - AI運動判定結果:', JSON.stringify(exerciseJudgment, null, 2));
        if (exerciseJudgment.isExerciseRecord) {
          console.log('✅ 統一モード - 運動として認識、記録開始');
          if (exerciseJudgment.isMultipleExercises) {
            console.log('🔄 統一モード - 複数運動記録処理');
            await handleRecordModeMultipleExercise(userId, exerciseJudgment, replyToken, text);
          } else {
            console.log('🔄 統一モード - 単一運動記録処理');
            await handleRecordModeSingleExercise(userId, exerciseJudgment, replyToken, text);
          }
          // 記録成功時に使用回数を記録
          await recordUsage(userId, 'record');
          return;
        } else {
          console.log('❌ 統一モード - 運動記録として認識されませんでした');
        }
      } catch (error) {
        console.error('❌ 統一モード - AI運動記録判定エラー:', error);
      }
      
      // 食事記録の判定
      console.log('🍽️ 統一モード - 食事記録判定開始:', text);
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
          await replyMessage(replyToken, [createUsageLimitFlex('record', userId)]);
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
        await replyMessage(replyToken, [createUsageLimitFlex('ai', userId)]);
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
      console.error('🔥 統一モード画像処理エラー:', error);
      await stopLoadingAnimation(userId);
      await replyMessage(replyToken, [{
        type: 'text',
        text: 'すみません、画像の処理中にエラーが発生しました。もう一度試してみてください。'
      }]);
    } finally {
      // 処理完了フラグをクリア
      setProcessing(userId, false);
    }
  } catch (outerError) {
    // 外側のtryブロックでのエラー（処理フラグ設定前のエラー）
    console.error('🔥 統一モード画像処理外側エラー:', outerError);
    await replyMessage(replyToken, [{
      type: 'text',
      text: 'すみません、画像の処理中にエラーが発生しました。もう一度試してみてください。'
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
          await replyMessage(replyToken, [createUsageLimitFlex('feedback', userId)]);
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
    case 'exercise_running_30':
    case 'exercise_strength_45':
    case 'exercise_walking_20':
      // 古い運動記録クイックリプライは無効化（新しいAI分析システムを使用）
      await replyMessage(replyToken, [{
        type: 'text',
        text: '運動記録は自然な言葉で記録できます！\n\n「ランニング30分した」「筋トレした」などと送ってください。'
      }]);
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
      await replyMessage(replyToken, [createUsageLimitFlex('ai', userId)]);
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

// AI運動記録処理（記録モード中の自由記録）
// 複数運動記録を処理
async function handleMultipleAIExerciseRecord(userId: string, exerciseData: any, replyToken: string) {
  try {
    console.log('🏃‍♂️ 複数AI運動記録開始:', { userId, exerciseData });
    
    const { exercises } = exerciseData;
    const userWeight = await getUserWeight(userId) || 70;
    const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' });
    
    // Firestoreから既存記録を取得
    const db = admin.firestore();
    const recordRef = db.collection('users').doc(userId).collection('dailyRecords').doc(today);
    const recordDoc = await recordRef.get();
    const existingData = recordDoc.exists ? recordDoc.data() : {};
    const existingExercises = existingData.exercises || [];
    
    const addedExercises = [];
    let totalCalories = 0;
    
    // 各運動を処理
    for (const exercise of exercises) {
      const { exerciseName, exerciseType, duration, intensity, sets, reps, weight, distance, timeOfDay, displayName, weightSets } = exercise;
      
      // カロリー計算
      const mets = EXERCISE_METS[exerciseName] || getDefaultMETs(exerciseType);
      // セット数・重量・回数を考慮した推定時間計算
      const calculationDuration = duration || calculateEstimatedDuration(
        exerciseType, 
        sets || 0, 
        reps || 0, 
        weight || 0
      );
      const caloriesBurned = Math.round((mets * (calculationDuration / 60) * userWeight * 1.05));
      totalCalories += caloriesBurned;
      
      // 同じ種目の既存記録をチェック
      const existingExerciseIndex = existingExercises.findIndex((ex: any) => 
        ex.name === exerciseName || ex.displayName === exerciseName
      );
      
      if (existingExerciseIndex !== -1) {
        // 既存の種目に新しいセットとして追加
        const existingExercise = existingExercises[existingExerciseIndex];
        const newSet = {
          weight: weight || 0,
          reps: reps || 0,
          sets: sets || 1
        };
        
        // weightSetsに追加
        const updatedWeightSets = [...(existingExercise.weightSets || []), newSet];
        
        // セット数とカロリーを更新
        const updatedSetsCount = (existingExercise.setsCount || 0) + (sets || 1);
        const updatedCalories = existingExercise.calories + caloriesBurned;
        
        existingExercises[existingExerciseIndex] = {
          ...existingExercise,
          weightSets: updatedWeightSets,
          setsCount: updatedSetsCount,
          calories: updatedCalories,
          updatedAt: new Date()
        };
        
        console.log('✅ 複数運動処理：既存の種目にセットを追加:', { 
          exerciseName, 
          newSet, 
          totalSets: updatedSetsCount,
          totalCalories: updatedCalories,
          updatedWeightSets: updatedWeightSets
        });
        
        // addedExercisesには更新された運動を追加（Flex表示用）
        addedExercises.push(existingExercises[existingExerciseIndex]);
      } else {
        // 新しい種目として追加
        const exerciseRecord = {
          id: generateId(),
          name: exerciseName,
          displayName: displayName || exerciseName,
          type: exerciseType,
          duration: duration || 0,
          calories: caloriesBurned,
          intensity: intensity || getIntensity(mets),
          sets: weightSets && weightSets.length > 0 ? weightSets : (sets && sets > 0 ? sets : null),
          reps: reps || 0,
          weight: weight || 0,
          distance: distance || 0,
          timeOfDay: timeOfDay || '',
          weightSets: weightSets || [],
          setsCount: sets || (weightSets && weightSets.length > 0 ? weightSets.reduce((sum, ws) => sum + (ws.sets || 1), 0) : null),
          notes: `LINE記録 ${new Date().toLocaleTimeString('ja-JP', { timeZone: 'Asia/Tokyo' })} - AI認識（複数運動）`,
          timestamp: new Date(),
          time: new Date().toLocaleTimeString('ja-JP', { 
            hour: '2-digit', 
            minute: '2-digit',
            timeZone: 'Asia/Tokyo'
          })
        };
        
        existingExercises.push(exerciseRecord);
        addedExercises.push(exerciseRecord);
        
        console.log('✅ 複数運動処理：新しい種目として追加:', exerciseName);
      }
    }
    
    // Firestoreに保存
    const updatedExercises = existingExercises;
    await recordRef.set({
      ...existingData,
      exercises: updatedExercises,
      date: today,
      lineUserId: userId,
      updatedAt: new Date()
    }, { merge: true });
    
    // キャッシュを削除してアプリ側の表示を更新（複数のキーパターンで確実に削除）
    const cacheKeys = [
      createCacheKey('exercises', userId, today),
      `exercises_${userId}_${today}`,
      `exercises-${userId}-${today}`
    ];
    cacheKeys.forEach(key => {
      apiCache.delete(key);
      console.log('🗑️ 複数運動記録キャッシュを削除:', key);
    });
    
    // 全キャッシュをクリア（確実にするため）
    try {
      apiCache.clear();
      console.log('🗑️ 複数運動記録：全キャッシュをクリア');
    } catch (error) {
      console.log('⚠️ 複数運動記録：キャッシュクリア中にエラー:', error);
    }
    
    // 各運動を個別のFlexメッセージで送信
    const messages = [];
    
    for (let i = 0; i < addedExercises.length; i++) {
      const exercise = addedExercises[i];
      const singleExerciseData = {
        isMultipleExercises: false,
        exercise: exercise
      };
      
      const flexMessage = createExerciseFlexMessage(singleExerciseData);
      
      // 通常モードではクイックリプライなしでFlexメッセージのみ表示
      messages.push(flexMessage);
    }
    
    await replyMessage(replyToken, messages);
    
    console.log('✅ 複数AI運動記録完了:', addedExercises);
    
  } catch (error) {
    console.error('❌ 複数AI運動記録エラー:', error);
    await replyMessage(replyToken, [{
      type: 'text',
      text: '複数運動記録でエラーが発生しました。もう一度お試しください。',
    }]);
  }
}

async function handleAIExerciseRecord(userId: string, exerciseData: any, replyToken: string) {
  try {
    console.log('🏃‍♂️ AI運動記録開始:', { 
      userId, 
      exerciseData: {
        exerciseName: exerciseData.exerciseName,
        reps: exerciseData.reps,
        weight: exerciseData.weight,
        sets: exerciseData.sets,
        weightSets: exerciseData.weightSets
      }
    });
    
    const { exerciseName, exerciseType, duration, intensity } = exerciseData;
    
    // カロリー計算（時間がない場合は推定時間でカロリー計算）
    const userWeight = await getUserWeight(userId) || 70;
    const mets = EXERCISE_METS[exerciseName] || getDefaultMETs(exerciseType);
    // セット数・重量・回数を考慮した推定時間計算
    const calculationDuration = duration || calculateEstimatedDuration(
      exerciseType, 
      exerciseData.sets || 0, 
      exerciseData.reps || 0, 
      exerciseData.weight || 0
    );
    const caloriesBurned = Math.round((mets * (calculationDuration / 60) * userWeight * 1.05));
    
    // 運動データ作成
    const exerciseRecord = {
      id: generateId(),
      name: exerciseName,
      displayName: exerciseData.displayName || exerciseName,
      type: exerciseType,
      duration: duration || 0, // 時間が指定されていない場合は0
      calories: caloriesBurned,
      intensity: intensity || getIntensity(mets),
      reps: exerciseData.reps || 0,
      weight: exerciseData.weight || 0,
      sets: exerciseData.sets || null,
      setsCount: exerciseData.sets || null,
      weightSets: exerciseData.weightSets || [],
      notes: `LINE記録 ${new Date().toLocaleTimeString('ja-JP', { timeZone: 'Asia/Tokyo' })} - AI認識`,
      timestamp: new Date(),
      time: new Date().toLocaleTimeString('ja-JP', { 
        hour: '2-digit', 
        minute: '2-digit',
        timeZone: 'Asia/Tokyo'
      })
    };
    
    // Firestoreに保存
    const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' });
    const db = admin.firestore();
    const recordRef = db.collection('users').doc(userId).collection('dailyRecords').doc(today);
    const recordDoc = await recordRef.get();
    const existingData = recordDoc.exists ? recordDoc.data() : {};
    const existingExercises = existingData.exercises || [];
    
    // 同じ種目の既存記録をチェック
    const existingExerciseIndex = existingExercises.findIndex((ex: any) => 
      ex.name === exerciseName || ex.displayName === exerciseName
    );
    
    let updatedExercises;
    if (existingExerciseIndex !== -1) {
      // 既存の種目に新しいセットとして追加
      const existingExercise = existingExercises[existingExerciseIndex];
      const newSet = {
        weight: exerciseData.weight || 0,
        reps: exerciseData.reps || 0,
        sets: exerciseData.sets || 1
      };
      
      // weightSetsに追加
      const updatedWeightSets = [...(existingExercise.weightSets || []), newSet];
      
      // セット数とカロリーを更新
      const updatedSetsCount = (existingExercise.setsCount || 0) + (exerciseData.sets || 1);
      const updatedCalories = existingExercise.calories + caloriesBurned;
      
      existingExercises[existingExerciseIndex] = {
        ...existingExercise,
        weightSets: updatedWeightSets,
        setsCount: updatedSetsCount,
        calories: updatedCalories,
        updatedAt: new Date()
      };
      
      updatedExercises = existingExercises;
      console.log('✅ 既存の種目にセットを追加:', { 
        exerciseName, 
        newSet, 
        totalSets: updatedSetsCount,
        totalCalories: updatedCalories,
        updatedWeightSets: updatedWeightSets
      });
    } else {
      // 新しい種目として追加
      updatedExercises = [...existingExercises, exerciseRecord];
      console.log('✅ 新しい種目として追加:', exerciseName);
    }
    
    await recordRef.set({
      ...existingData,
      exercises: updatedExercises,
      date: today,
      lineUserId: userId,
      updatedAt: new Date()
    }, { merge: true });
    
    // キャッシュを削除してアプリ側の表示を更新（複数のキーパターンで確実に削除）
    const cacheKeys = [
      createCacheKey('exercises', userId, today),
      `exercises_${userId}_${today}`,
      `exercises-${userId}-${today}`
    ];
    cacheKeys.forEach(key => {
      apiCache.delete(key);
      console.log('🗑️ 運動記録キャッシュを削除:', key);
    });
    
    // 全キャッシュをクリア（確実にするため）
    try {
      apiCache.clear();
      console.log('🗑️ 全キャッシュをクリア');
    } catch (error) {
      console.log('⚠️ キャッシュクリア中にエラー:', error);
    }
    
    // AI応答で記録完了メッセージを生成（キャラクター口調で）
    const timeText = duration && duration > 0 ? `${duration}分` : '時間なし';
    const displayCalories = existingExerciseIndex !== -1 ? 
      existingExercises[existingExerciseIndex].calories : caloriesBurned;
    const actionText = existingExerciseIndex !== -1 ? 'セットを追加' : 'を記録';
    
    const recordInfo = `${exerciseName}${actionText}しました。時間: ${timeText}、推定消費カロリー: ${displayCalories}kcal`;
    const aiService = new AIHealthService();
    const characterSettings = null;
    const aiResponse = await aiService.generateGeneralResponse(recordInfo, userId, characterSettings);
    
    // 統一モード：記録後はクイックリプライなし
    await replyMessage(replyToken, [{
      type: 'text',
      text: aiResponse || '記録完了！お疲れ様！'
    }]);
    
    console.log('✅ AI運動記録完了:', {
      name: exerciseRecord.name,
      reps: exerciseRecord.reps,
      weight: exerciseRecord.weight,
      setsCount: exerciseRecord.setsCount,
      weightSets: exerciseRecord.weightSets
    });
    
  } catch (error) {
    console.error('❌ AI運動記録エラー:', error);
    await replyMessage(replyToken, [{
      type: 'text',
      text: '運動記録でエラーが発生しました。もう一度お試しください。'
    }]);
  }
}

// デフォルト時間を取得
function getDefaultDuration(exerciseType: string, exerciseName: string): number {
  const durationMap: { [key: string]: number } = {
    'cardio': 30,        // 有酸素運動: 30分
    'strength': 45,      // 筋力トレーニング: 45分
    'sports': 60,        // スポーツ: 60分
    'flexibility': 20,   // ストレッチ・ヨガ: 20分
    'daily_activity': 30 // 日常活動: 30分
  };
  
  return durationMap[exerciseType] || 30;
}

// セット数・重量・回数を考慮した時間計算（筋トレ専用）
function calculateEstimatedDuration(exerciseType: string, sets: number = 0, reps: number = 0, weight: number = 0): number {
  if (exerciseType !== 'strength') {
    return 30; // 筋トレ以外はデフォルト30分
  }
  
  // セット数がある場合の推定時間計算
  if (sets > 0) {
    // 1セット当たりの時間: 重量とレップ数による推定
    let timePerSet = 2; // 基本2分/セット
    
    // 重量による調整（高重量ほど休憩時間が長い）
    if (weight > 80) timePerSet += 1.5; // 重量級: +1.5分
    else if (weight > 60) timePerSet += 1; // 中重量: +1分
    else if (weight > 40) timePerSet += 0.5; // 軽重量: +0.5分
    
    // レップ数による調整（高レップほど疲労が大きい）
    if (reps > 15) timePerSet += 0.5; // 高レップ: +0.5分
    else if (reps > 10) timePerSet += 0.3; // 中レップ: +0.3分
    
    const totalTime = Math.round(sets * timePerSet);
    return Math.max(5, Math.min(60, totalTime)); // 5分〜60分の範囲
  }
  
  // セット数なしの場合はデフォルト
  return 20;
}

// デフォルトMETsを取得
function getDefaultMETs(exerciseType: string): number {
  const metsMap: { [key: string]: number } = {
    'cardio': 6.0,
    'strength': 6.0,
    'sports': 7.0,
    'flexibility': 2.5,
    'daily_activity': 3.0
  };
  
  return metsMap[exerciseType] || 5.0;
}

// === 運動記録機能 ===
// 動的パターンキャッシュ（ユーザー別）
const userExercisePatterns = new Map();

// 基本運動パターン（詳細版）
const BASIC_EXERCISE_PATTERNS = [
  // 複数重量パターン（重量を変えて複数セット）
  { 
    pattern: /^(ベンチプレス|スクワット|デッドリフト|懸垂|腕立て伏せ|腕立て|腹筋|背筋|肩トレ|ショルダープレス|ラットプルダウン|レッグプレス|カールアップ|プランク|バーベルカール|ダンベルカール|チンアップ|プルアップ|ディップス|レッグエクステンション|レッグカール|カーフレイズ|アームカール|サイドレイズ|フロントレイズ|リアレイズ|アップライトロウ|シュラッグ|クランチ|サイドクランチ|ロシアンツイスト|レッグレイズ|マウンテンクライマー|バーピー|ジャンピングジャック)\s+((?:\d+(?:\.\d+)?\s*(?:kg|キロ|ｋｇ|KG)\s*\d+\s*(?:回|レップ|rep|reps)(?:\s|$))+)$/i, 
    type: 'strength_multiple_weights',
    captureGroups: ['exercise', 'weightRepsString']
  },
  
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
  
  // 胸筋トレーニング（詳細）
  'ダンベルプレス': 6.0, 'ダンベルベンチプレス': 6.0, 'インクラインベンチプレス': 6.5, 
  'デクラインベンチプレス': 5.5, 'インクラインダンベルプレス': 6.5, 'デクラインダンベルプレス': 5.5,
  'チェストフライ': 5.0, 'ダンベルフライ': 5.0, 'ペクトラルフライ': 5.0, 
  'ケーブルフライ': 5.0, 'ケーブルクロスオーバー': 5.0, 'ケーブルクロス': 5.0,
  
  // 背筋トレーニング（詳細）
  'ベントオーバーロウ': 6.0, 'ワンハンドロウ': 5.5, 'シーテッドロウ': 5.0,
  'Tバーロウ': 6.0, 'ケーブルロウ': 5.0, 'フェイスプル': 4.0,
  
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
      
      // 複数重量パターンの処理
      if (type === 'strength_multiple_weights') {
        const exerciseName = match[1];
        const weightRepsString = match[2];
        const parsedSets = parseMultipleWeightSets(weightRepsString);
        
        return {
          exerciseName: exerciseName,
          sets: parsedSets,
          type: 'strength',
          source: 'multiple_weights_pattern',
          detailType: 'multiple_weights'
        };
      }
      
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
    
    // 複数重量パターンの処理
    if (source === 'multiple_weights_pattern') {
      return await recordMultipleWeightExercise(userId, match, replyToken, user);
    }
    
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
    const caloriesBurned = Math.round((mets * (duration / 60) * userWeight * 1.05));
    
    // 運動データ作成
    const exerciseData = {
      id: generateId(),
      name: exerciseName,
      type: exerciseType,
      duration: duration,
      intensity: getIntensity(mets),
      calories: caloriesBurned, // アプリはcaloriesフィールドを期待
      notes: `LINE記録 ${new Date().toLocaleTimeString('ja-JP', { timeZone: 'Asia/Tokyo' })}`,
      timestamp: new Date(),
      time: new Date().toLocaleTimeString('ja-JP', { 
        hour: '2-digit', 
        minute: '2-digit',
        timeZone: 'Asia/Tokyo'
      })
    };
    
    // 追加情報があれば設定
    if (match.distance) {
      exerciseData.distance = match.distance;
    }
    // sets情報をアプリの型定義に合わせる
    if (match.weight && match.reps) {
      const setsCount = match.sets || 1;
      exerciseData.sets = Array(setsCount).fill({ weight: match.weight, reps: match.reps });
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
    
    // AI応答でキャラクター口調の記録完了メッセージ生成
    let recordInfo = `${exerciseName} ${duration}分を記録しました。消費カロリー: ${caloriesBurned}kcal`;
    
    if (match.distance) {
      recordInfo = `${exerciseName} ${match.distance}km ${duration}分を記録しました。消費カロリー: ${caloriesBurned}kcal`;
    } else if (match.weight && match.reps && match.sets) {
      recordInfo = `${exerciseName} ${match.weight}kg ${match.reps}回 ${match.sets}セットを記録しました。消費カロリー: ${caloriesBurned}kcal`;
    } else if (match.weight && match.reps) {
      recordInfo = `${exerciseName} ${match.weight}kg ${match.reps}回を記録しました。消費カロリー: ${caloriesBurned}kcal`;
    }
    
    const aiService = new AIHealthService();
    const characterSettings = null;
    const aiResponse = await aiService.generateGeneralResponse(recordInfo, userId, characterSettings);
    
    await replyMessage(replyToken, [{
      type: 'text',
      text: aiResponse || recordInfo
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

// 複数重量運動記録（重量を変えて複数セット）
async function recordMultipleWeightExercise(userId: string, match: any, replyToken: string, user: any) {
  try {
    const { exerciseName, sets } = match;
    
    if (!sets || sets.length === 0) {
      throw new Error('セット情報が見つかりません');
    }
    
    // 総時間推定（セット数×3分+休憩時間）
    const totalSets = sets.length;
    const estimatedDuration = totalSets * 3 + (totalSets - 1) * 2;
    
    // 平均重量でカロリー計算
    const avgWeight = sets.reduce((sum, set) => sum + set.weight, 0) / sets.length;
    const userWeight = await getUserWeight(userId) || 70;
    const baseMets = EXERCISE_METS[exerciseName] || 6.0;
    const caloriesBurned = Math.round((baseMets * (estimatedDuration / 60) * userWeight * 1.05));
    
    // 運動データ作成（アプリの型定義に合わせる）
    const exerciseData = {
      id: generateId(),
      name: exerciseName,
      type: 'strength',
      duration: estimatedDuration,
      calories: caloriesBurned,
      sets: sets, // 複数重量セット配列
      notes: `LINE記録 ${new Date().toLocaleTimeString('ja-JP', { timeZone: 'Asia/Tokyo' })} - 複数重量`,
      timestamp: new Date(),
      time: new Date().toLocaleTimeString('ja-JP', { 
        hour: '2-digit', 
        minute: '2-digit',
        timeZone: 'Asia/Tokyo'
      }),
      // 統計情報
      totalSets: totalSets,
      avgWeight: Math.round(avgWeight * 10) / 10,
      totalReps: sets.reduce((sum, set) => sum + set.reps, 0)
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
    
    // AI応答でキャラクター口調の詳細記録完了メッセージ生成
    const setsInfo = sets.map((set, index) => 
      `${index + 1}セット目: ${set.weight}kg × ${set.reps}回`
    ).join('\n');
    
    const recordInfo = `${exerciseName}の複数セット記録が完了しました。詳細: ${setsInfo}、総セット数: ${totalSets}セット、総回数: ${exerciseData.totalReps}回、平均重量: ${exerciseData.avgWeight}kg、推定時間: ${estimatedDuration}分、推定消費カロリー: ${caloriesBurned}kcal。段階的な重量アップでのトレーニングでした。`;
    
    const aiService = new AIHealthService();
    const characterSettings = null;
    const aiResponse = await aiService.generateGeneralResponse(recordInfo, userId, characterSettings);
    
    await replyMessage(replyToken, [{
      type: 'text',
      text: aiResponse || `${exerciseName}記録完了！`
    }]);
    
    console.log('✅ 複数重量運動記録完了:', exerciseData);
    
  } catch (error) {
    console.error('❌ 複数重量運動記録エラー:', error);
    await replyMessage(replyToken, [{
      type: 'text',
      text: '複数重量運動記録でエラーが発生しました。もう一度お試しください。'
    }]);
    throw error;
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
    const caloriesBurned = Math.round((baseMets * (estimatedDuration / 60) * userWeight * 1.05));
    
    // 運動データ作成（アプリの型定義に合わせる）
    const exerciseData = {
      id: generateId(),
      name: exerciseName,
      type: 'strength',
      duration: estimatedDuration,
      calories: caloriesBurned, // アプリはcaloriesフィールドを期待
      sets: Array(sets).fill({ weight: weight, reps: reps }), // アプリの型定義に合わせる
      notes: `LINE記録 ${new Date().toLocaleTimeString('ja-JP', { timeZone: 'Asia/Tokyo' })}`,
      timestamp: new Date(),
      time: new Date().toLocaleTimeString('ja-JP', { 
        hour: '2-digit', 
        minute: '2-digit',
        timeZone: 'Asia/Tokyo'
      })
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
    
    // AI応答でキャラクター口調の記録完了メッセージ生成
    const recordInfo = `${exerciseName} ${weight}kg ${reps}回 ${sets}セットを記録しました。推定時間: ${estimatedDuration}分、消費カロリー: ${caloriesBurned}kcal`;
    const aiService = new AIHealthService();
    const characterSettings = null;
    const aiResponse = await aiService.generateGeneralResponse(recordInfo, userId, characterSettings);
    
    await replyMessage(replyToken, [{
      type: 'text',
      text: aiResponse || `${exerciseName}記録完了！`
    }]);
    
    console.log('✅ 詳細運動記録完了:', exerciseData);
    
  } catch (error) {
    console.error('❌ 詳細運動記録エラー:', error);
    throw error;
  }
}

// 記録モード専用：単一運動記録（Flexメッセージで返事）
async function handleRecordModeSingleExercise(userId: string, exerciseData: any, replyToken: string, originalText: string) {
  try {
    console.log('🏃‍♂️ 記録モード単一運動記録開始:', { userId, exerciseData, originalText });
    
    // 食事記録と同じようにローディング開始
    await startLoadingAnimation(userId, 10);

    const { exerciseName, exerciseType, duration, intensity, sets, reps, weight, distance, displayName, weightSets } = exerciseData;
    
    // カロリー計算
    const userWeight = await getUserWeight(userId) || 70;
    const mets = EXERCISE_METS[exerciseName] || getDefaultMETs(exerciseType);
    // セット数・重量・回数を考慮した推定時間計算
    const calculationDuration = duration || calculateEstimatedDuration(
      exerciseType, 
      sets || 0, 
      reps || 0, 
      weight || 0
    );
    const caloriesBurned = Math.round((mets * (calculationDuration / 60) * userWeight * 1.05));
    
    // 運動データ作成
    const exerciseRecord = {
      id: generateId(),
      name: exerciseName,
      displayName: displayName || exerciseName,
      type: exerciseType,
      duration: duration || 0,
      calories: caloriesBurned,
      intensity: intensity || getIntensity(mets),
      sets: weightSets && weightSets.length > 0 ? weightSets : (sets && sets > 0 ? sets : null),
      reps: reps || 0,
      weight: weight || 0,
      distance: distance || 0,
      weightSets: weightSets || [],
      setsCount: sets || (weightSets && weightSets.length > 0 ? weightSets.reduce((sum, ws) => sum + (ws.sets || 1), 0) : null),
      notes: `LINE記録 ${new Date().toLocaleTimeString('ja-JP', { timeZone: 'Asia/Tokyo' })} - 記録モード`,
      timestamp: new Date(),
      time: new Date().toLocaleTimeString('ja-JP', { 
        hour: '2-digit', 
        minute: '2-digit',
        timeZone: 'Asia/Tokyo'
      })
    };
    
    // Firestoreに保存
    const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' });
    const db = admin.firestore();
    const recordRef = db.collection('users').doc(userId).collection('dailyRecords').doc(today);
    const recordDoc = await recordRef.get();
    const existingData = recordDoc.exists ? recordDoc.data() : {};
    const existingExercises = existingData.exercises || [];
    
    // 同じ種目の既存記録をチェック
    const existingExerciseIndex = existingExercises.findIndex((ex: any) => 
      ex.name === exerciseName || ex.displayName === exerciseName
    );
    
    let updatedExercises;
    let finalExerciseRecord = exerciseRecord;
    
    if (existingExerciseIndex !== -1) {
      // 既存の種目に新しいセットとして追加
      const existingExercise = existingExercises[existingExerciseIndex];
      const newSet = {
        weight: weight || 0,
        reps: reps || 0,
        sets: sets || 1
      };
      
      // weightSetsに追加
      const updatedWeightSets = [...(existingExercise.weightSets || []), newSet];
      
      // セット数とカロリーを更新
      const updatedSetsCount = (existingExercise.setsCount || 0) + (sets || 1);
      const updatedCalories = existingExercise.calories + caloriesBurned;
      
      finalExerciseRecord = {
        ...existingExercise,
        weightSets: updatedWeightSets,
        setsCount: updatedSetsCount,
        calories: updatedCalories,
        updatedAt: new Date()
      };
      
      existingExercises[existingExerciseIndex] = finalExerciseRecord;
      updatedExercises = existingExercises;
      
      console.log('✅ 記録モード：既存の種目にセットを追加:', { 
        exerciseName, 
        newSet, 
        totalSets: updatedSetsCount,
        totalCalories: updatedCalories,
        updatedWeightSets: updatedWeightSets
      });
    } else {
      // 新しい種目として追加
      updatedExercises = [...existingExercises, exerciseRecord];
      console.log('✅ 記録モード：新しい種目として追加:', exerciseName);
    }
    
    await recordRef.set({
      ...existingData,
      exercises: updatedExercises,
      date: today,
      lineUserId: userId,
      updatedAt: new Date()
    }, { merge: true });
    
    // キャッシュを削除してアプリ側の表示を更新（複数のキーパターンで確実に削除）
    const cacheKeys = [
      createCacheKey('exercises', userId, today),
      `exercises_${userId}_${today}`,
      `exercises-${userId}-${today}`
    ];
    cacheKeys.forEach(key => {
      apiCache.delete(key);
      console.log('🗑️ 記録モード運動記録キャッシュを削除:', key);
    });
    
    // 全キャッシュをクリア（確実にするため）
    try {
      apiCache.clear();
      console.log('🗑️ 記録モード：全キャッシュをクリア');
    } catch (error) {
      console.log('⚠️ 記録モード：キャッシュクリア中にエラー:', error);
    }
    
    // Flexメッセージで記録完了を通知（食事記録と同じスタイル）
    const flexMessage = createExerciseFlexMessage(finalExerciseRecord, originalText);
    
    const messageWithQuickReply = {
      ...flexMessage,
    };
    
    await pushMessage(userId, [messageWithQuickReply]);
    await stopLoadingAnimation(userId);
    
    console.log('✅ 記録モード単一運動記録完了:', exerciseRecord);
    
  } catch (error) {
    console.error('❌ 記録モード単一運動記録エラー:', error);
    await stopLoadingAnimation(userId);
    await pushMessage(userId, [{
      type: 'text',
      text: '運動記録でエラーが発生しました。もう一度お試しください。',
    }]);
  }
}

// 記録モード専用：複数運動記録（Flexメッセージで返事）
async function handleRecordModeMultipleExercise(userId: string, exerciseData: any, replyToken: string, originalText: string) {
  try {
    console.log('🏃‍♂️ 記録モード複数運動記録開始:', { userId, exerciseData, originalText });
    
    // 食事記録と同じようにローディング開始
    await startLoadingAnimation(userId, 10);
    
    const { exercises } = exerciseData;
    const userWeight = await getUserWeight(userId) || 70;
    const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' });
    
    // Firestoreから既存記録を取得
    const db = admin.firestore();
    const recordRef = db.collection('users').doc(userId).collection('dailyRecords').doc(today);
    const recordDoc = await recordRef.get();
    const existingData = recordDoc.exists ? recordDoc.data() : {};
    const existingExercises = existingData.exercises || [];
    
    const addedExercises = [];
    let totalCalories = 0;
    
    // 各運動を処理
    for (const exercise of exercises) {
      const { exerciseName, exerciseType, duration, intensity, sets, reps, weight, distance, timeOfDay, displayName, weightSets } = exercise;
      
      // カロリー計算
      const mets = EXERCISE_METS[exerciseName] || getDefaultMETs(exerciseType);
      // セット数・重量・回数を考慮した推定時間計算
      const calculationDuration = duration || calculateEstimatedDuration(
        exerciseType, 
        sets || 0, 
        reps || 0, 
        weight || 0
      );
      const caloriesBurned = Math.round((mets * (calculationDuration / 60) * userWeight * 1.05));
      totalCalories += caloriesBurned;
      
      // 運動データ作成
      const exerciseRecord = {
        id: generateId(),
        name: exerciseName,
        displayName: displayName || exerciseName,
        type: exerciseType,
        duration: duration || 0,
        calories: caloriesBurned,
        intensity: intensity || getIntensity(mets),
        sets: weightSets && weightSets.length > 0 ? weightSets : (sets && sets > 0 ? sets : null),
        setsCount: sets || (weightSets && weightSets.length > 0 ? weightSets.reduce((sum, ws) => sum + (ws.sets || 1), 0) : null),
        reps: reps || 0,
        weight: weight || 0,
        distance: distance || 0,
        timeOfDay: timeOfDay || '',
        weightSets: weightSets || [],
        notes: `LINE記録 ${new Date().toLocaleTimeString('ja-JP', { timeZone: 'Asia/Tokyo' })} - 記録モード（複数運動）`,
        timestamp: new Date(),
        time: new Date().toLocaleTimeString('ja-JP', { 
          hour: '2-digit', 
          minute: '2-digit',
          timeZone: 'Asia/Tokyo'
        })
      };
      
      addedExercises.push(exerciseRecord);
    }
    
    // Firestoreに保存
    const updatedExercises = [...existingExercises, ...addedExercises];
    await recordRef.set({
      ...existingData,
      exercises: updatedExercises,
      date: today,
      lineUserId: userId,
      updatedAt: new Date()
    }, { merge: true });
    
    // 各運動を個別のFlexメッセージで送信
    const messages = [];
    
    for (let i = 0; i < addedExercises.length; i++) {
      const exercise = addedExercises[i];
      const singleExerciseData = {
        isMultipleExercises: false,
        exercise: exercise
      };
      
      const flexMessage = createExerciseFlexMessage(singleExerciseData, originalText);
      
      // Flexメッセージのみ追加（クイックリプライは削除済み）
      messages.push(flexMessage);
    }
    
    await replyMessage(replyToken, messages);
    await stopLoadingAnimation(userId);
    
    console.log('✅ 記録モード複数運動記録完了:', addedExercises);
    
  } catch (error) {
    console.error('❌ 記録モード複数運動記録エラー:', error);
    await stopLoadingAnimation(userId);
    await replyMessage(replyToken, [{
      type: 'text',
      text: '複数運動記録でエラーが発生しました。もう一度お試しください。',
    }]);
  }
}


// ユーティリティ関数
function convertWeightToKg(value: number, unit: string): number {
  if (unit.toLowerCase().includes('kg') || unit === 'キロ') {
    return value;
  }
  return value; // デフォルトはkg
}

// 複数重量セットを解析する関数
function parseMultipleWeightSets(weightRepsString: string): Array<{weight: number, reps: number}> {
  const sets = [];
  // "50kg 10回 70kg 8回 100kg 8回" のような文字列を解析
  const setPattern = /(\d+(?:\.\d+)?)\s*(?:kg|キロ|ｋｇ|KG)\s*(\d+)\s*(?:回|レップ|rep|reps)/gi;
  let match;
  
  while ((match = setPattern.exec(weightRepsString)) !== null) {
    const weight = parseFloat(match[1]);
    const reps = parseInt(match[2]);
    sets.push({ weight, reps });
  }
  
  console.log('🏋️‍♂️ 複数重量セット解析結果:', sets);
  return sets;
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


// 強化された連続タップ防止機能
const processingUsers = new Map<string, number>(); // 処理中ユーザー管理
const lastTapTime = new Map<string, number>(); // 最後のタップ時間記録
const tapCounts = new Map<string, number>(); // 連続タップ回数記録
const ANTI_SPAM_DELAY = 2000; // 2秒間の連続タップ防止
const BURST_LIMIT = 3; // 連続タップ回数制限（3回まで）
const BURST_WINDOW = 10000; // 10秒間のウィンドウ
const PENALTY_DURATION = 30000; // ペナルティ期間（30秒）
const penalizedUsers = new Map<string, number>(); // ペナルティ中ユーザー


// 強化された連続タップ防止機能
function canProcessTap(userId: string): boolean {
  const now = Date.now();
  
  // 1. ペナルティ期間中かチェック
  const penaltyEnd = penalizedUsers.get(userId);
  if (penaltyEnd && now < penaltyEnd) {
    const remainingSeconds = Math.ceil((penaltyEnd - now) / 1000);
    console.log(`🚫 ペナルティ中: ${userId} (残り${remainingSeconds}秒)`);
    return false;
  }
  
  // ペナルティ期間終了済みの場合はリセット
  if (penaltyEnd && now >= penaltyEnd) {
    penalizedUsers.delete(userId);
    tapCounts.delete(userId);
    console.log(`✅ ペナルティ解除: ${userId}`);
  }
  
  // 2. 基本的な連続タップチェック（2秒間隔）
  const lastTap = lastTapTime.get(userId);
  if (lastTap && (now - lastTap) < ANTI_SPAM_DELAY) {
    console.log(`🚫 連続タップ防止: ${userId} (${now - lastTap}ms前にタップ済み)`);
    
    // 3. バースト検出：10秒間に3回以上の連続タップ
    const currentCount = tapCounts.get(userId) || 0;
    const newCount = currentCount + 1;
    tapCounts.set(userId, newCount);
    
    if (newCount >= BURST_LIMIT) {
      // ペナルティ適用
      const penaltyUntil = now + PENALTY_DURATION;
      penalizedUsers.set(userId, penaltyUntil);
      console.log(`⚠️ バースト検出 - ペナルティ適用: ${userId} (30秒間)`);
      
      return false;
    }
    
    return false;
  }
  
  // 4. 正常なタップの場合
  lastTapTime.set(userId, now);
  
  // 5. バーストカウンターのリセット（正常間隔の場合）
  const timeSinceLastTap = lastTap ? (now - lastTap) : BURST_WINDOW + 1;
  if (timeSinceLastTap > BURST_WINDOW) {
    tapCounts.delete(userId);
  }
  
  return true;
}

function setProcessing(userId: string, processing: boolean): void {
  if (processing) {
    processingUsers.set(userId, Date.now());
    console.log(`⏳ 処理開始: ${userId}`);
  } else {
    processingUsers.delete(userId);
    console.log(`✅ 処理完了: ${userId}`);
  }
}

function isProcessing(userId: string): boolean {
  return processingUsers.has(userId);
}

// 記録モード管理関数（Firestoreベース + メモリキャッシュ）
// 複数食事時間の記録処理
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
          name: meal.displayName || meal.name, // displayNameを優先
          type: mealTime, // ✅ アプリが期待するフィールド名  
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
          type: mealTime, // ✅ アプリが期待するフィールド名  
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
    
    // 🧠 AIアドバイス生成（複数食事時間用）
    console.log('🧠 複数食事時間 - パーソナル食事アドバイス生成開始');
    let aiAdvice = null;
    
    try {
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
        }
        console.log('📊 ユーザープロフィール取得成功');
      } catch (profileError) {
        console.error('❌ プロフィール取得エラー:', profileError);
      }

      // 今日の栄養進捗を取得
      let dailyProgress = null;
      try {
        dailyProgress = await getDailyNutritionProgress(userId);
      } catch (progressError) {
        console.log('⚠️ 今日の栄養進捗取得失敗（アドバイス生成は継続）:', progressError);
      }

      // 全ての食事を統合した分析データを作成
      const allMeals = Object.values(mealData).flat();
      const totalCalories = allMeals.reduce((sum, meal) => sum + (meal.calories || 0), 0);
      const totalProtein = allMeals.reduce((sum, meal) => sum + (meal.protein || 0), 0);
      const totalCarbs = allMeals.reduce((sum, meal) => sum + (meal.carbs || 0), 0);
      const totalFat = allMeals.reduce((sum, meal) => sum + (meal.fat || 0), 0);
      
      const combinedAnalysis = {
        calories: totalCalories,
        protein: totalProtein,
        carbs: totalCarbs,
        fat: totalFat,
        displayName: '複数の食事時間の記録',
        foodItems: allMeals.map(meal => meal.name)
      };

      // AIアドバイス生成
      aiAdvice = await aiService.generateMealAdvice(
        combinedAnalysis,
        'multiple', // 複数食事時間を示す特別なmealType
        userId,
        userProfile,
        dailyProgress,
        null
      );
      console.log('✅ 複数食事時間 - パーソナル食事アドバイス生成完了:', aiAdvice);
    } catch (adviceError) {
      console.error('❌ 複数食事時間 - パーソナル食事アドバイス生成エラー:', adviceError);
      // エラーでもFlexメッセージは送信
      aiAdvice = null;
    }
    
    // 複数食事時間用のFlexメッセージを作成・送信（AIアドバイス付き）
    const flexMessage = createMultipleMealTimesFlexMessage(mealData, aiAdvice);
    
    // クイックリプライ付きでFlexメッセージ送信
    const messageWithQuickReply = {
      ...flexMessage,
    };
    
    await stopLoadingAnimation(userId);
    await pushMessage(userId, [messageWithQuickReply]);
    
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
    // アプリと同じusersコレクションに保存
    const recordRef = admin.firestore().collection('users').doc(userId).collection('dailyRecords').doc(today);
    
    console.log(`🍽️ ${mealType} Firestore参照:`, `users/${userId}/dailyRecords/${today}`);
    
    const recordDoc = await recordRef.get();
    const existingData = recordDoc.exists ? recordDoc.data() : {};
    const existingMeals = existingData.meals || [];
    
    console.log(`🍽️ ${mealType} 既存食事:`, existingMeals.length, '件');
    
    // 新しい食事を追加
    const updatedMeals = [...existingMeals, ...meals];
    
    console.log(`🍽️ ${mealType} 更新後食事:`, updatedMeals.length, '件');
    
    await recordRef.set({
      ...existingData,
      meals: updatedMeals,
      date: today,
      lineUserId: userId,
      updatedAt: new Date()
    }, { merge: true });
    
    console.log(`🍽️ ${mealType} 食事保存完了:`, meals.length, '件');
    
  } catch (error) {
    console.error(`🍽️ ${mealType} 食事保存エラー:`, error);
    throw error;
  }
}

// 1日フィードバック処理
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
      await replyMessage(replyToken, [createUsageLimitFlex('feedback', userId)]);
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

// 日次フィードバック用のFlexメッセージを作成
function createDailyFeedbackFlex(feedbackText: string) {
  // フィードバックテキストを解析してセクション分け
  const lines = feedbackText.split('\n').filter(line => line.trim());
  
  // ヘッダー（今日の記録）を取得
  const headerIndex = lines.findIndex(line => line.includes('📊 今日の記録'));
  const headerSection = lines.slice(headerIndex, headerIndex + 4); // 記録部分
  
  // 各セクションを抽出
  const weightSection = extractSection(lines, '🎯 体重');
  const mealAnalysisSection = extractSection(lines, '🥗 食事分析');
  const exerciseSection = extractSection(lines, '💪 運動分析');
  const totalEvaluationSection = extractSection(lines, '🌟 総合評価');
  
  // データ抽出（カロリーやPFC情報）
  const calorieMatch = feedbackText.match(/🍽️ 食事: (\d+)kcal/);
  const pfcMatch = feedbackText.match(/P:(\d+)g F:(\d+)g C:(\d+)g/);
  const exerciseMatch = feedbackText.match(/💪 運動: (\d+)分/);
  
  const calories = calorieMatch ? parseInt(calorieMatch[1]) : 0;
  const protein = pfcMatch ? parseInt(pfcMatch[1]) : 0;
  const fat = pfcMatch ? parseInt(pfcMatch[2]) : 0;
  const carbs = pfcMatch ? parseInt(pfcMatch[3]) : 0;
  const exerciseTime = exerciseMatch ? parseInt(exerciseMatch[1]) : 0;

  return {
    type: 'bubble',
    size: 'giga',
    header: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'text',
          text: '今日の健康フィードバック',
          weight: 'bold',
          size: 'xl',
          color: '#ffffff'
        },
        {
          type: 'text',
          text: new Date().toLocaleDateString('ja-JP', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          }),
          size: 'sm',
          color: '#ffffff',
          margin: 'sm'
        }
      ],
      backgroundColor: '#4A90E2',
      paddingAll: '20px'
    },
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        // 今日の記録サマリー（数値ベース）
        {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'text',
              text: '📊 今日の記録',
              weight: 'bold',
              size: 'lg',
              color: '#333333',
              margin: 'none'
            },
            {
              type: 'box',
              layout: 'horizontal',
              contents: [
                {
                  type: 'box',
                  layout: 'vertical',
                  contents: [
                    {
                      type: 'text',
                      text: `${calories}`,
                      size: 'xl',
                      weight: 'bold',
                      color: '#FF6B6B'
                    },
                    {
                      type: 'text',
                      text: 'kcal',
                      size: 'xs',
                      color: '#999999'
                    }
                  ],
                  flex: 1
                },
                {
                  type: 'box',
                  layout: 'vertical',
                  contents: [
                    {
                      type: 'text',
                      text: `${protein}g`,
                      size: 'md',
                      weight: 'bold',
                      color: '#4A90E2'
                    },
                    {
                      type: 'text',
                      text: 'タンパク質',
                      size: 'xxs',
                      color: '#999999'
                    }
                  ],
                  flex: 1
                },
                {
                  type: 'box',
                  layout: 'vertical',
                  contents: [
                    {
                      type: 'text',
                      text: `${fat}g`,
                      size: 'md',
                      weight: 'bold',
                      color: '#FFD93D'
                    },
                    {
                      type: 'text',
                      text: '脂質',
                      size: 'xxs',
                      color: '#999999'
                    }
                  ],
                  flex: 1
                },
                {
                  type: 'box',
                  layout: 'vertical',
                  contents: [
                    {
                      type: 'text',
                      text: `${carbs}g`,
                      size: 'md',
                      weight: 'bold',
                      color: '#4ECDC4'
                    },
                    {
                      type: 'text',
                      text: '炭水化物',
                      size: 'xxs',
                      color: '#999999'
                    }
                  ],
                  flex: 1
                }
              ],
              margin: 'md',
              spacing: 'sm'
            },
            ...(exerciseTime > 0 ? [{
              type: 'box' as const,
              layout: 'horizontal' as const,
              contents: [
                {
                  type: 'text' as const,
                  text: '💪',
                  size: 'sm' as const,
                  flex: 0
                },
                {
                  type: 'text' as const,
                  text: `運動: ${exerciseTime}分`,
                  size: 'sm' as const,
                  color: '#666666',
                  flex: 1
                }
              ],
              margin: 'md' as const
            }] : [])
          ],
          backgroundColor: '#F8F9FA',
          cornerRadius: '12px',
          paddingAll: '16px',
          margin: 'md'
        },
        
        // 区切り線
        {
          type: 'separator',
          margin: 'xl'
        },
        
        // 体重セクション
        ...(weightSection.length > 0 ? [{
          type: 'box' as const,
          layout: 'vertical' as const,
          contents: [
            {
              type: 'text' as const,
              text: '🎯 体重',
              weight: 'bold' as const,
              size: 'md' as const,
              color: '#4A90E2'
            },
            ...weightSection.map(line => ({
              type: 'text' as const,
              text: line,
              size: 'sm' as const,
              color: '#333333',
              wrap: true,
              margin: 'xs' as const
            }))
          ],
          margin: 'lg' as const
        }] : []),
        
        // 食事分析セクション（詳細表示）
        ...(mealAnalysisSection.length > 0 ? [{
          type: 'box' as const,
          layout: 'vertical' as const,
          contents: [
            {
              type: 'text' as const,
              text: '🥗 食事分析',
              weight: 'bold' as const,
              size: 'md' as const,
              color: '#FF6B6B'
            },
            ...mealAnalysisSection.map(line => ({
              type: 'text' as const,
              text: line,
              size: 'sm' as const,
              color: '#333333',
              wrap: true,
              margin: 'xs' as const
            }))
          ],
          margin: 'lg' as const,
          backgroundColor: '#FFF5F5',
          cornerRadius: '12px',
          paddingAll: '16px'
        }] : []),
        
        // 運動分析セクション
        ...(exerciseSection.length > 0 ? [{
          type: 'box' as const,
          layout: 'vertical' as const,
          contents: [
            {
              type: 'text' as const,
              text: '💪 運動分析',
              weight: 'bold' as const,
              size: 'md' as const,
              color: '#4ECDC4'
            },
            ...exerciseSection.map(line => ({
              type: 'text' as const,
              text: line,
              size: 'sm' as const,
              color: '#333333',
              wrap: true,
              margin: 'xs' as const
            }))
          ],
          margin: 'lg' as const,
          backgroundColor: '#F0FDFC',
          cornerRadius: '12px',
          paddingAll: '16px'
        }] : [])
      ],
      spacing: 'sm',
      paddingAll: '20px'
    },
    footer: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'separator',
          margin: 'md'
        },
        {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'text',
              text: '🌟 総合評価',
              weight: 'bold',
              size: 'md',
              color: '#FFD93D'
            },
            ...totalEvaluationSection.map(line => ({
              type: 'text' as const,
              text: line.replace('🌟 ', ''),
              size: 'sm' as const,
              color: '#333333',
              wrap: true,
              margin: 'xs' as const
            }))
          ],
          backgroundColor: '#FFFBF0',
          cornerRadius: '8px',
          paddingAll: '12px',
          margin: 'md'
        }
      ]
    }
  };
}

// セクションのテキストを抽出するヘルパー関数
function extractSection(lines: string[], sectionStart: string): string[] {
  const startIndex = lines.findIndex(line => line.includes(sectionStart));
  if (startIndex === -1) return [];
  
  const nextSectionIndex = lines.findIndex((line, index) => 
    index > startIndex && (
      line.includes('🎯') || 
      line.includes('🥗') || 
      line.includes('💪') || 
      line.includes('🌟') ||
      line.includes('━━━')
    )
  );
  
  const endIndex = nextSectionIndex === -1 ? lines.length : nextSectionIndex;
  return lines.slice(startIndex + 1, endIndex).filter(line => 
    line.trim() && !line.includes('━━━')
  );
}

// 記録モード中に記録されたデータのみ取得
async function getRecentRecordsForComment(userId: string, recordModeStartTime: number): Promise<any> {
  try {
    const db = admin.firestore();
    const now = new Date();
    const startTime = new Date(recordModeStartTime);
    
    // 記録モード中のデータのみ取得
    const records = {
      meals: [] as any[],
      exercises: [] as any[],
      weights: [] as any[]
    };
    
    // 今日の記録のみチェック（記録モードは基本的に当日内で使用）
    const today = now.toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' });
    const recordRef = db.doc(`users/${userId}/dailyRecords/${today}`);
    const recordSnap = await recordRef.get();
    
    if (recordSnap.exists) {
      const data = recordSnap.data();
      
      // 記録モード期間中に記録されたもののみフィルタ
      const isInRecordMode = (timestamp: any) => {
        if (!timestamp) return false;
        const recordTime = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return recordTime >= startTime && recordTime <= now;
      };
      
      // 食事記録（記録モード中のもののみ）
      if (data?.meals) {
        records.meals = data.meals.filter(meal => 
          isInRecordMode(meal.createdAt || meal.timestamp)
        );
      }
      
      // 運動記録（記録モード中のもののみ）
      if (data?.exercises) {
        records.exercises = data.exercises.filter(ex => 
          isInRecordMode(ex.createdAt || ex.timestamp)
        );
      }
      
      // 体重記録（記録モード中のもののみ）
      if (data?.weight) {
        const weightTime = data.weight.createdAt || data.weight.timestamp;
        if (isInRecordMode(weightTime)) {
          records.weights.push(data.weight);
        }
      }
    }
    
    console.log('📊 記録モード終了時データ取得:', {
      userId,
      recordModeStart: startTime.toISOString(),
      meals: records.meals.length,
      exercises: records.exercises.length,
      weights: records.weights.length
    });
    
    return records;
    
  } catch (error) {
    console.error('📊 記録データ取得エラー:', error);
    return { meals: [], exercises: [], weights: [] };
  }
}


// 利用制限時のFlexメッセージを作成
function createUsageLimitFlex(limitType: 'ai' | 'record' | 'feedback', userId: string) {
  const hashedUserId = hashUserId(userId);
  // LIFFを使って普段のアプリと同じ開き方にする
  const liffUrl = process.env.NEXT_PUBLIC_LIFF_ID ? 
    `https://liff.line.me/${process.env.NEXT_PUBLIC_LIFF_ID}/dashboard?luid=${hashedUserId}&tab=plan` :
    `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?luid=${hashedUserId}&tab=plan`;
  
  let title = '';
  let description = '';
  
  switch (limitType) {
    case 'ai':
      title = 'AI会話の制限';
      description = '無料プランでは1日3回までAI会話をご利用いただけます。';
      break;
    case 'record':
      title = '記録の制限';
      description = '無料プランでは1日1回まで記録をご利用いただけます。';
      break;
    case 'feedback':
      title = 'フィードバック機能の制限';
      description = 'フィードバック機能は有料プランの機能です。';
      break;
  }
  
  return {
    type: 'flex',
    altText: `${title}に達しました`,
    contents: {
      type: 'bubble',
      header: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: title,
            weight: 'bold',
            size: 'lg',
            align: 'center'
          }
        ],
        backgroundColor: '#FFF4E6',
        paddingAll: 'lg'
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: description,
            wrap: true,
            size: 'md',
            color: '#666666'
          },
          {
            type: 'separator',
            margin: 'lg'
          },
          {
            type: 'text',
            text: '有料プランにアップグレードすると無制限でご利用いただけます！',
            wrap: true,
            size: 'sm',
            color: '#1E90FF',
            weight: 'bold',
            margin: 'lg'
          }
        ],
        paddingAll: 'lg'
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'button',
            action: {
              type: 'uri',
              label: 'プランをアップグレード',
              uri: liffUrl
            },
            style: 'primary',
            color: '#1E90FF'
          }
        ],
        paddingAll: 'lg'
      }
    }
  };
}

// 記録確認メッセージを送信（クイックリプライ削除済み）
async function sendRecordConfirmation(replyToken: string) {
  const message = {
    type: 'text',
    text: 'フィードバックしますか？\n\n記録がないとちゃんとしたフィードバックができません。今日の食事や運動は記録しましたか？'
  };

  await replyMessage(replyToken, [message]);
}

// カロリー分析処理（記録はしない、表示のみ）
async function handleCalorieAnalysis(userId: string, replyToken: string) {
  try {
    console.log('🔍 カロリー分析開始:', { userId, timestamp: new Date().toISOString() });
    
    // 一時保存された画像分析データを取得
    const tempData = await getTempMealAnalysis(userId);
    if (!tempData || !tempData.analysis) {
      console.error('❌ 一時保存データが見つかりません:', userId);
      await replyMessage(replyToken, [{
        type: 'text',
        text: '分析データが見つかりませんでした。もう一度画像を送信してください。'
      }]);
      return;
    }

    const { analysis, imageContent, originalText } = tempData;
    console.log('📊 カロリー分析データ:', JSON.stringify(analysis, null, 2));

    // 画像URLを取得（画像がある場合）
    let imageUrl = null;
    if (imageContent) {
      try {
        // Firebase Storageにアップロード
        const uploadRef = ref(storage, `temp-analysis-images/${userId}/${Date.now()}.jpg`);
        const snapshot = await uploadBytes(uploadRef, imageContent);
        imageUrl = await getDownloadURL(snapshot.ref);
        console.log('🖼️ 画像アップロード成功:', imageUrl);
      } catch (uploadError) {
        console.error('❌ 画像アップロードエラー:', uploadError);
        // 画像がなくてもカロリー分析は継続
      }
    }

    // 🧠 AIアドバイス生成（カロリー分析用）
    console.log('🧠 カロリー分析 - パーソナル食事アドバイス生成開始');
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
        
        // 今日の合計栄養計算（カロリー分析なので記録はしない）
        dailyProgress = {
          currentCalories: dayData.totalCalories || 0,
          currentProtein: dayData.totalProtein || 0,
          currentFat: dayData.totalFat || 0,
          currentCarbs: dayData.totalCarbs || 0,
          targetCalories: dayData.targetCalories || 2000,
          targetProtein: dayData.targetProtein || 100,
          targetFat: dayData.targetFat || 65,
          targetCarbs: dayData.targetCarbs || 250
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
        analysis,
        'calorie_analysis', // カロリー分析専用のmealType
        userId,
        userProfile,
        dailyProgress,
        characterSettings
      );
      console.log('✅ カロリー分析 - パーソナル食事アドバイス生成完了:', aiAdvice);
    } catch (adviceError) {
      console.error('❌ カロリー分析 - パーソナル食事アドバイス生成エラー:', adviceError);
      // エラーでもFlexメッセージは送信
      aiAdvice = null;
    }

    // カロリー分析専用のFlexメッセージを作成（画像 + AIアドバイス含む）
    const flexMessage = createCalorieOnlyFlexMessage(analysis, originalText || '食事', imageUrl, aiAdvice);

    // レスポンス送信
    await replyMessage(replyToken, [flexMessage]);

    console.log('✅ カロリー分析完了:', { userId });

  } catch (error) {
    console.error('❌ カロリー分析エラー:', error);
    await replyMessage(replyToken, [{
      type: 'text',
      text: 'カロリー分析中にエラーが発生しました。もう一度お試しください。'
    }]);
  }
}

