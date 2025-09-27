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

  // 日付のキーを生成
  const getDateKey = (date: Date) => {
    return date.toISOString().split('T')[0]; // YYYY-MM-DD形式
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
          current: 72.5,
          previous: 72.7,
          target: 68.0
        }
      };
      
      // 今日の場合はサンプルデータを入れる
      const today = new Date();
      if (dateKey === getDateKey(today)) {
        newDateData.mealData = {
          breakfast: [
            {
              id: '1',
              name: 'オートミール＋バナナ',
              calories: 420,
              protein: 12,
              fat: 8,
              carbs: 68,
              time: '8:30',
              images: [
                'https://images.unsplash.com/photo-1610406765661-57646c40da59?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvYXRtZWFsJTIwYmFuYW5hJTIwYnJlYWtmYXN0JTIwYm93bHxlbnwxfHx8fDE3NTY1NDM4ODl8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
              ],
              foodItems: [
                { id: '1a', name: 'オートミール', calories: 150, protein: 5, fat: 3, carbs: 25 },
                { id: '1b', name: 'バナナ', calories: 90, protein: 1, fat: 0, carbs: 23 },
                { id: '1c', name: 'アーモンドミルク', calories: 180, protein: 6, fat: 5, carbs: 20 }
              ]
            }
          ],
          lunch: [
            {
              id: '2',
              name: 'サラダチキン弁当',
              calories: 680,
              protein: 45,
              fat: 15,
              carbs: 55,
              time: '12:45',
              images: [
                'https://images.unsplash.com/photo-1580013759032-c96505e24c1f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaGlja2VuJTIwc2FsYWQlMjBsdW5jaCUyMGJlbnRvfGVufDF8fHx8MTc1NjU0Mzg5M3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
              ],
              foodItems: [
                { id: '2a', name: 'サラダチキン', calories: 300, protein: 35, fat: 5, carbs: 0 },
                { id: '2b', name: 'サラダ野菜', calories: 50, protein: 3, fat: 0, carbs: 10 },
                { id: '2c', name: '玄米', calories: 330, protein: 7, fat: 10, carbs: 45 }
              ]
            }
          ],
          dinner: [
            {
              id: '3',
              name: '鮭の塩焼き定食',
              calories: 480,
              protein: 28,
              fat: 22,
              carbs: 57,
              time: '19:30',
              image: 'https://images.unsplash.com/photo-1735315050688-010b5b548054?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxncmlsbGVkJTIwc2FsbW9uJTIwZGlubmVyJTIwamFwYW5lc2V8ZW58MXx8fHwxNzU2NTQzODk3fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
            }
          ],
          snack: []
        };
        newDateData.exerciseData = [
          {
            id: '1',
            name: 'ランニング',
            type: 'cardio',
            duration: 30,
            calories: 280,
            distance: 5.2,
            time: '7:00',
            notes: '朝のジョギング'
          },
          {
            id: '2',
            name: 'ベンチプレス',
            type: 'strength',
            duration: 25,
            calories: 120,
            sets: [
              { weight: 50, reps: 12 },
              { weight: 55, reps: 10 },
              { weight: 60, reps: 8 }
            ],
            time: '18:30'
          }
        ];
      }
      
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