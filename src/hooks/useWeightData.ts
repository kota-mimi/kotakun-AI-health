import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { useLocalStorage } from './useLocalStorage';
import { generateId } from '@/lib/utils';

interface WeightEntry {
  id: string;
  date: string; // YYYY-MM-DD format
  weight: number;
  bodyFat?: number;
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

export function useWeightData(selectedDate: Date, dateBasedData: any, updateDateData: (updates: any) => void) {
  const { liffUser } = useAuth();
  
  // モーダル状態管理
  const [isWeightEntryModalOpen, setIsWeightEntryModalOpen] = useState(false);
  const [isWeightSettingsModalOpen, setIsWeightSettingsModalOpen] = useState(false);
  
  // 実データ取得用のstate
  const [realWeightData, setRealWeightData] = useState<Array<{date: string; weight: number; bodyFat?: number}>>([]);
  
  // Firestoreから体重データを取得
  useEffect(() => {
    const fetchWeightData = async () => {
      const lineUserId = liffUser?.userId || 'U7fd12476d6263912e0d9c99fc3a6bef9';
      
      try {
        const response = await fetch(`/api/weight?lineUserId=${lineUserId}&period=month`);
        if (response.ok) {
          const result = await response.json();
          setRealWeightData(result.data || []);
        }
      } catch (error) {
        console.error('体重データ取得エラー:', error);
      }
    };

    fetchWeightData();
  }, [selectedDate, liffUser?.userId]);
  
  // 体重設定をlocalStorageで永続化
  const weightSettingsStorage = useLocalStorage<WeightSettings>('healthApp_weightSettings', {
    targetWeight: 0,
    goalDeadline: undefined,
    weightUnit: 'kg',
    reminderTime: '07:00',
    reminderEnabled: true,
  });

  // 現在選択されている日付のデータを取得
  const getCurrentDateData = () => {
    const dateKey = selectedDate.toISOString().split('T')[0];
    return dateBasedData[dateKey] || { weightData: { current: 0, previous: 0, target: 0 } };
  };

  // 日付のキーを生成
  const getDateKey = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  // 体重履歴を取得（全期間）
  const getAllWeightEntries = (): WeightEntry[] => {
    const allEntries: WeightEntry[] = [];
    
    Object.keys(dateBasedData).forEach(dateKey => {
      const dayData = dateBasedData[dateKey];
      if (dayData.weightEntries && dayData.weightEntries.length > 0) {
        allEntries.push(...dayData.weightEntries);
      }
    });
    
    // 日付順でソート（新しい順）
    return allEntries.sort((a, b) => b.timestamp - a.timestamp);
  };

  // 特定の日付の体重データを取得
  const getWeightDataForDate = (date: Date): WeightData => {
    const dateKey = getDateKey(date);
    
    // まずrealWeightDataから当日のデータを確認
    const realDataForDate = realWeightData.find(item => item.date === dateKey);
    
    if (realDataForDate) {
      // 前日のデータを取得（realWeightDataまたはlocalDataから）
      const previousDate = new Date(date);
      previousDate.setDate(previousDate.getDate() - 1);
      const previousKey = getDateKey(previousDate);
      
      const previousRealData = realWeightData.find(item => item.date === previousKey);
      const previousWeight = previousRealData?.weight || getPreviousWeight(previousDate);
      
      return {
        current: realDataForDate.weight,
        previous: previousWeight,
        target: weightSettingsStorage.value.targetWeight
      };
    }
    
    // fallback: ローカルデータを確認
    const dayData = dateBasedData[dateKey];
    
    if (dayData?.weightEntries && dayData.weightEntries.length > 0) {
      // その日の最新の記録を使用
      const latestEntry = dayData.weightEntries[dayData.weightEntries.length - 1];
      
      // 前日のデータを取得
      const previousDate = new Date(date);
      previousDate.setDate(previousDate.getDate() - 1);
      const previousWeight = getPreviousWeight(previousDate);
      
      return {
        current: latestEntry.weight,
        previous: previousWeight,
        target: weightSettingsStorage.value.targetWeight
      };
    }
    
    // デフォルトデータを返す
    return {
      current: 0,
      previous: 0,
      target: weightSettingsStorage.value.targetWeight
    };
  };

  // 前日の体重を取得
  const getPreviousWeight = (date: Date): number => {
    const dateKey = getDateKey(date);
    
    // まずrealWeightDataから確認
    const realDataForDate = realWeightData.find(item => item.date === dateKey);
    if (realDataForDate) {
      return realDataForDate.weight;
    }
    
    // fallback: ローカルデータから確認
    const dayData = dateBasedData[dateKey];
    
    if (dayData?.weightEntries && dayData.weightEntries.length > 0) {
      return dayData.weightEntries[dayData.weightEntries.length - 1].weight;
    }
    
    // さらに前の日を検索（最大7日間）
    for (let i = 1; i <= 7; i++) {
      const searchDate = new Date(date);
      searchDate.setDate(searchDate.getDate() - i);
      const searchDateKey = getDateKey(searchDate);
      
      // まずrealWeightDataから検索
      const realSearchData = realWeightData.find(item => item.date === searchDateKey);
      if (realSearchData) {
        return realSearchData.weight;
      }
      
      // ローカルデータから検索
      const searchDayData = dateBasedData[searchDateKey];
      if (searchDayData?.weightEntries && searchDayData.weightEntries.length > 0) {
        return searchDayData.weightEntries[searchDayData.weightEntries.length - 1].weight;
      }
    }
    
    return 0; // デフォルト値
  };

  // 体重記録を追加
  const handleAddWeightEntry = async (data: { weight: number; bodyFat?: number; note?: string; photo?: string }) => {
    const lineUserId = liffUser?.userId || 'U7fd12476d6263912e0d9c99fc3a6bef9';
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
          bodyFat: data.bodyFat,
          note: data.note
        }),
      });

      if (!response.ok) {
        throw new Error('体重記録の保存に失敗しました');
      }

      // ローカルデータも更新
      const newEntry: WeightEntry = {
        id: generateId(),
        date: dateStr,
        weight: data.weight,
        bodyFat: data.bodyFat,
        note: data.note,
        photo: data.photo,
        time: new Date().toTimeString().slice(0, 5),
        timestamp: Date.now()
      };

      const currentData = getCurrentDateData();
      const existingEntries = currentData.weightEntries || [];
      
      updateDateData({
        weightEntries: [...existingEntries, newEntry],
        weightData: {
          current: data.weight,
          previous: getPreviousWeight(selectedDate),
          target: weightSettingsStorage.value.targetWeight
        }
      });

      // realWeightDataも即座に更新
      const newRealWeightEntry = {
        date: dateStr,
        weight: data.weight,
        bodyFat: data.bodyFat
      };
      
      setRealWeightData(prevData => {
        // 既存の同じ日付のデータを削除して新しいデータを追加
        const filteredData = prevData.filter(item => item.date !== dateStr);
        return [...filteredData, newRealWeightEntry].sort((a, b) => 
          new Date(a.date).getTime() - new Date(b.date).getTime()
        );
      });

      console.log('体重記録が正常に保存されました');
    } catch (error) {
      console.error('体重記録保存エラー:', error);
      alert('体重記録の保存に失敗しました。もう一度お試しください。');
    }
  };

  // 体重記録を更新
  const handleUpdateWeightEntry = (entryId: string, updates: Partial<WeightEntry>) => {
    const currentData = getCurrentDateData();
    const updatedEntries = (currentData.weightEntries || []).map((entry: WeightEntry) =>
      entry.id === entryId ? { ...entry, ...updates } : entry
    );
    
    updateDateData({
      weightEntries: updatedEntries
    });
  };

  // 体重記録を削除
  const handleDeleteWeightEntry = (entryId: string) => {
    const currentData = getCurrentDateData();
    const filteredEntries = (currentData.weightEntries || []).filter((entry: WeightEntry) => entry.id !== entryId);
    
    updateDateData({
      weightEntries: filteredEntries
    });
  };

  // 目標体重を設定（localStorage自動保存）
  const handleUpdateWeightSettings = (newSettings: Partial<WeightSettings>) => {
    const updatedSettings = { ...weightSettingsStorage.value, ...newSettings };
    weightSettingsStorage.setValue(updatedSettings);
    
    // 全日付のtargetWeightを更新
    Object.keys(dateBasedData).forEach(dateKey => {
      const dayData = dateBasedData[dateKey];
      if (dayData.weightData) {
        dayData.weightData.target = updatedSettings.targetWeight;
      }
    });
  };

  // 体重推移データを取得（グラフ用）
  const getWeightTrendData = (days: number = 30) => {
    // dateBasedDataがnullまたはundefinedの場合は空配列を返す
    if (!dateBasedData) {
      return [];
    }
    
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const trendData: { date: string; weight: number; bodyFat?: number }[] = [];
    
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateKey = getDateKey(d);
      const dayData = dateBasedData[dateKey];
      
      if (dayData?.weightEntries && dayData.weightEntries.length > 0) {
        const latestEntry = dayData.weightEntries[dayData.weightEntries.length - 1];
        trendData.push({
          date: dateKey,
          weight: latestEntry.weight,
          bodyFat: latestEntry.bodyFat
        });
      }
    }
    
    return trendData;
  };

  // 体重統計を計算
  const getWeightStats = () => {
    const allEntries = getAllWeightEntries();
    
    if (allEntries.length === 0) {
      return {
        totalEntries: 0,
        averageWeight: 0,
        weightLoss: 0,
        daysTracked: 0,
        streak: 0
      };
    }

    const weights = allEntries.map(entry => entry.weight);
    const averageWeight = weights.reduce((sum, weight) => sum + weight, 0) / weights.length;
    const firstEntry = allEntries[allEntries.length - 1];
    const latestEntry = allEntries[0];
    const weightLoss = firstEntry.weight - latestEntry.weight;
    
    // 連続記録日数を計算
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      const dateKey = getDateKey(checkDate);
      const dayData = dateBasedData[dateKey];
      
      if (dayData?.weightEntries && dayData.weightEntries.length > 0) {
        streak++;
      } else {
        break;
      }
    }

    return {
      totalEntries: allEntries.length,
      averageWeight: Math.round(averageWeight * 10) / 10,
      weightLoss: Math.round(weightLoss * 10) / 10,
      daysTracked: Object.keys(dateBasedData).filter(dateKey => 
        dateBasedData[dateKey].weightEntries && dateBasedData[dateKey].weightEntries.length > 0
      ).length,
      streak
    };
  };

  return {
    // データ
    weightData: getWeightDataForDate(selectedDate),
    weightEntries: getAllWeightEntries(),
    weightSettings: weightSettingsStorage.value,
    weightTrendData: getWeightTrendData() || [],
    weightStats: getWeightStats(),
    realWeightData, // 実データを追加
    
    // モーダル状態
    isWeightEntryModalOpen,
    isWeightSettingsModalOpen,
    
    // アクション
    handleAddWeightEntry,
    handleUpdateWeightEntry,
    handleDeleteWeightEntry,
    handleUpdateWeightSettings,
    
    // モーダル制御
    setIsWeightEntryModalOpen,
    setIsWeightSettingsModalOpen,
    
    // ユーティリティ
    getWeightDataForDate,
    getAllWeightEntries,
    getWeightTrendData,
    getWeightStats
  };
}