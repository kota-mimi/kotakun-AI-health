import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { FirestoreService } from '@/services/firestoreService';
import AIHealthService from '@/services/aiService';
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { admin } from '@/lib/firebase-admin';
import { createMealFlexMessage } from './new_flex_message';
import { generateId } from '@/lib/utils';

// リトライ機能付き操作実行
async function retryOperation<T>(
  operation: () => Promise<T>,
  operationType: string,
  context: Record<string, any>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 ${operationType} 実行 (試行 ${attempt}/${maxRetries})`, context);
      const result = await operation();
      
      if (attempt > 1) {
        console.log(`✅ ${operationType} 成功 (試行 ${attempt}回目で成功)`, context);
      }
      
      return result;
    } catch (error) {
      lastError = error;
      console.error(`❌ ${operationType} 失敗 (試行 ${attempt}/${maxRetries}):`, {
        error: error.message,
        context,
        stack: error.stack
      });
      
      if (attempt < maxRetries) {
        const delay = delayMs * attempt; // exponential backoff
        console.log(`⏳ ${delay}ms 待機後にリトライします...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  console.error(`💥 ${operationType} 最終的に失敗:`, {
    maxRetries,
    context,
    finalError: lastError.message
  });
  throw lastError;
}

// 食事データベース
const FOOD_DATABASE = {
  // 主食類
  'ご飯': { calories: 356, protein: 6.1, fat: 0.9, carbs: 77.6 },
  '白米': { calories: 356, protein: 6.1, fat: 0.9, carbs: 77.6 },
  '玄米': { calories: 350, protein: 6.8, fat: 2.7, carbs: 71.8 },
  'パン': { calories: 264, protein: 9.3, fat: 4.4, carbs: 46.7 },
  '食パン': { calories: 264, protein: 9.3, fat: 4.4, carbs: 46.7 },
  'うどん': { calories: 270, protein: 6.8, fat: 1.0, carbs: 55.6 },
  'そば': { calories: 296, protein: 12.0, fat: 1.9, carbs: 57.0 },
  'そうめん': { calories: 356, protein: 9.5, fat: 1.1, carbs: 72.7 },
  'パスタ': { calories: 378, protein: 13.0, fat: 2.9, carbs: 72.2 },
  'ラーメン': { calories: 436, protein: 15.4, fat: 7.8, carbs: 69.7 },
  'おにぎり': { calories: 179, protein: 2.7, fat: 0.3, carbs: 39.4 },
  
  // 肉類
  '鶏肉': { calories: 200, protein: 16.2, fat: 14.0, carbs: 0.0 },
  '鶏胸肉': { calories: 108, protein: 22.3, fat: 1.5, carbs: 0.0 },
  '鶏もも肉': { calories: 200, protein: 16.2, fat: 14.0, carbs: 0.0 },
  '豚肉': { calories: 263, protein: 17.1, fat: 21.2, carbs: 0.2 },
  '牛肉': { calories: 259, protein: 17.1, fat: 20.7, carbs: 0.3 },
  'ハンバーグ': { calories: 223, protein: 13.3, fat: 15.8, carbs: 7.5 },
  '唐揚げ': { calories: 290, protein: 16.6, fat: 21.1, carbs: 6.9 },
  'から揚げ': { calories: 290, protein: 16.6, fat: 21.1, carbs: 6.9 },
  '焼き鳥': { calories: 199, protein: 18.1, fat: 12.2, carbs: 0.1 },
  'とんかつ': { calories: 344, protein: 22.3, fat: 23.4, carbs: 10.8 },
  '生姜焼き': { calories: 330, protein: 17.0, fat: 26.1, carbs: 3.9 },
  
  // 魚類
  '鮭': { calories: 133, protein: 22.3, fat: 4.1, carbs: 0.1 },
  'さば': { calories: 202, protein: 20.7, fat: 12.1, carbs: 0.3 },
  'まぐろ': { calories: 125, protein: 26.4, fat: 1.4, carbs: 0.1 },
  '刺身': { calories: 125, protein: 26.4, fat: 1.4, carbs: 0.1 },
  '焼き魚': { calories: 133, protein: 22.3, fat: 4.1, carbs: 0.1 },
  '煮魚': { calories: 108, protein: 22.3, fat: 1.5, carbs: 2.0 },
  
  // 卵・乳製品
  '卵': { calories: 151, protein: 12.3, fat: 10.3, carbs: 0.3 },
  'ゆで卵': { calories: 151, protein: 12.3, fat: 10.3, carbs: 0.3 },
  '目玉焼き': { calories: 182, protein: 12.8, fat: 13.4, carbs: 0.5 },
  'チーズ': { calories: 339, protein: 25.7, fat: 26.0, carbs: 1.3 },
  'ヨーグルト': { calories: 62, protein: 3.6, fat: 3.0, carbs: 4.9 },
  
  // 野菜・サラダ
  'サラダ': { calories: 21, protein: 1.0, fat: 0.1, carbs: 3.6 },
  'キャベツ': { calories: 23, protein: 1.3, fat: 0.2, carbs: 5.2 },
  'レタス': { calories: 12, protein: 0.6, fat: 0.1, carbs: 2.8 },
  'トマト': { calories: 19, protein: 0.7, fat: 0.1, carbs: 4.7 },
  'きゅうり': { calories: 14, protein: 1.0, fat: 0.1, carbs: 3.0 },
  'にんじん': { calories: 39, protein: 0.8, fat: 0.2, carbs: 9.3 },
  'ブロッコリー': { calories: 33, protein: 4.3, fat: 0.5, carbs: 5.2 },
  
  // 定食・丼物
  '牛丼': { calories: 656, protein: 19.9, fat: 21.8, carbs: 93.9 },
  '親子丼': { calories: 731, protein: 23.8, fat: 21.0, carbs: 104.9 },
  'カツ丼': { calories: 893, protein: 29.4, fat: 28.1, carbs: 130.4 },
  '天丼': { calories: 804, protein: 20.7, fat: 22.9, carbs: 123.8 },
  '海鮮丼': { calories: 543, protein: 24.8, fat: 4.2, carbs: 96.3 },
  'チャーハン': { calories: 708, protein: 15.8, fat: 20.3, carbs: 111.9 },
  'オムライス': { calories: 670, protein: 13.8, fat: 22.4, carbs: 100.2 },
  
  // カレー・シチュー
  'カレー': { calories: 859, protein: 16.7, fat: 24.5, carbs: 140.1 },
  'ビーフカレー': { calories: 859, protein: 16.7, fat: 24.5, carbs: 140.1 },
  'チキンカレー': { calories: 545, protein: 19.5, fat: 14.1, carbs: 79.8 },
  'カレーライス': { calories: 859, protein: 16.7, fat: 24.5, carbs: 140.1 },
  'シチュー': { calories: 218, protein: 6.6, fat: 11.5, carbs: 21.0 },
  'ハヤシライス': { calories: 713, protein: 14.4, fat: 18.7, carbs: 118.5 },
  
  // 麺類
  'ざるそば': { calories: 296, protein: 12.0, fat: 1.9, carbs: 57.0 },
  'かけうどん': { calories: 270, protein: 6.8, fat: 1.0, carbs: 55.6 },
  'きつねうどん': { calories: 386, protein: 12.6, fat: 4.1, carbs: 75.7 },
  'カルボナーラ': { calories: 779, protein: 21.8, fat: 44.9, carbs: 67.8 },
  'ナポリタン': { calories: 571, protein: 16.4, fat: 16.2, carbs: 83.7 },
  'ペペロンチーノ': { calories: 507, protein: 13.0, fat: 19.7, carbs: 66.9 },
  '焼きそば': { calories: 593, protein: 13.2, fat: 25.9, carbs: 77.5 },
  
  // 揚げ物
  '天ぷら': { calories: 174, protein: 7.3, fat: 10.5, carbs: 11.2 },
  'エビフライ': { calories: 210, protein: 12.5, fat: 11.2, carbs: 14.2 },
  'コロッケ': { calories: 164, protein: 3.8, fat: 9.8, carbs: 15.8 },
  'メンチカツ': { calories: 273, protein: 10.4, fat: 19.8, carbs: 12.8 },
  'チキンカツ': { calories: 344, protein: 22.3, fat: 23.4, carbs: 10.8 },
  
  // スープ・汁物
  '味噌汁': { calories: 34, protein: 2.2, fat: 1.2, carbs: 3.8 },
  'お味噌汁': { calories: 34, protein: 2.2, fat: 1.2, carbs: 3.8 },
  'すまし汁': { calories: 8, protein: 1.4, fat: 0.0, carbs: 0.8 },
  'わかめスープ': { calories: 11, protein: 0.7, fat: 0.1, carbs: 2.0 },
  'コンソメスープ': { calories: 37, protein: 1.4, fat: 1.2, carbs: 5.1 },
  
  // 洋食
  'ハンバーガー': { calories: 524, protein: 19.5, fat: 26.8, carbs: 51.6 },
  'チーズバーガー': { calories: 598, protein: 25.4, fat: 33.1, carbs: 52.8 },
  'ピザ': { calories: 268, protein: 10.1, fat: 11.5, carbs: 31.4 },
  'サンドイッチ': { calories: 177, protein: 7.4, fat: 6.7, carbs: 22.3 },
  'オムレツ': { calories: 182, protein: 12.8, fat: 13.4, carbs: 0.5 },
  'ステーキ': { calories: 259, protein: 17.1, fat: 20.7, carbs: 0.3 },
  
  // 中華
  '餃子': { calories: 46, protein: 2.2, fat: 2.4, carbs: 4.4 },
  'ギョーザ': { calories: 46, protein: 2.2, fat: 2.4, carbs: 4.4 },
  '麻婆豆腐': { calories: 195, protein: 14.6, fat: 12.3, carbs: 6.8 },
  '青椒肉絲': { calories: 228, protein: 14.9, fat: 15.4, carbs: 8.3 },
  '酢豚': { calories: 274, protein: 11.8, fat: 16.8, carbs: 20.3 },
  'エビチリ': { calories: 210, protein: 12.5, fat: 11.2, carbs: 14.2 },
  '春巻き': { calories: 124, protein: 4.6, fat: 6.2, carbs: 12.8 },
  
  // 和食
  '肉じゃが': { calories: 176, protein: 9.8, fat: 6.8, carbs: 19.2 },
  '筑前煮': { calories: 96, protein: 6.8, fat: 3.2, carbs: 10.4 },
  'きんぴらごぼう': { calories: 94, protein: 2.1, fat: 3.8, carbs: 13.6 },
  '煮物': { calories: 96, protein: 6.8, fat: 3.2, carbs: 10.4 },
  'ひじきの煮物': { calories: 84, protein: 3.2, fat: 2.8, carbs: 12.4 },
  '冷奴': { calories: 56, protein: 4.9, fat: 3.0, carbs: 1.6 },
  'おでん': { calories: 13, protein: 1.1, fat: 0.1, carbs: 2.5 },
  
  // デザート・間食
  'アイス': { calories: 180, protein: 3.2, fat: 8.0, carbs: 23.2 },
  'アイスクリーム': { calories: 180, protein: 3.2, fat: 8.0, carbs: 23.2 },
  'ケーキ': { calories: 308, protein: 4.9, fat: 20.6, carbs: 26.1 },
  'クッキー': { calories: 432, protein: 6.9, fat: 17.2, carbs: 62.6 },
  'チョコレート': { calories: 558, protein: 7.3, fat: 34.1, carbs: 51.9 },
  'バナナ': { calories: 86, protein: 1.1, fat: 0.2, carbs: 22.5 },
  'りんご': { calories: 54, protein: 0.2, fat: 0.1, carbs: 14.6 },
  'みかん': { calories: 45, protein: 0.7, fat: 0.1, carbs: 11.0 },
  'ポテトチップス': { calories: 554, protein: 4.7, fat: 35.2, carbs: 54.7 },
  'ポップコーン': { calories: 484, protein: 10.2, fat: 22.8, carbs: 57.8 },
  'せんべい': { calories: 373, protein: 8.1, fat: 2.5, carbs: 83.1 },
  'おかき': { calories: 381, protein: 7.2, fat: 3.1, carbs: 82.8 },
  'グミ': { calories: 341, protein: 6.9, fat: 0.1, carbs: 83.6 },
  'キャンディ': { calories: 390, protein: 0.0, fat: 0.2, carbs: 97.5 },
  'マシュマロ': { calories: 326, protein: 4.5, fat: 0.2, carbs: 79.3 },
  'ドーナツ': { calories: 375, protein: 6.1, fat: 20.5, carbs: 42.2 },
  
  // 果物追加
  'いちご': { calories: 34, protein: 0.9, fat: 0.1, carbs: 8.5 },
  'ぶどう': { calories: 59, protein: 0.4, fat: 0.2, carbs: 15.2 },
  'もも': { calories: 40, protein: 0.6, fat: 0.1, carbs: 10.2 },
  'パイナップル': { calories: 51, protein: 0.6, fat: 0.1, carbs: 13.4 },
  'メロン': { calories: 42, protein: 1.0, fat: 0.1, carbs: 10.3 },
  'スイカ': { calories: 37, protein: 0.6, fat: 0.1, carbs: 9.5 },
  'キウイ': { calories: 53, protein: 1.0, fat: 0.1, carbs: 13.5 },
  'オレンジ': { calories: 39, protein: 0.9, fat: 0.1, carbs: 10.4 },
  'レモン': { calories: 54, protein: 0.9, fat: 0.7, carbs: 8.6 },
  
  // 飲み物
  'コーヒー': { calories: 4, protein: 0.2, fat: 0.0, carbs: 0.7 },
  'お茶': { calories: 0, protein: 0.0, fat: 0.0, carbs: 0.1 },
  '緑茶': { calories: 0, protein: 0.0, fat: 0.0, carbs: 0.1 },
  '紅茶': { calories: 1, protein: 0.1, fat: 0.0, carbs: 0.3 },
  'ウーロン茶': { calories: 0, protein: 0.0, fat: 0.0, carbs: 0.1 },
  'コーラ': { calories: 46, protein: 0.0, fat: 0.0, carbs: 11.4 },
  'ジュース': { calories: 41, protein: 0.2, fat: 0.1, carbs: 10.2 },
  'オレンジジュース': { calories: 41, protein: 0.2, fat: 0.1, carbs: 10.2 },
  'りんごジュース': { calories: 44, protein: 0.1, fat: 0.1, carbs: 11.8 },
  'ビール': { calories: 40, protein: 0.3, fat: 0.0, carbs: 3.1 },
  '牛乳': { calories: 67, protein: 3.3, fat: 3.8, carbs: 4.8 },
  '豆乳': { calories: 46, protein: 3.6, fat: 2.0, carbs: 2.9 },
  
  // パン類追加
  'クロワッサン': { calories: 448, protein: 7.9, fat: 26.8, carbs: 43.9 },
  'メロンパン': { calories: 350, protein: 6.8, fat: 13.1, carbs: 52.2 },
  'カレーパン': { calories: 321, protein: 8.1, fat: 15.2, carbs: 37.8 },
  'あんぱん': { calories: 266, protein: 7.4, fat: 4.2, carbs: 50.8 },
  'クリームパン': { calories: 306, protein: 7.8, fat: 10.5, carbs: 46.2 },
  'ベーグル': { calories: 211, protein: 9.0, fat: 1.7, carbs: 40.9 },
  'フランスパン': { calories: 279, protein: 9.4, fat: 1.3, carbs: 57.5 },
  
  // ファストフード
  'フライドポテト': { calories: 237, protein: 3.0, fat: 11.3, carbs: 31.2 },
  'ポテトフライ': { calories: 237, protein: 3.0, fat: 11.3, carbs: 31.2 },
  'チキンナゲット': { calories: 245, protein: 15.5, fat: 15.7, carbs: 9.9 },
  'フィッシュバーガー': { calories: 341, protein: 15.0, fat: 17.7, carbs: 32.0 },
  'ホットドッグ': { calories: 290, protein: 10.4, fat: 18.0, carbs: 24.0 },
  'タコス': { calories: 226, protein: 9.4, fat: 10.8, carbs: 25.7 },
  
  // ご飯もの追加
  'チキンライス': { calories: 708, protein: 15.8, fat: 20.3, carbs: 111.9 },
  '鮭おにぎり': { calories: 179, protein: 6.0, fat: 2.0, carbs: 35.0 },
  'ツナおにぎり': { calories: 185, protein: 7.2, fat: 3.8, carbs: 32.1 },
  '梅おにぎり': { calories: 171, protein: 2.8, fat: 0.4, carbs: 38.7 },
  '赤飯': { calories: 189, protein: 3.9, fat: 1.3, carbs: 40.7 },
  'ちらし寿司': { calories: 231, protein: 9.6, fat: 2.4, carbs: 42.8 },
  '手巻き寿司': { calories: 143, protein: 6.2, fat: 0.5, carbs: 27.4 },
  
  // その他の料理
  'お好み焼き': { calories: 545, protein: 17.0, fat: 30.8, carbs: 50.1 },
  'たこ焼き': { calories: 417, protein: 12.3, fat: 20.5, carbs: 46.8 },
  '焼きうどん': { calories: 594, protein: 13.0, fat: 26.1, carbs: 77.8 },
  'おかゆ': { calories: 71, protein: 1.2, fat: 0.2, carbs: 15.6 },
  '茶碗蒸し': { calories: 79, protein: 6.4, fat: 4.1, carbs: 4.2 },
  'だし巻き卵': { calories: 128, protein: 8.8, fat: 8.8, carbs: 2.6 },
  'かぼちゃの煮物': { calories: 93, protein: 1.9, fat: 0.3, carbs: 20.6 }
};

