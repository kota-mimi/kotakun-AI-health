import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  collection, 
  addDoc,
  query,
  where,
  orderBy,
  getDocs,
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { User, UserProfile, CounselingAnswer, DailyRecord } from '@/types';

export class FirestoreService {
  
  // ユーザー情報の保存
  async saveUser(lineUserId: string, userData: Partial<User>) {
    try {
      const userRef = doc(db, 'users', lineUserId);
      await setDoc(userRef, {
        ...userData,
        lineUserId,
        updatedAt: serverTimestamp(),
        createdAt: userData.createdAt || serverTimestamp(),
      }, { merge: true });
      
      console.log('ユーザー情報保存完了:', lineUserId);
      return true;
    } catch (error) {
      console.error('ユーザー情報保存エラー:', error);
      throw error;
    }
  }

  // ユーザー情報の取得
  async getUser(lineUserId: string): Promise<User | null> {
    try {
      const userRef = doc(db, 'users', lineUserId);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const data = userSnap.data();
        return {
          ...data,
          userId: userSnap.id,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as User;
      }
      
      return null;
    } catch (error) {
      console.error('ユーザー情報取得エラー:', error);
      throw error;
    }
  }

  // カウンセリング結果の保存
  async saveCounselingResult(lineUserId: string, answers: Record<string, any>, aiAnalysis: any) {
    try {
      const counselingRef = doc(db, 'users', lineUserId, 'counseling', 'result');
      await setDoc(counselingRef, {
        answers,
        aiAnalysis,
        completedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
      });

      // ユーザープロファイルも更新（undefined値の処理）
      const profile: UserProfile = {
        name: answers.name || 'ユーザー',
        age: Number(answers.age) || 25,
        gender: answers.gender || 'other',
        height: Number(answers.height) || 170,
        weight: Number(answers.weight) || 60,
        activityLevel: answers.activityLevel || 'normal',
        goals: [{
          type: answers.primaryGoal || 'fitness_improve',
          targetValue: Number(answers.targetWeight) || Number(answers.weight) || 60,
        }],
        medicalConditions: answers.medicalConditions ? [answers.medicalConditions] : [],
        allergies: answers.allergies ? [answers.allergies] : [],
      };

      await this.saveUser(lineUserId, { profile });
      
      console.log('カウンセリング結果保存完了:', lineUserId);
      return true;
    } catch (error) {
      console.error('カウンセリング結果保存エラー:', error);
      throw error;
    }
  }

  // カウンセリング結果の取得
  async getCounselingResult(lineUserId: string) {
    try {
      const counselingRef = doc(db, 'users', lineUserId, 'counseling', 'result');
      const counselingSnap = await getDoc(counselingRef);
      
      if (counselingSnap.exists()) {
        const data = counselingSnap.data();
        return {
          ...data,
          completedAt: data.completedAt?.toDate(),
          createdAt: data.createdAt?.toDate(),
        };
      }
      
      return null;
    } catch (error) {
      console.error('カウンセリング結果取得エラー:', error);
      throw error;
    }
  }

  // 日次記録の保存
  async saveDailyRecord(lineUserId: string, date: string, recordData: Partial<DailyRecord>) {
    try {
      const recordRef = doc(db, 'users', lineUserId, 'dailyRecords', date);
      await setDoc(recordRef, {
        ...recordData,
        date,
        lineUserId,
        updatedAt: serverTimestamp(),
        createdAt: recordData.createdAt || serverTimestamp(),
      }, { merge: true });
      
      console.log('日次記録保存完了:', { lineUserId, date });
      return true;
    } catch (error) {
      console.error('日次記録保存エラー:', error);
      throw error;
    }
  }

  // 日次記録の取得
  async getDailyRecord(lineUserId: string, date: string): Promise<DailyRecord | null> {
    try {
      const recordRef = doc(db, 'users', lineUserId, 'dailyRecords', date);
      const recordSnap = await getDoc(recordRef);
      
      if (recordSnap.exists()) {
        const data = recordSnap.data();
        return {
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as DailyRecord;
      }
      
      return null;
    } catch (error) {
      console.error('日次記録取得エラー:', error);
      throw error;
    }
  }

  // 期間の記録を取得（レポート用）
  async getDailyRecordsRange(lineUserId: string, startDate: string, endDate: string) {
    try {
      const recordsRef = collection(db, 'users', lineUserId, 'dailyRecords');
      const q = query(
        recordsRef,
        where('date', '>=', startDate),
        where('date', '<=', endDate),
        orderBy('date', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const records = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      }));
      
      return records;
    } catch (error) {
      console.error('期間記録取得エラー:', error);
      throw error;
    }
  }

  // 食事記録の追加
  async addMeal(lineUserId: string, date: string, mealData: any) {
    try {
      // 既存の日次記録を取得
      const existingRecord = await this.getDailyRecord(lineUserId, date);
      const meals = existingRecord?.meals || [];
      
      // 新しい食事を追加
      meals.push({
        ...mealData,
        id: `meal_${Date.now()}`,
        timestamp: new Date(),
      });

      // 日次記録を更新
      await this.saveDailyRecord(lineUserId, date, {
        meals,
      });

      console.log('食事記録追加完了:', { lineUserId, date });
      return true;
    } catch (error) {
      console.error('食事記録追加エラー:', error);
      throw error;
    }
  }

  // 運動記録の追加
  async addExercise(lineUserId: string, date: string, exerciseData: any) {
    try {
      const existingRecord = await this.getDailyRecord(lineUserId, date);
      const exercises = existingRecord?.exercise || [];
      
      exercises.push({
        ...exerciseData,
        id: `exercise_${Date.now()}`,
        timestamp: new Date(),
      });

      await this.saveDailyRecord(lineUserId, date, {
        exercise: exercises,
      });

      console.log('運動記録追加完了:', { lineUserId, date });
      return true;
    } catch (error) {
      console.error('運動記録追加エラー:', error);
      throw error;
    }
  }

  // 体重記録の更新
  async updateWeight(lineUserId: string, date: string, weight: number) {
    try {
      await this.saveDailyRecord(lineUserId, date, {
        weight,
      });

      // ユーザープロファイルの体重も更新
      const user = await this.getUser(lineUserId);
      if (user && user.profile) {
        user.profile.weight = weight;
        await this.saveUser(lineUserId, { profile: user.profile });
      }

      console.log('体重記録更新完了:', { lineUserId, date, weight });
      return true;
    } catch (error) {
      console.error('体重記録更新エラー:', error);
      throw error;
    }
  }

  // ローカルストレージからの移行（一度だけ実行）
  async migrateFromLocalStorage(lineUserId: string) {
    try {
      // 既存のFirestoreデータをチェック
      const existingUser = await this.getUser(lineUserId);
      if (existingUser) {
        console.log('既にFirestoreにデータが存在します');
        return false;
      }

      // ローカルストレージからデータを取得（クライアントサイドのみ）
      if (typeof window === 'undefined') return false;

      const counselingAnswers = localStorage.getItem('counselingAnswers');
      const aiAnalysis = localStorage.getItem('aiAnalysis');

      if (counselingAnswers) {
        const answers = JSON.parse(counselingAnswers);
        const analysis = aiAnalysis ? JSON.parse(aiAnalysis) : null;

        // カウンセリング結果を保存
        await this.saveCounselingResult(lineUserId, answers, analysis);

        console.log('ローカルストレージからの移行完了');
        return true;
      }

      return false;
    } catch (error) {
      console.error('移行エラー:', error);
      return false;
    }
  }
}

export default FirestoreService;