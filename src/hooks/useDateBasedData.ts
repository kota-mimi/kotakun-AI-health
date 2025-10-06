import { useState } from 'react';
import { useLocalStorage } from './useLocalStorage';

interface WeightData {
  current: number;
  previous: number;
  target: number;
}

interface DateBasedDataEntry {
  mealData: {
    breakfast: any[];
    lunch: any[];
    dinner: any[];
    snack: any[];
  };
  exerciseData: any[];
  weightData: WeightData;
}

export function useDateBasedData() {
  // localStorage自動保存・復元機能
  const localStorage = useLocalStorage<Record<string, DateBasedDataEntry>>('healthApp_dateBasedData', {});

  // 日付のキーを生成（日本時間基準）
  const getDateKey = (date: Date) => {
    return date.toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' }); // YYYY-MM-DD形式（日本時間）
  };

  // 現在選択されている日付のデータを取得または初期化
  const getCurrentDateData = (selectedDate: Date) => {
    const dateKey = getDateKey(selectedDate);
    const dateBasedData = localStorage.value;
    if (!dateBasedData[dateKey]) {
      // 日付のデータが存在しない場合、初期データを作成
      const newDateData: DateBasedDataEntry = {
        mealData: {
          breakfast: [],
          lunch: [],
          dinner: [],
          snack: []
        },
        exerciseData: [],
        weightData: {
          current: 0,
          previous: 0,
          target: 0
        }
      };
      
      
      localStorage.setValue(prev => ({
        ...prev,
        [dateKey]: newDateData
      }));
      return newDateData;
    }
    return dateBasedData[dateKey];
  };

  // データ更新関数を日付別に変更（localStorage自動保存）
  const updateDateData = (selectedDate: Date, updates: Partial<DateBasedDataEntry>) => {
    const dateKey = getDateKey(selectedDate);
    localStorage.setValue(prev => ({
      ...prev,
      [dateKey]: {
        ...prev[dateKey],
        ...updates
      }
    }));
  };

  return {
    dateBasedData: localStorage.value,
    getCurrentDateData,
    updateDateData,
    getDateKey,
    // データ管理機能
    exportData: localStorage.exportData,
    importData: localStorage.importData,
    clearAllData: localStorage.removeValue
  };
}