// 食事パターンマッチング関数
function findFoodMatch(text: string) {
  // 完全一致をチェック
  if (FOOD_DATABASE[text]) {
    return { food: text, data: FOOD_DATABASE[text], confidence: 'high' };
  }
  
  // 部分一致をチェック
  for (const [foodName, foodData] of Object.entries(FOOD_DATABASE)) {
    if (text.includes(foodName) || foodName.includes(text)) {
      return { food: foodName, data: foodData, confidence: 'medium' };
    }
  }
  
  // より柔軟なマッチング（ひらがな・カタカナ変換なども考慮）
  const normalizedText = text.toLowerCase().replace(/\s/g, '');
  for (const [foodName, foodData] of Object.entries(FOOD_DATABASE)) {
    const normalizedFood = foodName.toLowerCase().replace(/\s/g, '');
    if (normalizedText.includes(normalizedFood) || normalizedFood.includes(normalizedText)) {
      return { food: foodName, data: foodData, confidence: 'low' };
    }
  }
  
  return null;
}

// 学習した食事をパターンマッチングに追加
async function addToFoodDatabase(userId: string, mealName: string, nutritionData: any) {
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
        learnedAt: admin.firestore.FieldValue.serverTimestamp(),
        usageCount: 1
      }
    }, { merge: true });
    
    console.log(`学習済み食事に追加: ${mealName} (ユーザー: ${userId})`);
  } catch (error) {
    console.error('学習済み食事の保存エラー:', error);
  }
}

