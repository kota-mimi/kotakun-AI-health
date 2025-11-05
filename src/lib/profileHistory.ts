import { db } from './firebase';
import { doc, setDoc, getDoc, updateDoc, arrayUnion, collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { calculateCalorieTarget, calculateMacroTargets, calculateBMR, calculateTDEE } from '@/utils/calculations';
import type { HealthGoal } from '@/types';

export interface ProfileHistoryEntry {
  changeDate: string; // YYYY-MM-DD format
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  height: number;
  weight: number;
  targetWeight: number;
  activityLevel: string;
  primaryGoal: string;
  // 計算された値
  targetCalories: number;
  bmr: number;
  tdee: number;
  macros: {
    protein: number;
    fat: number;
    carbs: number;
  };
}

// プロフィール変更を履歴として保存
export async function saveProfileHistory(userId: string, profileData: Omit<ProfileHistoryEntry, 'changeDate' | 'targetCalories' | 'bmr' | 'tdee' | 'macros'>): Promise<void> {
  try {
    const changeDate = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' }); // YYYY-MM-DD format
    
    console.log('📊 プロフィール履歴保存開始:', {
      userId,
      profileData,
      changeDate
    });
    
    // プロフィールをUserProfile型に変換
    const profile: UserProfile = {
      name: profileData.name,
      age: profileData.age,
      gender: profileData.gender,
      height: profileData.height,
      weight: profileData.weight,
      targetWeight: profileData.targetWeight,
      activityLevel: profileData.activityLevel as UserProfile['activityLevel'],
      goals: [{
        type: profileData.primaryGoal as HealthGoal['type'],
        targetValue: profileData.targetWeight
      }],
      sleepDuration: '8h_plus', // デフォルト値
      sleepQuality: 'normal',
      exerciseHabit: 'yes',
      exerciseFrequency: 'weekly_3_4',
      mealFrequency: '3',
      snackFrequency: 'sometimes',
      alcoholFrequency: 'none'
    };
    
    console.log('📊 プロフィール変換完了:', profile);
    
    // カロリーと栄養計算
    const goals: HealthGoal[] = [{
      type: profileData.primaryGoal as HealthGoal['type'],
      targetValue: profileData.targetWeight
    }];
    
    const targetCalories = calculateCalorieTarget(profile, goals);
    const macros = calculateMacroTargets(targetCalories);
    const bmr = calculateBMR(profile);
    const tdee = calculateTDEE(bmr, profileData.activityLevel);
    
    console.log('📊 計算結果:', {
      targetCalories,
      macros,
      bmr,
      tdee
    });
    
    const historyEntry: ProfileHistoryEntry = {
      ...profileData,
      changeDate,
      targetCalories,
      bmr,
      tdee,
      macros
    };
    
    console.log('📊 履歴エントリ作成:', historyEntry);
    
    // プロフィール履歴をサブコレクションに保存（食事記録と同じパターン）
    const profileHistoryRef = doc(db, 'users', userId, 'profileHistory', changeDate);
    
    console.log('📊 プロフィール履歴サブコレクションに保存:', `users/${userId}/profileHistory/${changeDate}`);
    
    await setDoc(profileHistoryRef, historyEntry);
    
    // メインユーザードキュメントの最終更新日も更新
    const userDocRef = doc(db, 'users', userId);
    await updateDoc(userDocRef, {
      lastProfileUpdate: new Date().toISOString()
    });
    
    console.log('✅ プロフィール履歴保存完了:', historyEntry);
  } catch (error) {
    console.error('❌ プロフィール履歴保存エラー詳細:', {
      error,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      errorName: error instanceof Error ? error.name : 'Unknown',
      errorStack: error instanceof Error ? error.stack : 'No stack trace',
      userId
    });
    throw error;
  }
}

// 指定日付に有効なプロフィールデータを取得
export async function getProfileForDate(userId: string, targetDate: string): Promise<ProfileHistoryEntry | null> {
  try {
    // サブコレクションからプロフィール履歴を取得
    const profileHistoryRef = collection(db, 'users', userId, 'profileHistory');
    const q = query(
      profileHistoryRef,
      where('changeDate', '<=', targetDate),
      orderBy('changeDate', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    // 最も新しいプロフィールを返す
    const doc = querySnapshot.docs[0];
    return doc.data() as ProfileHistoryEntry;
  } catch (error) {
    console.error('❌ プロフィール取得エラー:', error);
    return null;
  }
}

// 最新のプロフィールデータを取得
export async function getLatestProfile(userId: string): Promise<ProfileHistoryEntry | null> {
  try {
    // サブコレクションから最新のプロフィール履歴を取得
    const profileHistoryRef = collection(db, 'users', userId, 'profileHistory');
    const q = query(
      profileHistoryRef,
      orderBy('changeDate', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    // 最も新しいプロフィールを返す
    const doc = querySnapshot.docs[0];
    return doc.data() as ProfileHistoryEntry;
  } catch (error) {
    console.error('❌ 最新プロフィール取得エラー:', error);
    return null;
  }
}