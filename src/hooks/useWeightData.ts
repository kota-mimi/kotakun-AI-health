import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { useLocalStorage } from './useLocalStorage';
import { generateId } from '@/lib/utils';
import { apiCache, createCacheKey } from '@/lib/cache';

interface WeightEntry {
  id: string;
  date: string; // YYYY-MM-DD format
  weight: number;
  note?: string;
  photo?: string;
  time: string; // HH:MM format
  timestamp: number;
}

interface WeightData {
  current: number;
  previous: number;
  target: number;
}

interface WeightSettings {
  targetWeight: number;
  goalDeadline?: string;
  weightUnit: 'kg' | 'lbs';
  reminderTime?: string;
  reminderEnabled: boolean;
}

export function useWeightData(selectedDate: Date, dateBasedData: any, updateDateData: (updates: any) => void, counselingResult?: any) {
  const { liffUser } = useAuth();
  
  // モーダル状態管理
  const [isWeightEntryModalOpen, setIsWeightEntryModalOpen] = useState(false);
  const [isWeightSettingsModalOpen, setIsWeightSettingsModalOpen] = useState(false);
  
  // 体重データ
  const [realWeightData, setRealWeightData] = useState<Array<{date: string; weight: number}>>([]);
  const [isLoadingWeightData, setIsLoadingWeightData] = useState(true);

  // 体重データを取得 - シンプル版
  useEffect(() => {
    if (!liffUser?.userId) return;
    
    const fetchWeightData = async () => {
      const lineUserId = liffUser.userId;
      const cacheKey = createCacheKey('weight', lineUserId, 'month');
      
      // キャッシュから即座に表示
      const cachedData = apiCache.get(cacheKey);
      if (cachedData && Array.isArray(cachedData)) {
        setRealWeightData(cachedData);
        setIsLoadingWeightData(false);
        return;
      }
      
      // APIから取得
      try {
        const response = await fetch(`/api/weight?lineUserId=${lineUserId}&period=month`);
        if (response.ok) {
          const result = await response.json();
          const weightData = result.data || [];
          
          apiCache.set(cacheKey, weightData, 5 * 60 * 1000);
          setRealWeightData(weightData);
        }
      } catch (error) {
        console.error('体重データ取得エラー:', error);
      } finally {
        setIsLoadingWeightData(false);
      }
    };

    fetchWeightData();
  }, [liffUser?.userId]);

  // 設定データ（ローカルストレージ）
  const [weightSettingsStorage] = useLocalStorage<WeightSettings>('weightSettings', {
    targetWeight: 0,
    weightUnit: 'kg',
    reminderEnabled: false
  });

  // 日付のキーを生成
  const getDateKey = (date: Date) => {
    return date.toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' });
  };

  // 特定の日付の体重データを取得 - シンプル版
  const getWeightDataForDate = (date: Date): WeightData => {
    const dateKey = getDateKey(date);
    const today = getDateKey(new Date());
    
    // 未来の日付は表示しない
    if (dateKey > today) {
      return { current: 0, previous: 0, target: 0 };
    }
    
    // その日の体重記録を取得
    const currentDayData = realWeightData.find(item => item.date === dateKey);
    const currentWeight = currentDayData?.weight || 0;
    
    // 前日の体重記録を取得
    const previousDate = new Date(date);
    previousDate.setDate(previousDate.getDate() - 1);
    const previousKey = getDateKey(previousDate);
    const previousDayData = realWeightData.find(item => item.date === previousKey);
    const previousWeight = previousDayData?.weight || 0;
    
    // 目標体重を設定
    let targetWeight = 0;
    if (counselingResult?.answers?.targetWeight && counselingResult.answers.primaryGoal !== 'maintenance') {
      targetWeight = counselingResult.answers.targetWeight;
    } else {
      targetWeight = weightSettingsStorage.value.targetWeight || 0;
    }
    
    return {
      current: currentWeight,
      previous: previousWeight,
      target: targetWeight
    };
  };

  // 体重記録を追加 - シンプル版
  const handleAddWeightEntry = async (data: { weight?: number; note?: string; photo?: string }) => {
    const lineUserId = liffUser?.userId;
    const dateStr = getDateKey(selectedDate);
    
    try {
      // APIに送信
      const response = await fetch('/api/weight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lineUserId,
          date: dateStr,
          weight: data.weight,
          note: data.note
        }),
      });

      if (!response.ok) {
        throw new Error('記録の保存に失敗しました');
      }

      // キャッシュとstateを即座に更新
      if (data.weight) {
        const newEntry = { date: dateStr, weight: data.weight };
        const updatedData = realWeightData.filter(item => item.date !== dateStr);
        updatedData.push(newEntry);
        updatedData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        setRealWeightData(updatedData);
        
        const cacheKey = createCacheKey('weight', lineUserId, 'month');
        apiCache.set(cacheKey, updatedData, 5 * 60 * 1000);
      }

      console.log('記録が正常に保存されました');
    } catch (error) {
      console.error('記録保存エラー:', error);
      throw error;
    }
  };

  return {
    // データ
    weightData: getWeightDataForDate(selectedDate),
    realWeightData,
    isLoadingWeightData,
    
    // モーダル状態
    isWeightEntryModalOpen,
    setIsWeightEntryModalOpen,
    isWeightSettingsModalOpen,
    setIsWeightSettingsModalOpen,
    
    // アクション
    handleAddWeightEntry,
    
    // 設定
    weightSettings: weightSettingsStorage.value,
  };
}