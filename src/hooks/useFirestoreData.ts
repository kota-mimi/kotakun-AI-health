import { useState, useEffect } from 'react';
import { FirestoreService } from '@/services/firestoreService';

interface FirestoreExercise {
  id: string;
  name: string;
  type: 'cardio' | 'strength' | 'flexibility' | 'sports';
  duration: number;
  calories: number;
  sets?: { weight: number; reps: number; }[];
  distance?: number;
  time: string;
  timestamp: Date;
}

interface FirestoreMeal {
  id: string;
  name: string;
  mealTime: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  time: string;
  type: string;
  items: string[];
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  foodItems: string[];
  images: string[];
  image?: string;
  timestamp: Date;
}

interface FirestoreDailyData {
  exercises?: FirestoreExercise[];
  meals?: FirestoreMeal[];
  weight?: number;
  bodyFat?: number;
  note?: string;
}

export function useFirestoreData(selectedDate: Date, lineUserId?: string) {
  const [firestoreData, setFirestoreData] = useState<FirestoreDailyData>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dateKey = selectedDate.toISOString().split('T')[0];

  const fetchFirestoreData = async () => {
    if (!lineUserId) {
      setFirestoreData({});
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const firestoreService = new FirestoreService();
      const dailyRecord = await firestoreService.getDailyRecord(lineUserId, dateKey);

      if (dailyRecord) {
        // exercise フィールドを exercises に正規化（型定義に合わせる）
        const exercises = dailyRecord.exercise || [];
        const meals = dailyRecord.meals || [];
        
        
        setFirestoreData({
          exercises: exercises.map((ex: any) => ({
            ...ex,
            timestamp: ex.timestamp instanceof Date ? ex.timestamp : new Date(ex.timestamp)
          })),
          meals: meals.map((meal: any) => ({
            ...meal,
            timestamp: meal.timestamp instanceof Date ? meal.timestamp : new Date(meal.timestamp)
          })),
          weight: dailyRecord.weight,
          bodyFat: dailyRecord.bodyFat,
          note: dailyRecord.note
        });
      } else {
        setFirestoreData({});
      }
    } catch (err) {
      console.error('Firestore データ取得エラー:', err);
      setError('データの読み込みに失敗しました');
      setFirestoreData({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFirestoreData();
  }, [dateKey, lineUserId]);

  return {
    firestoreData,
    loading,
    error,
    refetch: fetchFirestoreData
  };
}