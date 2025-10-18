import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { FirestoreService } from '@/services/firestoreService';
import AIHealthService from '@/services/aiService';
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { admin } from '@/lib/firebase-admin';
import { createMealFlexMessage, createMultipleMealTimesFlexMessage, createWeightFlexMessage, createExerciseFlexMessage } from './new_flex_message';
import { generateId } from '@/lib/utils';
import { apiCache, createCacheKey } from '@/lib/cache';

// 記録モード統一クイックリプライ
function getRecordModeQuickReply() {
  return {
    items: [
      {
        type: 'action',
        action: {
          type: 'postback',
          label: 'テキストで記録',
          data: 'action=open_keyboard',
          inputOption: 'openKeyboard'
        }
      },
      {
        type: 'action',
        action: {
          type: 'camera',
          label: 'カメラで記録'
        }
      },
      {
        type: 'action',
        action: {
          type: 'postback',
          label: '通常モードに戻る',
          data: 'action=exit_record_mode'
        }
      }
    ]
  };
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
    
    // 記録モード中かチェック
    console.log('🔍 記録モード判定開始:', { userId, text });
    const isInRecordMode = await isRecordMode(userId);
    console.log('🔍 記録モード状態チェック:', { 
      userId, 
      isInRecordMode, 
      text,
      timestamp: new Date().toISOString(),
      recordModeUsersSize: recordModeUsers.size,
      hasUserId: recordModeUsers.has(userId),
      serverRestartPossible: recordModeUsers.size === 0 ? '可能性あり' : 'なし'
    });
    
    // 記録モード中の場合、絶対にreturnすることを保証
    if (isInRecordMode) {
      console.log('🚨 記録モード中であることを確認！通常AI処理は絶対に実行しません！');
    }
    
    // AIアドバイスモード中かチェック
    const isAdviceMode = await isAIAdviceMode(userId);
    
    if (isAdviceMode) {
      // AIアドバイスモード中は記録機能を無効化し、高性能AIで応答
      const aiResponse = await aiService.generateAdvancedResponse(text, userId);
      
      // 会話履歴を保存
      if (aiResponse) {
        await aiService.saveConversation(userId, text, aiResponse);
      }
      
      await stopLoadingAnimation(userId);
      await replyMessage(replyToken, [{
        type: 'text',
        text: aiResponse || 'すみません、現在詳細なアドバイスができません。少し時間をおいてもう一度お試しください。'
      }]);
      return;
    }
    
    console.log('🔍 記録モードチェック:', { userId, isInRecordMode, text });
    
    // デバッグ: ステータス確認コマンド
    if (text.includes('ステータス') || text.includes('状態')) {
      await replyMessage(replyToken, [{
        type: 'text',
        text: `現在の状態:\n記録モード: ${isInRecordMode ? 'ON' : 'OFF'}\nAIアドバイスモード: ${isInAdviceMode ? 'ON' : 'OFF'}`
      }]);
      return;
    }
    
    if (isInRecordMode) {
      // 記録モード中：食事・運動・体重記録のみ処理
      console.log('📝 記録モード中 - 記録処理のみ実行');
      
      // 記録モード終了はクイックリプライの「通常モードに戻る」ボタンのみで可能
      // テキストでの終了は無効化（記録処理に専念）
      
      // まず体重記録の判定を行う
      console.log('📊 記録モード - 体重記録判定開始:', text);
      const weightJudgment = await aiService.analyzeWeightRecordIntent(text);
      console.log('📊 記録モード - 体重判定結果:', JSON.stringify(weightJudgment, null, 2));
      if (weightJudgment.isWeightRecord) {
        await handleWeightRecord(userId, weightJudgment, replyToken);
        // 体重記録後もクイックリプライで記録モード継続（食事記録と同様）
        return;
      }
      
      // 記録モード中は運動関連の言葉を全て直接記録（クイックリプライなし）
      console.log('🏃‍♂️ 記録モード - AI運動記録判定開始:', { 
        userId,
        text, 
        isRecordModeConfirmed: await isRecordMode(userId),
        timestamp: new Date().toISOString() 
      });
      try {
        const exerciseJudgment = await aiService.analyzeExerciseRecordIntent(text);
        console.log('🏃‍♂️ 記録モード - AI運動判定結果:', JSON.stringify(exerciseJudgment, null, 2));
        if (exerciseJudgment.isExerciseRecord) {
          console.log('✅ 記録モード - 運動として認識、直接記録開始');
          if (exerciseJudgment.isMultipleExercises) {
            console.log('🔄 記録モード - 複数運動記録処理');
            await handleRecordModeMultipleExercise(userId, exerciseJudgment, replyToken, text);
          } else {
            console.log('🔄 記録モード - 単一運動記録処理');
            await handleRecordModeSingleExercise(userId, exerciseJudgment, replyToken, text);
          }
          return;
        } else {
          console.log('❌ 記録モード - 運動記録として認識されませんでした');
        }
      } catch (error) {
        console.error('❌ 記録モード - AI運動記録判定エラー:', error);
      }
      
      // 食事記録の判定
      console.log('🍽️ 記録モード - 食事記録判定開始:', text);
      const mealJudgment = await aiService.analyzeFoodRecordIntent(text);
      console.log('🍽️ 記録モード - 食事判定結果:', JSON.stringify(mealJudgment, null, 2));
      
      if (mealJudgment.isFoodRecord) {
        console.log('🍽️ 記録モード - 食事として認識、AI分析開始');
        const mealAnalysis = await aiService.analyzeMealFromText(mealJudgment.foodText || text);
        console.log('🍽️ 記録モード - AI分析結果:', JSON.stringify(mealAnalysis, null, 2));
        await storeTempMealAnalysis(userId, mealAnalysis, null, text);
        
        if (mealJudgment.isMultipleMealTimes) {
          // 複数食事時間の処理
          await handleMultipleMealTimesRecord(userId, mealJudgment.mealTimes, replyToken);
          // 記録後もクイックリプライで記録モード継続
          return;
        } else if (mealJudgment.hasSpecificMealTime) {
          const mealType = mealJudgment.mealTime;
          await saveMealRecord(userId, mealType, replyToken);
          // 記録後もクイックリプライで記録モード継続
          return;
        } else {
          // 食事タイプ選択のクイックリプライ表示
          await stopLoadingAnimation(userId);
          await replyMessage(replyToken, [{
            type: 'text',
            text: `${mealJudgment.foodText || text}の記録をしますか？`,
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
      
      // 記録モード中だが、記録として認識されなかった場合
      await stopLoadingAnimation(userId);
      
      // 記録モードの状態を確認・維持
      const isStillInRecordMode = await isRecordMode(userId);
      if (!isStillInRecordMode) {
        console.log('⚠️ 記録モード状態が失われていました。再設定します:', userId);
        await setRecordMode(userId, true);
      }
      
      // 記録モード中は記録処理のみ受付、AI会話は行わない
      await replyMessage(replyToken, [{
        type: 'text',
        text: '現在記録モード中です。通常モードに戻りたい時は、通常モードに戻るボタンを押してください！',
        quickReply: getRecordModeQuickReply()
      }]);
      // 記録モードは継続（終了しない）
      return;
    }
    
    // 通常モード：AI会話がメイン、明確な記録意図があれば記録も可能
    
    // 通常モードでは記録判定を完全に無効化（純粋なAI会話のみ）
    console.log('🤖 通常モード - 記録判定をスキップ、AI会話で応答');
    
    // 通常モード：AI会話で応答（高性能モデル使用）
    // 万が一のセーフティガード：記録モード中なら絶対に実行しない
    const doubleCheckRecordMode = await isRecordMode(userId);
    if (doubleCheckRecordMode) {
      console.error('🚨 致命的エラー：記録モード中なのに通常AI処理が実行されそうになりました！', { userId, text });
      await replyMessage(replyToken, [{
        type: 'text',
        text: '現在記録モード中です。通常モードに戻りたい時は、通常モードに戻るボタンを押してください！',
        quickReply: getRecordModeQuickReply()
      }]);
      return;
    }
    
    console.log('🤖 通常モード - AI会話で応答');
    const aiResponse = await aiService.generateAdvancedResponse(text, userId);
    
    // 会話履歴を保存
    if (aiResponse) {
      await aiService.saveConversation(userId, text, aiResponse);
    }
    
    await stopLoadingAnimation(userId);
    await replyMessage(replyToken, [{
      type: 'text',
      text: aiResponse || 'すみません、よく分からなかったです。健康管理についてお手伝いできることがあれば、お気軽にお声がけください！'
    }]);
    
  } catch (error) {
    console.error('テキストメッセージ処理エラー:', error);
    // エラー時は一般会話で応答（AIアドバイスモードを考慮）
    const aiService = new AIHealthService();
    const wasAdviceMode = aiAdviceModeUsers.has(userId); // タイムアウト前の状態
    const isAdviceMode = await isAIAdviceMode(userId);
    
    // タイムアウト検出時にお知らせ
    let aiResponse;
    if (wasAdviceMode && !isAdviceMode) {
      aiResponse = 'AIアドバイスモードが終了しました。通常モードに戻ります。\n\n' + 
                   await aiService.generateGeneralResponse(text, userId);
    } else {
      aiResponse = isAdviceMode 
        ? await aiService.generateAdvancedResponse(text, userId)  // 高性能モデル
        : await aiService.generateGeneralResponse(text, userId);  // 軽量モデル
    }
    
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
    console.log('🔥 シンプル画像処理開始:', { userId, messageId });
    
    // AIアドバイスモード中かチェック
    const isAdviceMode = await isAIAdviceMode(userId);
    
    if (isAdviceMode) {
      // AIアドバイスモード中は画像記録を無効化
      await replyMessage(replyToken, [{
        type: 'text',
        text: 'AIアドバイスモード中は画像での記録はできません。\n\n画像について相談されたい場合は、まず通常モードに戻ってから再度お試しください。'
      }]);
      return;
    }
    
    // Loading Animation開始（AIが画像分析中）
    await startLoadingAnimation(userId, 30);
    
    // 1. 画像を取得
    const imageContent = await getImageContent(messageId);
    if (!imageContent) {
      await stopLoadingAnimation(userId);
      await replyMessage(replyToken, [{
        type: 'text',
        text: '画像がうまく受け取れなかった！もう一度送ってみて？'
      }]);
      return;
    }

    // 2. AI分析実行
    const aiService = new AIHealthService();
    const mealAnalysis = await aiService.analyzeMealFromImage(imageContent);
    
    // 3. 食事画像かどうかチェック
    if (!mealAnalysis.isFoodImage) {
      // 食事じゃない画像の場合：一般AIで会話
      const aiResponse = await aiService.generateGeneralResponse(`この画像について: ${mealAnalysis.description || '画像を見ました'}`);
      await stopLoadingAnimation(userId);
      await replyMessage(replyToken, [{
        type: 'text',
        text: aiResponse
      }]);
      return;
    }
    
    // 4. 食事画像の場合：分析結果を一時保存（食事タイプ選択のため）
    await storeTempMealAnalysis(userId, mealAnalysis, imageContent);
    
    // 5. 食事タイプ選択のクイックリプライ表示
    await showMealTypeSelection(replyToken);
    await stopLoadingAnimation(userId);
    
    console.log('🔥 シンプル画像処理完了');
    
  } catch (error) {
    console.error('🔥 画像処理エラー:', error);
    await stopLoadingAnimation(userId);
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
  
  console.log('📤 Postback受信:', { userId, data, timestamp: new Date().toISOString() });
  
  const params = new URLSearchParams(data);
  const action = params.get('action');
  
  console.log('🎯 Postbackアクション:', { userId, action });

  switch (action) {
    case 'meal_breakfast':
    case 'meal_lunch':
    case 'meal_dinner':
    case 'meal_snack':
      const mealType = action.replace('meal_', '');
      await saveMealRecord(userId, mealType, replyToken);
      break;
    case 'record_menu':
      const startTime = Date.now();
      console.log('🔄 記録モードボタン押下:', { userId, timestamp: new Date().toISOString() });
      
      // 記録モードを開始（複数回押しても安全）
      await setRecordMode(userId, true);
      const modeSetTime = Date.now();
      console.log('✅ 記録モード設定完了:', { 
        userId, 
        isNowInRecordMode: await isRecordMode(userId),
        recordModeUsersSize: recordModeUsers.size,
        timeElapsed: `${modeSetTime - startTime}ms`
      });
      
      // AIアドバイスモード中なら自動終了
      const wasInAdviceMode = await isAIAdviceMode(userId);
      if (wasInAdviceMode) {
        console.log('🤖 AIアドバイスモード自動終了:', userId);
        await setAIAdviceMode(userId, false);
      }
      
      try {
        // 記録モード開始のFlexメッセージ
        console.log('📝 記録モードFlexメッセージ送信開始:', userId);
        const flexStartTime = Date.now();
        await startRecordMode(replyToken, userId);
        const flexEndTime = Date.now();
        console.log('✅ 記録モードFlexメッセージ送信完了:', { 
          userId,
          flexProcessTime: `${flexEndTime - flexStartTime}ms`,
          totalTime: `${flexEndTime - startTime}ms`
        });
      } catch (error) {
        console.error('❌ 記録モードFlexメッセージ送信エラー:', error);
        // フォールバック: シンプルなテキストメッセージ
        await replyMessage(replyToken, [{
          type: 'text',
          text: '記録モードを開始しました！\n\n食事・運動・体重を記録してください。'
        }]);
      }
      break;
    case 'daily_feedback':
      await handleDailyFeedback(replyToken, userId);
      break;
    case 'open_keyboard':
      // キーボードを開くための空のメッセージ（自動でキーボードが開く）
      break;
    case 'cancel_record':
      await replyMessage(replyToken, [{
        type: 'text',
        text: 'また記録してね！'
      }]);
      break;
    case 'exercise_running_30':
    case 'exercise_strength_45':
    case 'exercise_walking_20':
      // 古い運動記録クイックリプライは無効化（新しいAI分析システムを使用）
      await replyMessage(replyToken, [{
        type: 'text',
        text: '運動記録は記録モードでより自然な言葉で記録できます！\n\n「記録」ボタンを押して記録モードにして、「ランニング30分した」「筋トレした」などと送ってください。'
      }]);
      break;
    case 'exit_ai_advice':
      await setAIAdviceMode(userId, false);
      await replyMessage(replyToken, [{
        type: 'text',
        text: '通常モードに戻りました！\n\n記録機能が使えるようになりました。'
      }]);
      break;
    case 'exit_record_mode':
      await setRecordMode(userId, false);
      await replyMessage(replyToken, [{
        type: 'text',
        text: '通常モードに戻りました！\n\nAIアドバイス機能が使えるようになりました。'
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
        bodyFat: weightData.hasBodyFat ? weightData.bodyFat : undefined,
        note: `LINE記録 ${new Date().toLocaleTimeString('ja-JP', { timeZone: 'Asia/Tokyo' })}`
      }),
    });
    
    await stopLoadingAnimation(userId);
    
    if (response.ok) {
      const weightFlexMessage = createWeightFlexMessage(
        weightData.weight,
        weightData.hasBodyFat ? weightData.bodyFat : undefined
      );
      
      await replyMessage(replyToken, [{
        ...weightFlexMessage,
        quickReply: {
          items: [
            {
              type: 'action',
              action: {
                type: 'postback',
                label: 'テキストで記録',
                data: 'action=open_keyboard',
                inputOption: 'openKeyboard'
              }
            },
            {
              type: 'action',
              action: {
                type: 'postback',
                label: '通常モードに戻る',
                data: 'action=exit_record_mode'
              }
            }
          ]
        }
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
    
    // 画像URLを取得（一時保存時に既にStorageに保存済み）
    let imageUrl = tempData.imageUrl || null;
    console.log('🖼️ 画像チェック:', {
      hasImageUrl: !!imageUrl,
      imageUrl: imageUrl
    });
    
    // 元のユーザー入力テキストを取得
    const originalText = tempData.originalText || tempData.analysis.displayName || tempData.analysis.foodItems?.[0] || tempData.analysis.meals?.[0]?.name || '食事';
    const flexMessage = createMealFlexMessage(mealTypeJa, tempData.analysis, imageUrl, originalText);
    
    // 直接保存（画像URLを使用）
    await saveMealDirectly(userId, mealType, tempData.analysis, imageUrl);
    
    // pushMessageでFlexメッセージ送信（クイックリプライ付き）
    const messageWithQuickReply = {
      ...flexMessage,
      quickReply: getRecordModeQuickReply()
    };
    await pushMessage(userId, [messageWithQuickReply]);
    
    // 記録完了
    
    // ローディング停止
    await stopLoadingAnimation(userId);
    
    console.log('🔥 食事保存完了');
    
  } catch (error) {
    console.error('🔥 食事保存エラー:', error);
    await stopLoadingAnimation(userId);
    await pushMessage(userId, [{
      type: 'text',
      text: '保存中にエラーが発生しました。もう一度お試しください。',
      quickReply: getRecordModeQuickReply()
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

// 簡単な一時保存関数（画像はFirebase Storageに保存）
async function storeTempMealAnalysis(userId: string, mealAnalysis: any, imageContent?: Buffer, originalText?: string) {
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
      // adviceは意図的に除外
    };
    
    let imageUrl = null;
    
    // 画像がある場合はFirebase Storageに保存（Firestoreドキュメントサイズ削減）
    if (imageContent) {
      try {
        const tempImageId = generateId();
        const clientStorage = storage;
        const storageRef = ref(clientStorage, `temp_meals/${userId}/${tempImageId}.jpg`);
        
        const snapshot = await uploadBytes(storageRef, imageContent, {
          contentType: 'image/jpeg'
        });
        
        imageUrl = await getDownloadURL(snapshot.ref);
        console.log('✅ 一時画像アップロード成功:', imageUrl);
      } catch (uploadError) {
        console.error('❌ 一時画像アップロード失敗:', uploadError);
        // 画像アップロードに失敗してもテキストデータは保存継続
      }
    }
    
    const db = admin.firestore();
    await db.collection('users').doc(userId).collection('tempMealData').doc('current').set({
      analysis: cleanAnalysis,
      imageUrl: imageUrl, // base64ではなくURLで保存
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
        imageUrl: data.imageUrl || null, // URLで取得
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
      const calculationDuration = duration || 30;
      const caloriesBurned = Math.round((mets * userWeight * calculationDuration) / 60);
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
      quickReply: getRecordModeQuickReply()
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
    
    // カロリー計算（時間がない場合は30分でカロリー計算、表示は「時間なし」）
    const userWeight = await getUserWeight(userId) || 70;
    const mets = EXERCISE_METS[exerciseName] || getDefaultMETs(exerciseType);
    const calculationDuration = duration || 30; // カロリー計算用
    const caloriesBurned = Math.round((mets * userWeight * calculationDuration) / 60);
    
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
    
    // 成功メッセージ（セット追加の場合は更新されたカロリーを表示）
    const timeText = duration && duration > 0 ? `${duration}分` : '時間なし';
    const displayCalories = existingExerciseIndex !== -1 ? 
      existingExercises[existingExerciseIndex].calories : caloriesBurned;
    const actionText = existingExerciseIndex !== -1 ? 'セットを追加しました！' : 'を記録しました！';
    const responseText = `🏃‍♂️ ${exerciseName}${actionText}\n\n⏱️ 時間: ${timeText}\n🔥 推定消費カロリー: ${displayCalories}kcal\n\nお疲れさまでした！💪`;
    
    // 記録モードかどうかでクイックリプライを制御
    const isInRecordMode = await isRecordMode(userId);
    const message: any = {
      type: 'text',
      text: responseText
    };
    
    // 記録モードの場合のみクイックリプライを追加
    if (isInRecordMode) {
      message.quickReply = getRecordModeQuickReply();
    }
    
    await replyMessage(replyToken, [message]);
    
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
    const caloriesBurned = Math.round((mets * userWeight * duration) / 60);
    
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
      text: responseText,
      quickReply: {
        items: [
          {
            type: 'action',
            action: {
              type: 'postback',
              label: 'テキストで記録',
              data: 'action=open_keyboard',
              inputOption: 'openKeyboard'
            }
          },
          {
            type: 'action',
            action: {
              type: 'postback',
              label: '通常モードに戻る',
              data: 'action=exit_record_mode'
            }
          }
        ]
      }
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
    const caloriesBurned = Math.round((baseMets * userWeight * estimatedDuration) / 60);
    
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
    
    // 詳細な成功メッセージ
    const setsInfo = sets.map((set, index) => 
      `${index + 1}セット目: ${set.weight}kg × ${set.reps}回`
    ).join('\n');
    
    const responseText = `💪 ${exerciseName}を記録しました！\n\n📊 詳細:\n${setsInfo}\n\n📈 統計:\n・総セット数: ${totalSets}セット\n・総回数: ${exerciseData.totalReps}回\n・平均重量: ${exerciseData.avgWeight}kg\n・推定時間: ${estimatedDuration}分\n🔥 推定消費カロリー: ${caloriesBurned}kcal\n\n段階的な重量アップ、素晴らしいトレーニングです！💪`;
    
    await replyMessage(replyToken, [{
      type: 'text',
      text: responseText,
      quickReply: {
        items: [
          {
            type: 'action',
            action: {
              type: 'text',
              label: 'テキストで記録'
            }
          },
          {
            type: 'action',
            action: {
              type: 'text',
              label: 'カメラで記録'
            }
          },
          {
            type: 'action',
            action: {
              type: 'text',
              label: '通常モード'
            }
          }
        ]
      }
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
    const caloriesBurned = Math.round((baseMets * userWeight * estimatedDuration) / 60);
    
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
    
    await replyMessage(replyToken, [{
      type: 'text',
      text: `${exerciseName} ${weight}kg ${reps}回 ${sets}セット を記録したよ！\n推定時間: ${estimatedDuration}分\n消費カロリー: ${caloriesBurned}kcal`,
      quickReply: {
        items: [
          {
            type: 'action',
            action: {
              type: 'postback',
              label: 'テキストで記録',
              data: 'action=open_keyboard',
              inputOption: 'openKeyboard'
            }
          },
          {
            type: 'action',
            action: {
              type: 'postback',
              label: '通常モードに戻る',
              data: 'action=exit_record_mode'
            }
          }
        ]
      }
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
    const calculationDuration = duration || 30;
    const caloriesBurned = Math.round((mets * userWeight * calculationDuration) / 60);
    
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
      quickReply: getRecordModeQuickReply()
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
      quickReply: getRecordModeQuickReply()
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
      const calculationDuration = duration || 30;
      const caloriesBurned = Math.round((mets * userWeight * calculationDuration) / 60);
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
      
      // 最後のメッセージにのみクイックリプライを追加
      if (i === addedExercises.length - 1) {
        messages.push({
          ...flexMessage,
          quickReply: getRecordModeQuickReply()
        });
      } else {
        messages.push(flexMessage);
      }
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
      quickReply: getRecordModeQuickReply()
    }]);
  }
}

// シンプルな運動記録処理（無効化 - 新しいAI分析システムを使用）
// async function handleSimpleExerciseRecord(userId: string, type: string, exerciseName: string, duration: number, replyToken: string) {
//   try {
//     const userWeight = await getUserWeight(userId) || 70;
//     const mets = EXERCISE_METS[exerciseName] || 5.0;
//     const caloriesBurned = Math.round((mets * userWeight * duration) / 60);
//     
//     const exerciseRecord = {
//       id: generateId(),
//       name: exerciseName,
//       type: type === '有酸素運動' ? 'cardio' : 'strength',
//       duration: duration,
//       calories: caloriesBurned,
//       intensity: 'medium',
//       notes: `LINE記録 ${new Date().toLocaleTimeString('ja-JP', { timeZone: 'Asia/Tokyo' })}`,
//       timestamp: new Date(),
//       time: new Date().toLocaleTimeString('ja-JP', { 
//         hour: '2-digit', 
//         minute: '2-digit',
//         timeZone: 'Asia/Tokyo'
//       })
//     };
//     
//     // Firestoreに保存
//     const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' });
//     const db = admin.firestore();
//     const recordRef = db.collection('users').doc(userId).collection('dailyRecords').doc(today);
//     const recordDoc = await recordRef.get();
//     const existingData = recordDoc.exists ? recordDoc.data() : {};
//     const existingExercises = existingData.exercises || [];
//     
//     const updatedExercises = [...existingExercises, exerciseRecord];
//     
//     await recordRef.set({
//       ...existingData,
//       exercises: updatedExercises,
//       date: today,
//       lineUserId: userId,
//       updatedAt: new Date()
//     }, { merge: true });
//     
//     await replyMessage(replyToken, [{
//       type: 'text',
//       text: `🏃‍♂️ ${exerciseName} ${duration}分を記録しました！\n\n🔥 推定消費カロリー: ${caloriesBurned}kcal\n\nお疲れさまでした！💪`
//     }]);
//     
//   } catch (error) {
//     console.error('シンプル運動記録エラー:', error);
//     await replyMessage(replyToken, [{
//       type: 'text',
//       text: '運動記録でエラーが発生しました。もう一度お試しください。'
//     }]);
//   }
// }

// 運動詳細の確認（無効化 - 新しいAI分析システムを使用）
// async function askForExerciseDetails(replyToken: string, originalText: string) {
//   await replyMessage(replyToken, [{
//     type: 'text',
//     text: `運動を記録しますか？\n具体的な運動名と時間を教えてください。\n\n例：「ランニング30分」「ベンチプレス 50kg 10回 3セット」`,
//     quickReply: {
//       items: [
//         { type: 'action', action: { type: 'postback', label: 'ランニング30分', data: 'action=exercise_running_30' }},
//         { type: 'action', action: { type: 'postback', label: '筋トレ45分', data: 'action=exercise_strength_45' }},
//         { type: 'action', action: { type: 'postback', label: 'ウォーキング20分', data: 'action=exercise_walking_20' }},
//         { type: 'action', action: { type: 'postback', label: '記録しない', data: 'action=cancel_record' }}
//       ]
//     }
//   }]);
// }

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
}// 記録メニューを表示
async function showRecordMenu(replyToken: string) {
  const recordMessage = {
    type: 'text',
    text: '記録モードです！\n\n食事 体重 運動記録してね！',
    quickReply: {
      items: [
        {
          type: 'action',
          action: {
            type: 'postback',
            label: 'テキストで記録',
            data: 'action=open_keyboard',
            inputOption: 'openKeyboard'
          }
        },
        {
          type: 'action',
          action: {
            type: 'camera',
            label: 'カメラで記録'
          }
        },
        {
          type: 'action',
          action: {
            type: 'postback',
            label: '記録をやめる',
            data: 'action=cancel_record'
          }
        }
      ]
    }
  };

  await replyMessage(replyToken, [recordMessage]);
}

// AIアドバイスモードを開始
async function startAIAdviceMode(replyToken: string, userId: string) {
  // AIアドバイスモードのフラグを設定（セッション管理）
  await setAIAdviceMode(userId, true);
  
  const adviceMessage = {
    type: 'flex',
    altText: '🤖 AIアドバイスモード',
    contents: {
      type: 'bubble',
      header: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: '🤖 AIアドバイスモード',
            weight: 'bold',
            size: 'lg',
            color: '#ffffff'
          }
        ],
        backgroundColor: '#9C27B0',
        paddingAll: 'md'
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: 'こたくんプロ版になりました！',
            weight: 'bold',
            size: 'md',
            margin: 'md'
          },
          {
            type: 'text',
            text: '詳細な健康相談・専門的なアドバイスができます',
            size: 'sm',
            color: '#666666',
            wrap: true,
            margin: 'sm'
          },
          {
            type: 'separator',
            margin: 'md'
          },
          {
            type: 'text',
            text: '✨ 利用できる機能',
            weight: 'bold',
            margin: 'md'
          },
          {
            type: 'text',
            text: '• 栄養バランスの詳細分析\n• 運動プログラムの提案\n• 生活習慣の改善案\n• 個別化された健康アドバイス',
            size: 'sm',
            color: '#333333',
            wrap: true,
            margin: 'sm'
          },
          {
            type: 'text',
            text: 'お気軽にご相談ください！',
            size: 'sm',
            color: '#9C27B0',
            margin: 'md',
            weight: 'bold'
          },
          {
            type: 'text',
            text: '※記録機能は無効になります\n※10分で自動終了します',
            size: 'xs',
            color: '#999999',
            margin: 'md'
          }
        ]
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'button',
            action: {
              type: 'postback',
              label: '通常モードに戻る',
              data: 'action=exit_ai_advice'
            },
            style: 'secondary',
            color: '#666666'
          }
        ]
      }
    }
  };

  await replyMessage(replyToken, [adviceMessage]);
}

// 記録モード開始
async function startRecordMode(replyToken: string, userId: string) {
  const flexBuildStart = Date.now();
  const recordMessage = {
    type: 'flex',
    altText: '記録モード',
    contents: {
      type: 'bubble',
      header: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: '記録モード',
            weight: 'bold',
            size: 'lg',
            color: '#ffffff'
          }
        ],
        backgroundColor: '#4CAF50',
        paddingAll: 'md'
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: '食事・運動・体重を記録できます',
            weight: 'bold',
            size: 'md'
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
              type: 'postback',
              label: '通常モードに戻る',
              data: 'action=exit_record_mode'
            },
            style: 'secondary'
          }
        ]
      }
    },
    quickReply: {
      items: [
        {
          type: 'action',
          action: {
            type: 'postback',
            label: 'テキストで記録',
            data: 'action=open_keyboard',
            inputOption: 'openKeyboard'
          }
        },
        {
          type: 'action',
          action: {
            type: 'camera',
            label: 'カメラで記録'
          }
        }
      ]
    }
  };
  
  const flexBuildEnd = Date.now();
  console.log('🏗️ Flexメッセージ構築時間:', `${flexBuildEnd - flexBuildStart}ms`);
  
  const apiCallStart = Date.now();
  await replyMessage(replyToken, [recordMessage]);
  const apiCallEnd = Date.now();
  
  console.log('📡 LINE API呼び出し時間:', `${apiCallEnd - apiCallStart}ms`);
  console.log('📊 記録モード開始総時間:', `${apiCallEnd - flexBuildStart}ms`);
}

// AIアドバイスモードの設定（タイムアウト付きセッション管理）
const aiAdviceModeUsers = new Map<string, number>();
const AI_ADVICE_TIMEOUT = 10 * 60 * 1000; // 10分でタイムアウト

// 記録モードの設定（Firestoreベース + メモリキャッシュ）
const recordModeUsers = new Map<string, number>();
// タイムアウト制限を削除（ユーザーが手動で終了するまで継続）

async function setAIAdviceMode(userId: string, enabled: boolean) {
  if (enabled) {
    aiAdviceModeUsers.set(userId, Date.now());
    console.log(`🤖 AIアドバイスモード開始: ${userId}`);
  } else {
    aiAdviceModeUsers.delete(userId);
    console.log(`⏹️ AIアドバイスモード終了: ${userId}`);
  }
}

async function isAIAdviceMode(userId: string): Promise<boolean> {
  const startTime = aiAdviceModeUsers.get(userId);
  
  if (!startTime) {
    return false; // モードが設定されていない
  }
  
  const elapsed = Date.now() - startTime;
  
  if (elapsed > AI_ADVICE_TIMEOUT) {
    // タイムアウト：自動的に通常モードに戻す
    aiAdviceModeUsers.delete(userId);
    console.log(`⏰ AIアドバイスモード タイムアウト (${Math.round(elapsed/1000/60)}分経過): ${userId}`);
    return false;
  }
  
  // まだ有効：時間を更新
  aiAdviceModeUsers.set(userId, Date.now());
  return true;
}

// 記録モード管理関数（Firestoreベース + メモリキャッシュ）
async function setRecordMode(userId: string, enabled: boolean) {
  try {
    const db = admin.firestore();
    const userStateRef = db.collection('userStates').doc(userId);
    
    if (enabled) {
      // Firestoreに保存
      await userStateRef.set({
        recordMode: true,
        recordModeStartedAt: new Date(),
        lastUpdated: new Date()
      }, { merge: true });
      
      // メモリキャッシュにも保存
      recordModeUsers.set(userId, Date.now());
      console.log(`📝 記録モード開始: ${userId}`, {
        timestamp: new Date().toISOString(),
        recordModeUsersSize: recordModeUsers.size,
        isNowSet: recordModeUsers.has(userId),
        firestoreSaved: true
      });
    } else {
      // Firestoreから削除
      await userStateRef.set({
        recordMode: false,
        recordModeEndedAt: new Date(),
        lastUpdated: new Date()
      }, { merge: true });
      
      // メモリキャッシュからも削除
      recordModeUsers.delete(userId);
      console.log(`⏹️ 記録モード終了: ${userId}`, {
        timestamp: new Date().toISOString(),
        recordModeUsersSize: recordModeUsers.size,
        isNowDeleted: !recordModeUsers.has(userId),
        firestoreUpdated: true
      });
    }
  } catch (error) {
    console.error('記録モード状態管理エラー:', error);
    // フォールバック：メモリのみ
    if (enabled) {
      recordModeUsers.set(userId, Date.now());
    } else {
      recordModeUsers.delete(userId);
    }
  }
}

async function isRecordMode(userId: string): Promise<boolean> {
  try {
    // まずメモリキャッシュをチェック
    const hasInMemory = recordModeUsers.has(userId);
    
    // Firestoreからも確認（サーバー再起動対応）
    const db = admin.firestore();
    const userStateDoc = await db.collection('userStates').doc(userId).get();
    const firestoreState = userStateDoc.exists ? userStateDoc.data()?.recordMode : false;
    
    console.log('🔍 記録モード状態確認:', { 
      userId, 
      hasInMemory, 
      firestoreState,
      finalResult: hasInMemory || firestoreState
    });
    
    // どちらかがtrueなら記録モード中
    if (firestoreState && !hasInMemory) {
      // Firestoreにはあるがメモリにない場合、メモリにも復元
      recordModeUsers.set(userId, Date.now());
      console.log('🔄 記録モード状態をメモリに復元:', userId);
    }
    
    return hasInMemory || firestoreState;
  } catch (error) {
    console.error('記録モード状態確認エラー:', error);
    // エラー時はメモリキャッシュのみ使用
    return recordModeUsers.has(userId);
  }
}// 複数食事時間の記録処理
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
    
    // 複数食事時間用のFlexメッセージを作成・送信
    const flexMessage = createMultipleMealTimesFlexMessage(mealData);
    
    // クイックリプライ付きでFlexメッセージ送信
    const messageWithQuickReply = {
      ...flexMessage,
      quickReply: getRecordModeQuickReply()
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
      quickReply: getRecordModeQuickReply()
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
      
      // フィードバックメッセージを送信
      await replyMessage(replyToken, [{
        type: 'text',
        text: result.feedback
      }]);
      
      console.log('✅ 1日フィードバック送信完了:', userId);
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