// ユーザーの学習済み食事も含めて検索
async function findFoodMatchWithLearning(userId: string, text: string) {
  // まず基本データベースから検索
  let match = findFoodMatch(text);
  if (match) {
    return match;
  }
  
  // 学習済みデータベースから検索
  try {
    const db = admin.firestore();
    const userFoodRef = db.collection('learned_foods').doc(userId);
    const userFoodDoc = await userFoodRef.get();
    
    if (userFoodDoc.exists) {
      const learnedFoods = userFoodDoc.data();
      
      // 完全一致をチェック
      if (learnedFoods && learnedFoods[text]) {
        // 使用回数をインクリメント
        await userFoodRef.update({
          [`${text}.usageCount`]: admin.firestore.FieldValue.increment(1),
          [`${text}.lastUsed`]: admin.firestore.FieldValue.serverTimestamp()
        });
        
        return { 
          food: text, 
          data: learnedFoods[text], 
          confidence: 'high',
          isLearned: true 
        };
      }
      
      // 部分一致をチェック
      for (const [foodName, foodData] of Object.entries(learnedFoods)) {
        if (text.includes(foodName) || foodName.includes(text)) {
          // 使用回数をインクリメント
          await userFoodRef.update({
            [`${foodName}.usageCount`]: admin.firestore.FieldValue.increment(1),
            [`${foodName}.lastUsed`]: admin.firestore.FieldValue.serverTimestamp()
          });
          
          return { 
            food: foodName, 
            data: foodData, 
            confidence: 'medium',
            isLearned: true 
          };
        }
      }
    }
  } catch (error) {
    console.error('学習済み食事の検索エラー:', error);
  }
  
  return null;
}

// 複数食事の解析（学習機能付き）
async function analyzeMultipleFoodsWithLearning(userId: string, text: string) {
  const foundFoods = [];
  const words = text.split(/[、。・\s]+/);
  
  for (const word of words) {
    if (word.length >= 2) {
      const match = await findFoodMatchWithLearning(userId, word);
      if (match) {
        foundFoods.push({
          name: match.food,
          ...match.data,
          isLearned: match.isLearned || false
        });
      }
    }
  }
  
  if (foundFoods.length === 0) {
    return null;
  }
  
  // 複数食事の合計計算
  const totalCalories = foundFoods.reduce((sum, food) => sum + food.calories, 0);
  const totalProtein = foundFoods.reduce((sum, food) => sum + food.protein, 0);
  const totalFat = foundFoods.reduce((sum, food) => sum + food.fat, 0);
  const totalCarbs = foundFoods.reduce((sum, food) => sum + food.carbs, 0);
  
  return {
    isMultipleMeals: foundFoods.length > 1,
    meals: foundFoods,
    totalCalories: Math.round(totalCalories),
    totalProtein: Math.round(totalProtein * 10) / 10,
    totalFat: Math.round(totalFat * 10) / 10,
    totalCarbs: Math.round(totalCarbs * 10) / 10,
    calories: foundFoods.length === 1 ? foundFoods[0].calories : Math.round(totalCalories),
    protein: foundFoods.length === 1 ? foundFoods[0].protein : Math.round(totalProtein * 10) / 10,
    fat: foundFoods.length === 1 ? foundFoods[0].fat : Math.round(totalFat * 10) / 10,
    carbs: foundFoods.length === 1 ? foundFoods[0].carbs : Math.round(totalCarbs * 10) / 10,
    foodItems: foundFoods.map(f => f.name),
    hasLearned: foundFoods.some(f => f.isLearned)
  };
}

// 後方互換性のための関数（学習機能なし）
function analyzeMultipleFoods(text: string) {
  const foundFoods = [];
  const words = text.split(/[、。・\s]+/);
  
  for (const word of words) {
    if (word.length >= 2) {
      const match = findFoodMatch(word);
      if (match) {
        foundFoods.push({
          name: match.food,
          ...match.data
        });
      }
    }
  }
  
  if (foundFoods.length === 0) {
    return null;
  }
  
  // 複数食事の合計計算
  const totalCalories = foundFoods.reduce((sum, food) => sum + food.calories, 0);
  const totalProtein = foundFoods.reduce((sum, food) => sum + food.protein, 0);
  const totalFat = foundFoods.reduce((sum, food) => sum + food.fat, 0);
  const totalCarbs = foundFoods.reduce((sum, food) => sum + food.carbs, 0);
  
  return {
    isMultipleMeals: foundFoods.length > 1,
    meals: foundFoods,
    totalCalories: Math.round(totalCalories),
    totalProtein: Math.round(totalProtein * 10) / 10,
    totalFat: Math.round(totalFat * 10) / 10,
    totalCarbs: Math.round(totalCarbs * 10) / 10,
    calories: foundFoods.length === 1 ? foundFoods[0].calories : Math.round(totalCalories),
    protein: foundFoods.length === 1 ? foundFoods[0].protein : Math.round(totalProtein * 10) / 10,
    fat: foundFoods.length === 1 ? foundFoods[0].fat : Math.round(totalFat * 10) / 10,
    carbs: foundFoods.length === 1 ? foundFoods[0].carbs : Math.round(totalCarbs * 10) / 10,
    foodItems: foundFoods.map(f => f.name)
  };
}

// リッチメニューの設定
const RICH_MENU_CONFIG = {
  size: {
    width: 2500,
    height: 843
  },
  selected: false,
  name: "食事記録メニュー",
  chatBarText: "メニュー",
  areas: [
    {
      bounds: {
        x: 0,
        y: 0,
        width: 1250,
        height: 843
      },
      action: {
        type: "message",
        text: "食事を記録したいです"
      }
    },
    {
      bounds: {
        x: 1250,
        y: 0,
        width: 1250,
        height: 843
      },
      action: {
        type: "camera"
      }
    }
  ]
};

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  try {
    console.log('🔥 LINE Webhook呼び出し開始');
    const body = await request.text();
    const signature = request.headers.get('x-line-signature') || '';
    
    console.log('🔥 受信データ:', body.substring(0, 200));
    
    // LINE署名を検証
    if (!verifySignature(body, signature)) {
      console.error('🔥 署名検証失敗:', {
        hasSignature: !!signature,
        hasChannelSecret: !!process.env.LINE_CHANNEL_SECRET,
        bodyLength: body.length
      });
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    console.log('🔥 署名検証成功');
    
    let events;
    try {
      const parsedBody = JSON.parse(body);
      events = parsedBody.events;
      console.log('🔥 イベント数:', events?.length || 0);
    } catch (parseError) {
      console.error('🔥 JSON解析エラー:', parseError);
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    // 各イベントを処理
    const eventResults = [];
    for (const event of events) {
      try {
        await handleEvent(event);
        eventResults.push({ success: true, eventType: event.type });
      } catch (eventError) {
        console.error('🔥 イベント処理エラー:', {
          error: eventError,
          eventType: event.type,
          eventSource: event.source,
          stack: eventError.stack
        });
        eventResults.push({ success: false, eventType: event.type, error: eventError.message });
        
        // イベント処理エラーでもユーザーには適切なメッセージを送信
        if (event.replyToken) {
          try {
            await replyMessage(event.replyToken, [{
              type: 'text',
              text: '申し訳ございません。システムで一時的な問題が発生しました。少し時間をおいて再度お試しください。'
            }]);
          } catch (replyError) {
            console.error('🔥 エラーメッセージ送信失敗:', replyError);
          }
        }
      }
    }

    const processingTime = Date.now() - startTime;
    console.log('🔥 Webhook処理完了:', {
      processingTime: `${processingTime}ms`,
      totalEvents: events.length,
      successCount: eventResults.filter(r => r.success).length,
      errorCount: eventResults.filter(r => !r.success).length
    });

    return NextResponse.json({ 
      status: 'OK',
      processed: events.length,
      processingTime: processingTime
    });
  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error('🔥 致命的なWebhookエラー:', {
      error: error,
      message: error.message,
      stack: error.stack,
      processingTime: `${processingTime}ms`,
      headers: Object.fromEntries(request.headers.entries())
    });
    return NextResponse.json({ 
      error: 'Internal server error',
      processingTime: processingTime
    }, { status: 500 });
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
  
  // ユーザー認証とプロファイル取得
  try {
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
          actions: [
            {
              type: 'uri',
              label: 'アプリに登録する',
              uri: process.env.NEXT_PUBLIC_LIFF_ID ? `https://liff.line.me/${process.env.NEXT_PUBLIC_LIFF_ID}/counseling` : `${process.env.NEXT_PUBLIC_APP_URL}/counseling`
            }
          ]
        }
      }]);
      return;
    }
    
    console.log(`🔥 認証済みユーザー: ${userId}`);
    
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
  } catch (error) {
    console.error('ユーザー認証エラー:', error);
    await replyMessage(replyToken, [{
      type: 'text',
      text: 'システムエラーが発生しました。少し時間をおいて再度お試しください。'
    }]);
  }
}

