import { useState } from 'react';
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
  // モーダル状態管理
  const [isWeightEntryModalOpen, setIsWeightEntryModalOpen] = useState(false);
  const [isWeightSettingsModalOpen, setIsWeightSettingsModalOpen] = useState(false);
  
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
    const dayData = dateBasedData[dateKey];
    
    if (dayData?.weightEntries && dayData.weightEntries.length > 0) {
      return dayData.weightEntries[dayData.weightEntries.length - 1].weight;
    }
    
    // さらに前の日を検索（最大7日間）
    for (let i = 1; i <= 7; i++) {
      const searchDate = new Date(date);
      searchDate.setDate(searchDate.getDate() - i);
      const searchDateKey = getDateKey(searchDate);
      const searchDayData = dateBasedData[searchDateKey];
      
      if (searchDayData?.weightEntries && searchDayData.weightEntries.length > 0) {
        return searchDayData.weightEntries[searchDayData.weightEntries.length - 1].weight;
      }
    }
    
    return 0; // デフォルト値
  };

  // 体重記録を追加
  const handleAddWeightEntry = (data: { weight: number; bodyFat?: number; note?: string; photo?: string }) => {
    const newEntry: WeightEntry = {
      id: generateId(),
      date: getDateKey(selectedDate),
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
    weightTrendData: getWeightTrendData(),
    weightStats: getWeightStats(),
    
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