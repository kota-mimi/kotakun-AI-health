import { db } from './firebase';
import { doc, setDoc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
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
    const changeDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    
    // カロリーと栄養計算
    const goals: HealthGoal[] = [{
      type: profileData.primaryGoal as HealthGoal['type'],
      targetValue: profileData.targetWeight
    }];
    
    const targetCalories = calculateCalorieTarget(profileData, goals);
    const macros = calculateMacroTargets(targetCalories);
    const bmr = calculateBMR(profileData);
    const tdee = calculateTDEE(bmr, profileData.activityLevel as any);
    
    const historyEntry: ProfileHistoryEntry = {
      ...profileData,
      changeDate,
      targetCalories,
      bmr,
      tdee,
      macros
    };
    
    const userDocRef = doc(db, 'users', userId);
    
    // 既存データを確認
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      // 既存ユーザーの場合、履歴に追加
      await updateDoc(userDocRef, {
        profileHistory: arrayUnion(historyEntry),
        lastProfileUpdate: new Date().toISOString()
      });
    } else {
      // 新規ユーザーの場合、新規作成
      await setDoc(userDocRef, {
        userId,
        profileHistory: [historyEntry],
        lastProfileUpdate: new Date().toISOString(),
        createdAt: new Date().toISOString()
      });
    }
    
    console.log('✅ プロフィール履歴保存完了:', historyEntry);
  } catch (error) {
    console.error('❌ プロフィール履歴保存エラー:', error);
    throw error;
  }
}

// 指定日付に有効なプロフィールデータを取得
export async function getProfileForDate(userId: string, targetDate: string): Promise<ProfileHistoryEntry | null> {
  try {
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      return null;
    }
    
    const data = userDoc.data();
    const profileHistory: ProfileHistoryEntry[] = data.profileHistory || [];
    
    if (profileHistory.length === 0) {
      return null;
    }
    
    // 指定日付以前で最も新しいプロフィールを取得
    const validProfiles = profileHistory
      .filter(profile => profile.changeDate <= targetDate)
      .sort((a, b) => b.changeDate.localeCompare(a.changeDate));
    
    return validProfiles[0] || null;
  } catch (error) {
    console.error('❌ プロフィール取得エラー:', error);
    return null;
  }
}

// 最新のプロフィールデータを取得
export async function getLatestProfile(userId: string): Promise<ProfileHistoryEntry | null> {
  try {
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      return null;
    }
    
    const data = userDoc.data();
    const profileHistory: ProfileHistoryEntry[] = data.profileHistory || [];
    
    if (profileHistory.length === 0) {
      return null;
    }
    
    // 最新のプロフィールを取得
    return profileHistory.sort((a, b) => b.changeDate.localeCompare(a.changeDate))[0];
  } catch (error) {
    console.error('❌ 最新プロフィール取得エラー:', error);
    return null;
  }
}