async function handleTextMessage(replyToken: string, userId: string, text: string, user: any) {
  let responseMessage;

  // クイックリプライボタンからの「食事を記録したいです」への応答
  if (text === '食事を記録したいです') {
    responseMessage = {
      type: 'text',
      text: '何食べた？教えて！\n例：「ラーメン」「鶏の唐揚げと白米」'
    };
    await replyMessage(replyToken, [responseMessage]);
    return;
  }

  // 体重記録の判定（様々なパターンに対応）
  const weightPatterns = [
    /^(\d{1,3}(?:\.\d+)?)\s*(?:kg|キロ|キログラム)?$/,  // 数字のみ、kg、キロ、キログラム
    /^体重\s*(\d{1,3}(?:\.\d+)?)\s*(?:kg|キロ|キログラム)?$/,  // 体重 + 数字
    /^今日の体重\s*(\d{1,3}(?:\.\d+)?)\s*(?:kg|キロ|キログラム)?$/,  // 今日の体重 + 数字
    /^現在の体重\s*(\d{1,3}(?:\.\d+)?)\s*(?:kg|キロ|キログラム)?$/   // 現在の体重 + 数字
  ];
  
  let weightMatch = null;
  for (const pattern of weightPatterns) {
    weightMatch = text.match(pattern);
    if (weightMatch) break;
  }
  
  if (weightMatch) {
    const weight = parseFloat(weightMatch[1]);
    if (weight >= 20 && weight <= 300) { // 妥当な体重範囲
      await recordWeight(userId, weight);
      responseMessage = {
        type: 'text',
        text: `体重 ${weight}kg 記録したよ！`
      };
      await replyMessage(replyToken, [responseMessage]);
      return;
    }
  }

  // 運動記録の判定（パターンマッチング + AI フォールバック）
  const exerciseResult = await handleExerciseMessage(replyToken, userId, text, user);
  if (exerciseResult) {
    return; // 運動記録として処理済み
  }

  // 「記録」ボタンの応答 - シンプル化
  if (text === '記録' || text.includes('記録')) {
    responseMessage = {
      type: 'text',
      text: '何記録する？\n下から選んでね！',
      quickReply: {
        items: [
          {
            type: 'action',
            action: {
              type: 'postback',
              label: '📝 テキストで記録',
              data: 'action=text_record'
            }
          },
          {
            type: 'action',
            action: {
              type: 'postback',
              label: '📷 写真で記録',
              data: 'action=photo_record'
            }
          }
        ]
      }
    };
    await replyMessage(replyToken, [responseMessage]);
    return;
  }

  // 質問文の判定（カロリーや栄養について聞いている）
  const isQuestionMessage = (
    text.includes('？') || text.includes('?') ||
    text.includes('って何') || text.includes('ってなに') ||
    text.includes('どのくらい') || text.includes('どれくらい') ||
    text.includes('教えて') || text.includes('知りたい') ||
    text.includes('カロリー') || text.includes('栄養') ||
    text.includes('太る') || text.includes('痩せる') ||
    text.includes('健康') || text.includes('ダイエット') ||
    /どう|何|なに|いくつ|いくら|なんで|なぜ|いつ|どこ|誰|どっち|どれ/.test(text) ||
    /かな|だっけ|よね|でしょ|ですか|でしょうか/.test(text) ||
    text.includes('気になる') || text.includes('心配') || text.includes('大丈夫') ||
    text.includes('どちらが') || text.includes('どの方が')
  );

  // 質問の場合は直接AI回答
  if (isQuestionMessage) {
    try {
      const aiService = new AIHealthService();
      const aiResponse = await aiService.generateGeneralResponse(text);
      
      responseMessage = {
        type: 'text',
        text: aiResponse || 'ちょっと分からないけど、健康のことならなんでも聞いて！'
      };
      
      await replyMessage(replyToken, [responseMessage]);
      return;
    } catch (error) {
      console.error('質問AI回答エラー:', error);
      responseMessage = {
        type: 'text',
        text: 'ちょっと分からないけど、健康のことならなんでも聞いて！'
      };
      await replyMessage(replyToken, [responseMessage]);
      return;
    }
  }

  // 食事記録の判定（記録する意図が明確な場合のみ）
  const isFoodRecordMessage = (
    // 明確な記録意図のパターン
    /を食べた|食べました|いただきました|摂取|記録/.test(text) ||
    
    // 複数食事（「と」で繋がれている）
    (text.includes('と') && /[ぁ-んァ-ン一-龯]+と[ぁ-んァ-ン一-龯]+/.test(text)) ||
    
    // 単体の食事名のみ（質問要素がない場合）
    (
      // 具体的な料理名
      (/おにぎり|おむすび|弁当|丼|カレー|シチュー|ハンバーグ|コロッケ|唐揚げ|から揚げ|焼き魚|刺身|寿司|天ぷら|フライ|煮物|炒め物|味噌汁|お味噌汁|ラーメン|うどん|そば|パスタ|チャーハン|オムライス/.test(text) ||
       
       // 基本食材（単体で使われる場合）
       /^(パン|ご飯|白米|玄米|サラダ|スープ|卵|チーズ|ヨーグルト)$/.test(text) ||
       
       // ひらがな2-4文字の食べ物（単体）
       /^[あ-ん]{2,4}$/.test(text)) &&
      
      // 質問要素がない
      !(/？|\?|って|どう|何|なに|カロリー|栄養|太る|痩せる|健康|ダイエット|教えて|知りたい/.test(text))
    )
  );

  if (isFoodRecordMessage) {
    
    // 食事内容を一時保存（postbackで使用）
    await storeTempMealData(userId, text);
    
    responseMessage = {
      type: 'text',
      text: `「${text.length > 20 ? text.substring(0, 20) + '...' : text}」だね！\n\nどうする？`,
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

  // その他のメッセージには一般会話AIで応答
  try {
    const aiService = new AIHealthService();
    const aiResponse = await aiService.generateGeneralResponse(text);
    
    responseMessage = {
      type: 'text',
      text: aiResponse || 'すみません、よく分からなかったです。健康管理についてお手伝いできることがあれば、お気軽にお声がけください！'
    };
    
    await replyMessage(replyToken, [responseMessage]);
  } catch (error) {
    console.error('一般会話AI エラー:', error);
    responseMessage = {
      type: 'text',
      text: 'お話ありがとうございます！健康管理についてお手伝いできることがあれば、お気軽にお声がけください！'
    };
    await replyMessage(replyToken, [responseMessage]);
  }
}

async function handleImageMessage(replyToken: string, userId: string, messageId: string, user: any) {
  try {
    // 画像を取得してAI解析
    const imageContent = await getImageContent(messageId);
    if (!imageContent) {
      await replyMessage(replyToken, [{
        type: 'text',
        text: '画像がうまく受け取れなかった！もう一度送ってみて？'
      }]);
      return;
    }

    // 食事画像を一時保存
    await storeTempMealData(userId, '', imageContent);

    const responseMessage = {
      type: 'text',
      text: '美味しそうな写真だね！\nAIで分析する？',
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
      text: '画像の処理でちょっと問題が起きちゃった！もう一度試してみて？'
    }]);
  }
}

async function handleFollow(replyToken: string, source: any) {
  const { userId } = source;
  
  // リッチメニューを作成してユーザーに設定
  const richMenuId = await createRichMenu();
  if (richMenuId) {
    await setRichMenuForUser(userId, richMenuId);
  }
  
  // 新規ユーザーの場合、カウンセリングへ誘導
  const welcomeMessage = {
    type: 'template',
    altText: 'LINE健康管理へようこそ！',
    template: {
      type: 'buttons',
      text: 'LINE健康管理へようこそ！\n\nあなた専用の健康プランを作成しませんか？\n\n下のメニューから食事記録もできます！',
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

// リッチメニューを作成する関数
async function createRichMenu() {
  const accessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  
  if (!accessToken) {
    console.error('LINE_CHANNEL_ACCESS_TOKEN is not set');
    return;
  }

  try {
    // リッチメニューを作成
    const response = await fetch('https://api.line.me/v2/bot/richmenu', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(RICH_MENU_CONFIG),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Failed to create rich menu:', error);
      return null;
    }

    const result = await response.json();
    console.log('Rich menu created:', result.richMenuId);
    return result.richMenuId;
  } catch (error) {
    console.error('Error creating rich menu:', error);
    return null;
  }
}

// ユーザーにリッチメニューを設定する関数
async function setRichMenuForUser(userId: string, richMenuId: string) {
  const accessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  
  if (!accessToken) {
    console.error('LINE_CHANNEL_ACCESS_TOKEN is not set');
    return;
  }

  try {
    const response = await fetch(`https://api.line.me/v2/bot/user/${userId}/richmenu/${richMenuId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Failed to set rich menu for user:', error);
    } else {
      console.log('Rich menu set for user:', userId);
    }
  } catch (error) {
    console.error('Error setting rich menu for user:', error);
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

    case 'text_record':
      await replyMessage(replyToken, [{
        type: 'text',
        text: '📝 テキストで記録してください！\n\n食事内容を文字で入力してください。\n例：「朝食：パンとコーヒー」\n例：「昼食：サラダとパスタ」'
      }]);
      break;

    case 'photo_record':
      await replyMessage(replyToken, [{
        type: 'text',
        text: '📷 写真で記録してください！\n\n食事の写真を撮って送ってください。\nAIが自動で食事内容を分析します。'
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

// 体重記録（リトライ機能付き）
async function recordWeight(userId: string, weight: number) {
  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    await retryOperation(
      async () => {
        const db = admin.firestore();
        const recordRef = db.collection('users').doc(userId).collection('dailyRecords').doc(today);
        
        await recordRef.set({
          weight,
          date: today,
          lineUserId: userId,
          updatedAt: admin.FieldValue.serverTimestamp(),
        }, { merge: true });

        // ユーザープロファイルの体重も更新
        const userRef = db.collection('users').doc(userId);
        const userDoc = await userRef.get();
        if (userDoc.exists) {
          await userRef.update({
            'profile.weight': weight,
            updatedAt: admin.FieldValue.serverTimestamp(),
          });
        }
      },
      'weight_record',
      { userId, weight, date: today }
    );
    
    console.log(`体重記録完了: ${userId}, ${weight}kg`);
  } catch (error) {
    console.error('体重記録最終エラー:', {
      userId,
      weight,
      error: error.message,
      stack: error.stack
    });
    throw error; // 上位のエラーハンドリングに委ねる
  }
}

// 一時的な食事データ保存（Firestore）
async function storeTempMealData(userId: string, text: string, image?: Buffer) {
  try {
    const db = admin.firestore();
    const tempRef = db.collection('temp_meal_data').doc(userId);
    
    await tempRef.set({
      text,
      image: image ? image.toString('base64') : null,
      timestamp: admin.FieldValue.serverTimestamp(),
    });
    
    console.log('一時食事データ保存完了:', userId);
  } catch (error) {
    console.error('一時食事データ保存エラー:', error);
  }
}

// 一時的な食事データ取得（Firestore）
async function getTempMealData(userId: string) {
  try {
    const db = admin.firestore();
    const tempRef = db.collection('temp_meal_data').doc(userId);
    const tempDoc = await tempRef.get();
    
    if (!tempDoc.exists) {
      return null;
    }
    
    const data = tempDoc.data();
    return {
      text: data.text,
      image: data.image ? Buffer.from(data.image, 'base64') : null,
      timestamp: data.timestamp?.toMillis() || Date.now(),
    };
  } catch (error) {
    console.error('一時食事データ取得エラー:', error);
    return null;
  }
}

// 一時的な食事データ削除（Firestore）
async function deleteTempMealData(userId: string) {
  try {
    const db = admin.firestore();
    const tempRef = db.collection('temp_meal_data').doc(userId);
    await tempRef.delete();
    console.log('一時食事データ削除完了:', userId);
  } catch (error) {
    console.error('一時食事データ削除エラー:', error);
  }
}

// 食事内容のAI分析（カロリーのみ）
async function analyzeMealOnly(userId: string, replyToken: string) {
  try {
    const tempData = await getTempMealData(userId);
    if (!tempData) {
      await replyMessage(replyToken, [{
        type: 'text',
        text: 'データが見つかりません。もう一度食事内容を送ってください。'
      }]);
      return;
    }

    let analysis;
    const originalMealName = tempData.text || '食事';

    if (tempData.image) {
      // 画像の場合はAI分析必須
      const aiService = new AIHealthService();
      analysis = await aiService.analyzeMealFromImage(tempData.image);
    } else {
      // テキストの場合は学習機能付きパターンマッチング優先
      analysis = await analyzeMultipleFoodsWithLearning(userId, tempData.text || '');
      
      if (!analysis) {
        // パターンマッチングで見つからない場合のみAI分析
        console.log('パターンマッチング失敗、AI分析にフォールバック:', tempData.text);
        const aiService = new AIHealthService();
        analysis = await aiService.analyzeMealFromText(tempData.text || '');
        
        // AI分析結果を学習データベースに追加
        if (analysis && analysis.foodItems && analysis.foodItems.length > 0) {
          for (const foodItem of analysis.foodItems) {
            if (foodItem && typeof foodItem === 'string') {
              await addToFoodDatabase(userId, foodItem, {
                calories: analysis.calories / analysis.foodItems.length,
                protein: analysis.protein / analysis.foodItems.length,
                fat: analysis.fat / analysis.foodItems.length,
                carbs: analysis.carbs / analysis.foodItems.length
              });
            }
          }
        }
      } else {
        console.log('パターンマッチング成功:', analysis);
      }
    }

    const { createCalorieAnalysisFlexMessage } = await import('./new_flex_message');
    const flexMessage = createCalorieAnalysisFlexMessage(analysis, originalMealName);

    await replyMessage(replyToken, [flexMessage]);

    // 一時データを削除
    await deleteTempMealData(userId);

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
    const tempData = await getTempMealData(userId);
    if (!tempData) {
      await replyMessage(replyToken, [{
        type: 'text',
        text: 'データが見つかりません。もう一度食事内容を送ってください。'
      }]);
      return;
    }

    let analysis;

    try {
      if (tempData.image) {
        // 画像の場合はAI分析必須
        const aiService = new AIHealthService();
        analysis = await aiService.analyzeMealFromImage(tempData.image);
      } else {
        // テキストの場合は学習機能付きパターンマッチング優先
        analysis = await analyzeMultipleFoodsWithLearning(userId, tempData.text || '');
        
        if (!analysis) {
          // パターンマッチングで見つからない場合のみAI分析
          console.log('パターンマッチング失敗、AI分析にフォールバック:', tempData.text);
          const aiService = new AIHealthService();
          analysis = await aiService.analyzeMealFromText(tempData.text || '');
          
          // AI分析結果を学習データベースに追加
          if (analysis && analysis.foodItems && analysis.foodItems.length > 0) {
            for (const foodItem of analysis.foodItems) {
              if (foodItem && typeof foodItem === 'string') {
                await addToFoodDatabase(userId, foodItem, {
                  calories: analysis.calories / analysis.foodItems.length,
                  protein: analysis.protein / analysis.foodItems.length,
                  fat: analysis.fat / analysis.foodItems.length,
                  carbs: analysis.carbs / analysis.foodItems.length
                });
              }
            }
          }
        } else {
          console.log('パターンマッチング成功:', analysis);
        }
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
    const db = admin.firestore();
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
    
    // リトライ機能付きでデータ保存
    await retryOperation(
      async () => {
        const db = admin.firestore();
        const recordRef = db.collection('users').doc(userId).collection('dailyRecords').doc(today);
        
        // 既存の記録を取得
        const existingDoc = await recordRef.get();
        const existingData = existingDoc.exists ? existingDoc.data() : {};
        const meals = existingData.meals || [];
        
        // 新しい食事を追加
        meals.push({
          ...mealData,
          id: `meal_${Date.now()}`,
          timestamp: new Date(),
        });

        await recordRef.set({
          meals,
          date: today,
          lineUserId: userId,
          updatedAt: admin.FieldValue.serverTimestamp(),
        }, { merge: true });
      },
      'food_record',
      { userId, mealType, today }
    );

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
    await deleteTempMealData(userId);

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
// 基本運動パターン（大幅拡張版）
const BASIC_EXERCISE_PATTERNS = [
  // 詳細筋トレパターン（重量×回数×セット）- 多様な表記対応
  { 
    pattern: /^(ベンチプレス|スクワット|デッドリフト|懸垂|腕立て伏せ|腕立て|腹筋|背筋|肩トレ|ショルダープレス|ラットプルダウン|レッグプレス|カールアップ|プランク|バーベルカール|ダンベルカール|チンアップ|プルアップ|ディップス|レッグエクステンション|レッグカール|カーフレイズ|アームカール|サイドレイズ|フロントレイズ|リアレイズ|アップライトロウ|シュラッグ|クランチ|サイドクランチ|ロシアンツイスト|レッグレイズ|マウンテンクライマー|バーピー|ジャンピングジャック)\s*(\d+(?:\.\d+)?)\s*(kg|キロ|ｋｇ|KG)\s*(\d+)\s*(回|レップ|rep|reps)\s*(\d+)\s*(セット|set|sets)$/i, 
    type: 'strength_detailed',
    captureGroups: ['exercise', 'weight', 'weightUnit', 'reps', 'repsUnit', 'sets', 'setsUnit']
  },
  
  // 距離+時間パターン - 多様な単位対応
  { 
    pattern: /^(ランニング|ウォーキング|ジョギング|サイクリング|走る|歩く|ジョグ|自転車|チャリ|散歩|早歩き|マラソン|ジョギング|ハイキング|トレッキング|ウォーク|ラン|サイクル)\s*(\d+(?:\.\d+)?)\s*(km|キロ|ｋｍ|KM|キロメートル|m|メートル|ｍ|M)\s*(\d+)\s*(分|時間|秒|min|mins|hour|hours|sec|secs|分間|時|h|m|s)$/i, 
    type: 'cardio_distance',
    captureGroups: ['exercise', 'distance', 'distanceUnit', 'duration', 'durationUnit']
  },
  
  // 重量×回数パターン（セット数なし）- 多様な表記対応
  { 
    pattern: /^(ベンチプレス|スクワット|デッドリフト|懸垂|腕立て伏せ|腕立て|腹筋|背筋|肩トレ|ショルダープレス|ラットプルダウン|レッグプレス|カールアップ|プランク|バーベルカール|ダンベルカール|チンアップ|プルアップ|ディップス|レッグエクステンション|レッグカール|カーフレイズ|アームカール|サイドレイズ|フロントレイズ|リアレイズ|アップライトロウ|シュラッグ|クランチ|サイドクランチ|ロシアンツイスト|レッグレイズ|マウンテンクライマー|バーピー|ジャンピングジャック)\s*(\d+(?:\.\d+)?)\s*(kg|キロ|ｋｇ|KG)\s*(\d+)\s*(回|レップ|rep|reps)$/i, 
    type: 'strength_weight_reps',
    captureGroups: ['exercise', 'weight', 'weightUnit', 'reps', 'repsUnit']
  },
  
  // 距離のみパターン - 多様な単位対応
  { 
    pattern: /^(ランニング|ウォーキング|ジョギング|サイクリング|走る|歩く|ジョグ|自転車|チャリ|散歩|早歩き|マラソン|ハイキング|トレッキング|ウォーク|ラン|サイクル)\s*(\d+(?:\.\d+)?)\s*(km|キロ|ｋｍ|KM|キロメートル|m|メートル|ｍ|M)$/i, 
    type: 'cardio_distance_only',
    captureGroups: ['exercise', 'distance', 'distanceUnit']
  },
  
  // 有酸素運動（時間のみ）- 大幅拡張
  { 
    pattern: /^(ランニング|ウォーキング|ジョギング|サイクリング|水泳|エアロビクス|走る|歩く|泳ぐ|ジョグ|自転車|チャリ|散歩|早歩き|マラソン|ハイキング|トレッキング|ウォーク|ラン|サイクル|スイミング|プール|クロール|平泳ぎ|背泳ぎ|バタフライ|水中ウォーキング|アクアビクス|ズンバ|エアロ|ステップ|踏み台昇降|縄跳び|なわとび|ロープジャンプ|ボクシング|キックボクシング|ムエタイ|格闘技|太極拳|気功|ダンス|社交ダンス|フラダンス|ベリーダンス|ヒップホップ|ジャズダンス|バレエ|フィットネス|有酸素|カーディオ|HIIT|タバタ|インターバル|クロストレーニング|ローイング|ボート漕ぎ|エリプティカル|トレッドミル|ランニングマシン|ウォーキングマシン|エアロバイク|スピンバイク|ステッパー|クライミング|ボルダリング|登山)\s*(\d+)\s*(分|時間|秒|min|mins|hour|hours|sec|secs|分間|時|h|m|s)$/i, 
    type: 'cardio' 
  },
  
  // 筋力トレーニング（時間・回数・セット）- 大幅拡張
  { 
    pattern: /^(ベンチプレス|スクワット|デッドリフト|懸垂|腕立て伏せ|腕立て|腹筋|背筋|肩トレ|ショルダープレス|ラットプルダウン|レッグプレス|カールアップ|プランク|バーベルカール|ダンベルカール|チンアップ|プルアップ|ディップス|レッグエクステンション|レッグカール|カーフレイズ|アームカール|サイドレイズ|フロントレイズ|リアレイズ|アップライトロウ|シュラッグ|クランチ|サイドクランチ|ロシアンツイスト|レッグレイズ|マウンテンクライマー|バーピー|ジャンピングジャック|筋トレ|ウェイトトレーニング|マシントレーニング|フリーウェイト|ダンベル|バーベル|ケトルベル|チューブ|エクササイズ|ストレングス|レジスタンス|体幹|コア|インナーマッスル|アウターマッスル|上半身|下半身|胸筋|背筋|腹筋|脚|腕|肩|太もも|ふくらはぎ|お尻|臀筋|大胸筋|広背筋|僧帽筋|三角筋|上腕二頭筋|上腕三頭筋|前腕|大腿四頭筋|ハムストリング|腓腹筋|ヒラメ筋)\s*(\d+)\s*(分|時間|秒|回|セット|min|mins|hour|hours|sec|secs|rep|reps|set|sets|分間|時|h|m|s)$/i, 
    type: 'strength' 
  },
  
  // スポーツ - 大幅拡張
  { 
    pattern: /^(テニス|バドミントン|卓球|バスケ|サッカー|野球|ゴルフ|バレーボール|ハンドボール|ラグビー|アメフト|ホッケー|フィールドホッケー|アイスホッケー|スケート|フィギュアスケート|スピードスケート|アイススケート|ローラースケート|インラインスケート|スキー|スノーボード|スノボ|クロスカントリー|アルペン|ジャンプ|ノルディック|水上スキー|ジェットスキー|サーフィン|ウィンドサーフィン|セーリング|ヨット|カヌー|カヤック|ラフティング|釣り|フィッシング|弓道|アーチェリー|射撃|フェンシング|剣道|柔道|空手|合気道|少林寺拳法|テコンドー|ボクシング|キックボクシング|レスリング|相撲|体操|新体操|器械体操|トランポリン|陸上|短距離|中距離|長距離|マラソン|駅伝|ハードル|走り幅跳び|走り高跳び|棒高跳び|砲丸投げ|ハンマー投げ|やり投げ|円盤投げ|十種競技|七種競技|競歩|クライミング|ボルダリング|登山|ハイキング|トレッキング|オリエンテーリング|トライアスロン|アイアンマン|デュアスロン|アクアスロン|ペンタスロン|モダンペンタスロン|バイアスロン)\s*(\d+)\s*(分|時間|秒|min|mins|hour|hours|sec|secs|分間|時|h|m|s)$/i, 
    type: 'sports' 
  },
  
  // ストレッチ・柔軟性・リラクゼーション - 大幅拡張
  { 
    pattern: /^(ヨガ|ピラティス|ストレッチ|ダンス|社交ダンス|フラダンス|ベリーダンス|ヒップホップ|ジャズダンス|バレエ|柔軟|柔軟体操|ラジオ体操|準備運動|整理運動|クールダウン|ウォームアップ|マッサージ|セルフマッサージ|リンパマッサージ|指圧|ツボ押し|整体|カイロプラクティック|オステオパシー|リフレクソロジー|アロマテラピー|瞑想|メディテーション|呼吸法|深呼吸|腹式呼吸|胸式呼吸|ブレス|ブリージング|リラックス|リラクゼーション|ストレス解消|癒し|ヒーリング|アーユルヴェーダ|中医学|漢方|鍼灸|東洋医学|西洋医学|代替医療|補完医療|ホリスティック|ナチュラル|オーガニック|エコ|サステナブル|ウェルネス|ヘルス|フィットネス|ビューティー|アンチエイジング|デトックス|クレンズ|ファスティング|断食|プチ断食)\s*(\d+)\s*(分|時間|秒|min|mins|hour|hours|sec|secs|分間|時|h|m|s)$/i, 
    type: 'flexibility' 
  },
  
  // 日常生活活動（NEAT）- 新規追加
  { 
    pattern: /^(掃除|そうじ|清掃|洗濯|せんたく|料理|りょうり|クッキング|調理|買い物|かいもの|ショッピング|庭仕事|にわしごと|ガーデニング|草取り|くさとり|除草|水やり|みずやり|植物の世話|しょくぶつのせわ|ペットの散歩|ペットのさんぽ|犬の散歩|いぬのさんぽ|猫の世話|ねこのせわ|階段昇降|かいだんしょうこう|階段|かいだん|エスカレーター回避|階段利用|かいだんりよう|立ち仕事|たちしごと|デスクワーク|ですくわーく|パソコン作業|ぱそこんさぎょう|事務作業|じむさぎょう|会議|かいぎ|ミーティング|プレゼン|プレゼンテーション|営業|えいぎょう|接客|せっきゃく|販売|はんばい|レジ|会計|かいけい|運転|うんてん|ドライブ|電車通勤|でんしゃつうきん|バス通勤|ばすつうきん|自転車通勤|じてんしゃつうきん|徒歩通勤|とほつうきん|通学|つうがく|移動|いどう)\s*(\d+)\s*(分|時間|秒|min|mins|hour|hours|sec|secs|分間|時|h|m|s)$/i, 
    type: 'daily_activity' 
  },
  
  // 種目名のみパターン（時間なし）- 新規追加
  { 
    pattern: /^(ランニング|ウォーキング|ジョギング|サイクリング|水泳|エアロビクス|走る|歩く|泳ぐ|ジョグ|自転車|チャリ|散歩|早歩き|マラソン|ハイキング|トレッキング|ウォーク|ラン|サイクル|スイミング|プール|クロール|平泳ぎ|背泳ぎ|バタフライ|水中ウォーキング|アクアビクス|ズンバ|エアロ|ステップ|踏み台昇降|縄跳び|なわとび|ロープジャンプ|ボクシング|キックボクシング|ムエタイ|格闘技|太極拳|気功|ダンス|社交ダンス|フラダンス|ベリーダンス|ヒップホップ|ジャズダンス|バレエ|フィットネス|有酸素|カーディオ|HIIT|タバタ|インターバル|クロストレーニング|ローイング|ボート漕ぎ|エリプティカル|トレッドミル|ランニングマシン|ウォーキングマシン|エアロバイク|スピンバイク|ステッパー|クライミング|ボルダリング|登山|ベンチプレス|スクワット|デッドリフト|懸垂|腕立て伏せ|腕立て|腹筋|背筋|肩トレ|ショルダープレス|ラットプルダウン|レッグプレス|カールアップ|プランク|バーベルカール|ダンベルカール|チンアップ|プルアップ|ディップス|レッグエクステンション|レッグカール|カーフレイズ|アームカール|サイドレイズ|フロントレイズ|リアレイズ|アップライトロウ|シュラッグ|クランチ|サイドクランチ|ロシアンツイスト|レッグレイズ|マウンテンクライマー|バーピー|ジャンピングジャック|筋トレ|ウェイトトレーニング|マシントレーニング|フリーウェイト|ダンベル|バーベル|ケトルベル|チューブ|エクササイズ|ストレングス|レジスタンス|体幹|コア|インナーマッスル|アウターマッスル|上半身|下半身|胸筋|背筋|腹筋|脚|腕|肩|太もも|ふくらはぎ|お尻|臀筋|大胸筋|広背筋|僧帽筋|三角筋|上腕二頭筋|上腕三頭筋|前腕|大腿四頭筋|ハムストリング|腓腹筋|ヒラメ筋|テニス|バドミントン|卓球|バスケ|サッカー|野球|ゴルフ|バレーボール|ハンドボール|ラグビー|アメフト|ホッケー|フィールドホッケー|アイスホッケー|スケート|フィギュアスケート|スピードスケート|アイススケート|ローラースケート|インラインスケート|スキー|スノーボード|スノボ|クロスカントリー|アルペン|ジャンプ|ノルディック|水上スキー|ジェットスキー|サーフィン|ウィンドサーフィン|セーリング|ヨット|カヌー|カヤック|ラフティング|釣り|フィッシング|弓道|アーチェリー|射撃|フェンシング|剣道|柔道|空手|合気道|少林寺拳法|テコンドー|レスリング|相撲|体操|新体操|器械体操|トランポリン|陸上|短距離|中距離|長距離|駅伝|ハードル|走り幅跳び|走り高跳び|棒高跳び|砲丸投げ|ハンマー投げ|やり投げ|円盤投げ|十種競技|七種競技|競歩|オリエンテーリング|トライアスロン|アイアンマン|デュアスロン|アクアスロン|ペンタスロン|モダンペンタスロン|バイアスロン|ヨガ|ピラティス|ストレッチ|柔軟|柔軟体操|ラジオ体操|準備運動|整理運動|クールダウン|ウォームアップ|マッサージ|セルフマッサージ|リンパマッサージ|指圧|ツボ押し|整体|カイロプラクティック|オステオパシー|リフレクソロジー|アロマテラピー|瞑想|メディテーション|呼吸法|深呼吸|腹式呼吸|胸式呼吸|ブレス|ブリージング|リラックス|リラクゼーション|ストレス解消|癒し|ヒーリング|アーユルヴェーダ|中医学|漢方|鍼灸|東洋医学|西洋医学|代替医療|補完医療|ホリスティック|ナチュラル|オーガニック|エコ|サステナブル|ウェルネス|ヘルス|ビューティー|アンチエイジング|デトックス|クレンズ|ファスティング|断食|プチ断食|掃除|そうじ|清掃|洗濯|せんたく|料理|りょうり|クッキング|調理|買い物|かいもの|ショッピング|庭仕事|にわしごと|ガーデニング|草取り|くさとり|除草|水やり|みずやり|植物の世話|しょくぶつのせわ|ペットの散歩|ペットのさんぽ|犬の散歩|いぬのさんぽ|猫の世話|ねこのせわ|階段昇降|かいだんしょうこう|階段|かいだん|エスカレーター回避|階段利用|かいだんりよう|立ち仕事|たちしごと|デスクワーク|ですくわーく|パソコン作業|ぱそこんさぎょう|事務作業|じむさぎょう|会議|かいぎ|ミーティング|プレゼン|プレゼンテーション|営業|えいぎょう|接客|せっきゃく|販売|はんばい|レジ|会計|かいけい|運転|うんてん|ドライブ|電車通勤|でんしゃつうきん|バス通勤|ばすつうきん|自転車通勤|じてんしゃつうきん|徒歩通勤|とほつうきん|通学|つうがく|移動|いどう)$/i, 
    type: 'exercise_only' 
  }
];

// METs値マップ（カロリー計算用）- 大幅拡張
const EXERCISE_METS = {
  // 有酸素運動
  'ランニング': 8.0, '走る': 8.0, 'ラン': 8.0,
  'ウォーキング': 3.5, '歩く': 3.5, 'ウォーク': 3.5, '散歩': 3.0, '早歩き': 4.0,
  'ジョギング': 6.0, 'ジョグ': 6.0,
  'サイクリング': 6.8, '自転車': 6.8, 'チャリ': 6.8, 'サイクル': 6.8,
  'マラソン': 9.0, 'ハーフマラソン': 9.0,
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
  '腕立て伏せ': 4.0, '腕立て': 4.0, 'プッシュアップ': 4.0,
  '腹筋': 4.0, 'クランチ': 4.0, 'サイドクランチ': 4.0,
  '背筋': 4.0, 'バックエクステンション': 4.0,
  '肩トレ': 5.0, 'ショルダープレス': 5.0, 'サイドレイズ': 4.0,
  'ラットプルダウン': 5.0, 'レッグプレス': 6.0,
  'プランク': 3.5, 'サイドプランク': 4.0,
  'バーベルカール': 4.0, 'ダンベルカール': 4.0, 'アームカール': 4.0,
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
  'バスケ': 6.5, 'バスケットボール': 6.5,
  'サッカー': 7.0, 'フットボール': 7.0,
  '野球': 5.0, 'ベースボール': 5.0,
  'ゴルフ': 4.8, 'バレーボール': 6.0, 'ハンドボール': 8.0,
  'ラグビー': 10.0, 'アメフト': 8.0,
  'ホッケー': 8.0, 'フィールドホッケー': 8.0, 'アイスホッケー': 8.0,
  
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
  '立ち仕事': 2.5, 'デスクワーク': 1.5, 'パソコン作業': 1.5,
  '事務作業': 1.5, '会議': 1.5, 'ミーティング': 1.5,
  '運転': 2.0, 'ドライブ': 2.0,
  '電車通勤': 1.5, 'バス通勤': 1.5, '自転車通勤': 6.8, '徒歩通勤': 3.5,
  '通学': 2.0, '移動': 2.0
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
    const dateStr = new Date().toISOString().split('T')[0];
    
    // 既存の運動記録を取得
    const db = admin.firestore();
    const recordRef = db.collection('users').doc(userId).collection('dailyRecords').doc(dateStr);
    const dailyDoc = await recordRef.get();
    const dailyRecord = dailyDoc.exists ? dailyDoc.data() : null;
    
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
    await recordRef.set({
      ...dailyRecord,
      updatedAt: admin.FieldValue.serverTimestamp(),
    }, { merge: true });
    
    // 返信メッセージ
    const setNumber = targetExercise.sets.length;
    const message = `${match.exerciseName} ${setNumber}セット目を記録したよ！\n${match.weight}kg × ${match.reps}回\n\n続けて重さと回数を送信すると${setNumber + 1}セット目として記録されます。`;
    
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
async function handleExerciseMessage(replyToken: string, userId: string, text: string, user: any): Promise<boolean> {
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
      await recordExerciseFromMatch(userId, match, replyToken, user);
      return true;
    }
    
    // Step 3: 運動キーワード検出
    const hasKeywords = containsExerciseKeywords(text);
    console.log('運動キーワード検出:', hasKeywords);
    
    if (hasKeywords) {
      // Step 4: AI解析フォールバック
      const aiResult = await analyzeExerciseWithAI(userId, text);
      if (aiResult) {
        await handleAIExerciseResult(userId, aiResult, replyToken, user);
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

// 単位変換ヘルパー関数
function convertTimeToMinutes(value: number, unit: string): number {
  const timeUnits = {
    '秒': value / 60,
    'sec': value / 60,
    'secs': value / 60,
    's': value / 60,
    '分': value,
    'min': value,
    'mins': value,
    '分間': value,
    'm': value,
    '時間': value * 60,
    'hour': value * 60,
    'hours': value * 60,
    '時': value * 60,
    'h': value * 60
  };
  return timeUnits[unit] || value;
}

function convertDistanceToKm(value: number, unit: string): number {
  const distanceUnits = {
    'm': value / 1000,
    'メートル': value / 1000,
    'ｍ': value / 1000,
    'M': value / 1000,
    'km': value,
    'キロ': value,
    'ｋｍ': value,
    'KM': value,
    'キロメートル': value
  };
  return distanceUnits[unit] || value;
}

function convertWeightToKg(value: number, unit: string): number {
  const weightUnits = {
    'kg': value,
    'キロ': value,
    'ｋｇ': value,
    'KG': value
  };
  return weightUnits[unit] || value;
}

// 基本パターンマッチング（強化版）
function checkBasicExercisePatterns(text: string) {
  for (const patternObj of BASIC_EXERCISE_PATTERNS) {
    const { pattern, type, captureGroups } = patternObj;
    const match = text.match(pattern);
    if (match) {
      console.log('🎯 パターンマッチ成功:', { type, match: match.slice(1) });
      
      // 詳細パターンの処理（新拡張版）
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
          source: 'detailed_pattern',
          detailType: 'distance_duration'
        };
      }
      
      if (type === 'strength_weight_reps') {
        const weight = convertWeightToKg(parseFloat(match[2]), match[3]);
        const reps = parseInt(match[4]);
        
        return {
          exerciseName: match[1],
          weight: weight,
          reps: reps,
          sets: 1, // デフォルト1セット
          type: 'strength',
          source: 'detailed_pattern',
          detailType: 'weight_reps'
        };
      }
      
      if (type === 'cardio_distance_only') {
        const distance = convertDistanceToKm(parseFloat(match[2]), match[3]);
        
        return {
          exerciseName: match[1],
          distance: distance,
          duration: null, // 時間なし
          type: 'cardio',
          source: 'detailed_pattern',
          detailType: 'distance_only'
        };
      }
      
      // 種目名のみパターン（時間なし）
      if (type === 'exercise_only') {
        const exerciseName = match[1];
        
        // 運動タイプを推定
        const inferredType = getExerciseType(exerciseName, 'unknown');
        
        // デフォルト時間を設定（運動タイプによって異なる）
        let defaultDuration = 30; // デフォルト30分
        if (inferredType === 'strength') {
          defaultDuration = 45; // 筋トレは45分
        } else if (inferredType === 'flexibility') {
          defaultDuration = 20; // ストレッチ系は20分
        } else if (inferredType === 'sports') {
          defaultDuration = 60; // スポーツは60分
        } else if (inferredType === 'daily_activity') {
          defaultDuration = 15; // 日常活動は15分
        }
        
        return {
          exerciseName: exerciseName,
          value: defaultDuration,
          unit: '分',
          type: inferredType,
          source: 'exercise_only_pattern',
          isDefaultDuration: true
        };
      }
      
      // 従来の基本パターン（時間単位対応強化）
      const exerciseName = match[1];
      const value = parseInt(match[2]);
      const unit = match[3];
      
      // 時間単位を分に変換
      let convertedValue = value;
      if (['秒', 'sec', 'secs', 's', '分', 'min', 'mins', '分間', 'm', '時間', 'hour', 'hours', '時', 'h'].includes(unit)) {
        convertedValue = convertTimeToMinutes(value, unit);
      }
      
      return {
        exerciseName: exerciseName,
        value: convertedValue,
        unit: unit,
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
      const dateStr = currentDate.toISOString().split('T')[0];
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
async function recordExerciseFromMatch(userId: string, match: any, replyToken: string, user: any) {
  try {
    const { exerciseName, type, source, detailType } = match;
    
    // 詳細パターンの処理
    if (source === 'detailed_pattern') {
      return await recordDetailedExercise(userId, match, replyToken, user);
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
    
    // カロリー計算（プロファイルから優先）
    const userWeight = getUserWeightFromProfile(user) || await getUserWeight(userId);
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
    
    // Firestoreに保存（リトライ機能付き）
    const today = new Date().toISOString().split('T')[0];
    await retryOperation(
      async () => {
        const db = admin.firestore();
        const recordRef = db.collection('users').doc(userId).collection('dailyRecords').doc(today);
        
        // 既存の記録を取得
        const existingDoc = await recordRef.get();
        const existingData = existingDoc.exists ? existingDoc.data() : {};
        const exercises = existingData.exercises || [];
        
        // 新しい運動を追加
        exercises.push({
          ...exerciseData,
          id: `exercise_${Date.now()}`,
          timestamp: new Date(),
        });

        await recordRef.set({
          exercises,
          date: today,
          lineUserId: userId,
          updatedAt: admin.FieldValue.serverTimestamp(),
        }, { merge: true });
      },
      'exercise_record_basic',
      { userId, exerciseName, type, today }
    );
    
    // 応答メッセージ
    let unitText = '';
    if (unit === '回') unitText = `${value}回`;
    else if (unit === 'セット') unitText = `${value}セット`;
    else unitText = `${durationInMinutes}分`;
    
    // デフォルト時間が使用された場合のメッセージ
    let defaultTimeMessage = '';
    if (match.isDefaultDuration) {
      defaultTimeMessage = `\n\n${durationInMinutes}分で記録したよ（時間を指定したい場合は「${exerciseName}○分」と送信してください）`;
    }
    
    const responseMessage = {
      type: 'text',
      text: `${exerciseName} ${unitText} を記録したよ！\n\n消費カロリー: 約${calories}kcal${defaultTimeMessage}`
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
async function recordDetailedExercise(userId: string, match: any, replyToken: string, user: any) {
  try {
    const { exerciseName, type, detailType } = match;
    
    // ユーザーの体重取得（プロファイルから優先）
    const userWeight = getUserWeightFromProfile(user) || await getUserWeight(userId);
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
        
        responseText = `${exerciseName} ${weight}kg×${reps}回×${sets}セット を記録したよ！\n\n消費カロリー: 約${exerciseData.calories}kcal\n総レップ数: ${totalReps}回`;
        break;
        
      case 'distance_duration':
        const { distance, duration } = match;
        exerciseData.duration = duration;
        exerciseData.distance = distance;
        exerciseData.calories = Math.round(mets * userWeight * (duration / 60) * 1.05);
        
        const pace = (duration / distance).toFixed(1); // 分/km
        responseText = `${exerciseName} ${distance}km（${duration}分）を記録したよ！\n\n消費カロリー: 約${exerciseData.calories}kcal\nペース: ${pace}分/km`;
        break;
        
      case 'weight_reps':
        const { weight: w, reps: r } = match;
        const estDuration = Math.max(r * 0.5, 5); // 1回0.5分、最低5分
        
        exerciseData.duration = estDuration;
        exerciseData.calories = Math.round(mets * userWeight * (estDuration / 60) * 1.05);
        exerciseData.sets = [{ weight: w, reps: r }];
        
        responseText = `${exerciseName} ${w}kg×${r}回 を記録したよ！\n\n消費カロリー: 約${exerciseData.calories}kcal\n1セット完了`;
        break;
        
      case 'distance_only':
        const { distance: d } = match;
        const estimatedTime = Math.round(d * 6); // 1km=6分と仮定
        
        exerciseData.duration = estimatedTime;
        exerciseData.distance = d;
        exerciseData.calories = Math.round(mets * userWeight * (estimatedTime / 60) * 1.05);
        
        responseText = `${exerciseName} ${d}km を記録したよ！\n\n消費カロリー: 約${exerciseData.calories}kcal\n推定時間: ${estimatedTime}分`;
        break;
    }
    
    // Firestoreに保存（リトライ機能付き）
    const today = new Date().toISOString().split('T')[0];
    await retryOperation(
      async () => {
        const db = admin.firestore();
        const recordRef = db.collection('users').doc(userId).collection('dailyRecords').doc(today);
        
        // 既存の記録を取得
        const existingDoc = await recordRef.get();
        const existingData = existingDoc.exists ? existingDoc.data() : {};
        const exercises = existingData.exercises || [];
        
        // 新しい運動を追加
        exercises.push({
          ...exerciseData,
          id: `exercise_${Date.now()}`,
          timestamp: new Date(),
        });

        await recordRef.set({
          exercises,
          date: today,
          lineUserId: userId,
          updatedAt: admin.FieldValue.serverTimestamp(),
        }, { merge: true });
      },
      'exercise_record_detailed',
      { userId, exerciseName, detailType, today }
    );
    
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

// 運動タイプの判定（大幅強化）
function getExerciseType(exerciseName: string, patternType: string): string {
  // 有酸素運動
  const cardioExercises = [
    'ランニング', 'ウォーキング', 'ジョギング', 'サイクリング', '水泳', 'エアロビクス',
    '走る', '歩く', '泳ぐ', 'ジョグ', '自転車', 'チャリ', '散歩', '早歩き', 'マラソン',
    'ハイキング', 'トレッキング', 'ウォーク', 'ラン', 'サイクル', 'スイミング', 'プール',
    'クロール', '平泳ぎ', '背泳ぎ', 'バタフライ', '水中ウォーキング', 'アクアビクス',
    'ズンバ', 'エアロ', 'ステップ', '踏み台昇降', '縄跳び', 'なわとび', 'ロープジャンプ',
    'フィットネス', '有酸素', 'カーディオ', 'HIIT', 'タバタ', 'インターバル',
    'クロストレーニング', 'ローイング', 'ボート漕ぎ', 'エリプティカル', 'トレッドミル',
    'ランニングマシン', 'ウォーキングマシン', 'エアロバイク', 'スピンバイク', 'ステッパー',
    'クライミング', 'ボルダリング', '登山'
  ];
  
  // 筋力トレーニング
  const strengthExercises = [
    'ベンチプレス', 'スクワット', 'デッドリフト', '懸垂', '腕立て伏せ', '腕立て', '腹筋', 
    '背筋', '肩トレ', 'ショルダープレス', 'ラットプルダウン', 'レッグプレス', 'カールアップ',
    'プランク', 'バーベルカール', 'ダンベルカール', 'チンアップ', 'プルアップ', 'ディップス',
    'レッグエクステンション', 'レッグカール', 'カーフレイズ', 'アームカール', 'サイドレイズ',
    'フロントレイズ', 'リアレイズ', 'アップライトロウ', 'シュラッグ', 'クランチ',
    'サイドクランチ', 'ロシアンツイスト', 'レッグレイズ', 'マウンテンクライマー',
    'バーピー', 'ジャンピングジャック', '筋トレ', 'ウェイトトレーニング', 'マシントレーニング',
    'フリーウェイト', 'ダンベル', 'バーベル', 'ケトルベル', 'チューブ', 'エクササイズ',
    'ストレングス', 'レジスタンス', '体幹', 'コア', 'インナーマッスル'
  ];
  
  // スポーツ
  const sportsExercises = [
    'テニス', 'バドミントン', '卓球', 'バスケ', 'サッカー', '野球', 'ゴルフ',
    'バレーボール', 'ハンドボール', 'ラグビー', 'アメフト', 'ホッケー',
    'スケート', 'スキー', 'スノーボード', 'スノボ', 'サーフィン', 'カヌー', 'カヤック',
    '釣り', '弓道', 'アーチェリー', '体操', '陸上', 'トライアスロン'
  ];
  
  // 格闘技・武道
  const martialArtsExercises = [
    'ボクシング', 'キックボクシング', 'ムエタイ', '格闘技', '剣道', '柔道', '空手',
    '合気道', '少林寺拳法', 'テコンドー', 'レスリング', '相撲', 'フェンシング',
    '太極拳', '気功'
  ];
  
  // ストレッチ・柔軟性・リラクゼーション
  const flexibilityExercises = [
    'ヨガ', 'ピラティス', 'ストレッチ', 'ダンス', '社交ダンス', 'フラダンス',
    'ベリーダンス', 'ヒップホップ', 'ジャズダンス', 'バレエ', '柔軟', '柔軟体操',
    'ラジオ体操', '準備運動', '整理運動', 'クールダウン', 'ウォームアップ',
    'マッサージ', '瞑想', 'メディテーション', '呼吸法', 'リラックス'
  ];
  
  // 日常生活活動
  const dailyActivityExercises = [
    '掃除', 'そうじ', '清掃', '洗濯', '料理', 'クッキング', '調理', '買い物', 'ショッピング',
    '庭仕事', 'ガーデニング', '草取り', '水やり', 'ペットの散歩', '犬の散歩',
    '階段昇降', '階段', '立ち仕事', 'デスクワーク', 'パソコン作業', '事務作業',
    '会議', 'ミーティング', '運転', 'ドライブ', '通勤', '通学', '移動'
  ];
  
  // 判定ロジック
  if (cardioExercises.includes(exerciseName)) return 'cardio';
  if (strengthExercises.includes(exerciseName)) return 'strength';
  if (sportsExercises.includes(exerciseName)) return 'sports';
  if (martialArtsExercises.includes(exerciseName)) return 'sports'; // 格闘技もスポーツカテゴリ
  if (flexibilityExercises.includes(exerciseName)) return 'flexibility';
  if (dailyActivityExercises.includes(exerciseName)) return 'daily_activity';
  
  // パターンタイプからフォールバック
  if (patternType === 'cardio') return 'cardio';
  if (patternType === 'strength') return 'strength';
  if (patternType === 'sports') return 'sports';
  if (patternType === 'flexibility') return 'flexibility';
  if (patternType === 'daily_activity') return 'daily_activity';
  
  return 'cardio'; // デフォルト
}

// ユーザーのプロファイルから体重を取得
function getUserWeightFromProfile(user: any): number | null {
  try {
    // カウンセリング結果から体重を取得
    if (user.counselingResult?.answers?.weight) {
      return user.counselingResult.answers.weight;
    }
    
    // プロファイルから体重を取得
    if (user.profile?.weight) {
      return user.profile.weight;
    }
    
    return null;
  } catch (error) {
    console.error('プロファイル体重取得エラー:', error);
    return null;
  }
}

// ユーザーの体重を取得
async function getUserWeight(userId: string): Promise<number> {
  try {
    const db = admin.firestore();
    const today = new Date().toISOString().split('T')[0];
    
    // 最近7日間の体重データを探す
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
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
async function handleAIExerciseResult(userId: string, aiResult: any, replyToken: string, user: any) {
  if (aiResult.confidence > 0.8) {
    // 確信度が高い場合は自動記録
    const match = {
      exerciseName: aiResult.exercise,
      value: aiResult.duration || 30,
      unit: '分',
      type: aiResult.type || 'cardio',
      source: 'ai_analysis'
    };
    await recordExerciseFromMatch(userId, match, replyToken, user);
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