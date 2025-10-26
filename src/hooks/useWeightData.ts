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
  
  // 実データ取得用のstate
  const [realWeightData, setRealWeightData] = useState<Array<{date: string; weight: number}>>([]);
  const [isClient, setIsClient] = useState(false);
  const [isLoadingWeightData, setIsLoadingWeightData] = useState(true);
  
  // クライアントサイドでのマウントを確認
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Firestoreから体重データを取得（定期的に更新）
  useEffect(() => {
    if (!isClient) return;
    
    const fetchWeightData = async () => {
      const lineUserId = liffUser?.userId;
      if (!lineUserId) return;
      
      // キャッシュキー生成
      const cacheKey = createCacheKey('weight', lineUserId, 'month');
      
      // キャッシュチェック
      const cachedData = apiCache.get(cacheKey);
      if (cachedData) {
        console.log('🎯 体重データをキャッシュから取得');
        setRealWeightData(cachedData);
        setIsLoadingWeightData(false);
        return;
      }
      
      try {
        console.log('🔄 体重データをAPIから取得');
        const response = await fetch(`/api/weight?lineUserId=${lineUserId}&period=month`);
        if (response.ok) {
          const result = await response.json();
          const weightData = result.data || [];
          
          // キャッシュに保存（5分間有効）
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
  }, [selectedDate, liffUser?.userId, isClient]);
  
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
    const dateKey = getDateKey(selectedDate);
    return dateBasedData[dateKey] || { weightData: { current: 0, previous: 0, target: 0 } };
  };

  // 日付のキーを生成（日本時間基準で統一）
  const getDateKey = (date: Date) => {
    return date.toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' });
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

  // カウンセリング日かどうかをチェック
  const isCounselingDate = (checkDate: Date): boolean => {
    if (!counselingResult) return false;
    const counselingDateRaw = counselingResult.firstCompletedAt || 
                             counselingResult.createdAt || 
                             counselingResult.completedAt;
    if (!counselingDateRaw) return false;
    const counselingDate = new Date(counselingDateRaw);
    return checkDate.toDateString() === counselingDate.toDateString();
  };

  // 特定の日付の体重データを取得
  const getWeightDataForDate = (date: Date): WeightData => {
    // クライアントサイドでない場合はデフォルト値を返す
    if (!isClient) {
      return {
        current: 0,
        previous: 0,
        target: 68.0
      };
    }
    
    const dateKey = getDateKey(date);
    const today = getDateKey(new Date());
    
    // 未来の日付の場合は体重を表示しない
    if (dateKey > today) {
      return {
        current: 0, // 未来の日付は体重を表示しない
        previous: 0, // 未来なので前日比は表示しない
        target: weightSettingsStorage.value.targetWeight || 68.0
      };
    }
    
    // 最優先: realWeightDataから該当日付のデータを確認
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
        target: weightSettingsStorage.value.targetWeight || 68.0
      };
    }
    
    // 2番目の優先順位: ローカルデータを確認
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
        target: weightSettingsStorage.value.targetWeight || 68.0
      };
    }
    
    // 最後のフォールバック: カウンセリング日の場合のみカウンセリング体重を返す
    // ただし、APIデータがまだ読み込み中で、今日またはカウンセリング日の場合のみ
    if (isLoadingWeightData && (dateKey === today || isCounselingDate(date)) && counselingResult?.answers?.weight) {
      return {
        current: counselingResult.answers.weight,
        previous: 0, // カウンセリング日は前日比なし
        target: weightSettingsStorage.value.targetWeight || 68.0
      };
    }
    
    // デフォルトデータを返す（記録がない日は0を返す）
    return {
      current: 0, // 記録がない日は体重を表示しない
      previous: 0, // 記録がない日は前日比なし
      target: weightSettingsStorage.value.targetWeight || 68.0
    };
  };

  // 最新の体重を取得（未来日付用）
  const getLatestWeight = (): number => {
    // まずrealWeightDataから最新の体重を取得
    if (realWeightData.length > 0) {
      const sortedData = realWeightData
        .filter(item => item.weight && item.weight > 0)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      if (sortedData.length > 0) {
        return sortedData[0].weight;
      }
    }
    
    // realWeightDataにない場合はlocalDataから検索
    const today = new Date();
    for (let i = 0; i <= 30; i++) { // 最大30日前まで検索
      const searchDate = new Date(today);
      searchDate.setDate(searchDate.getDate() - i);
      const searchDateKey = getDateKey(searchDate);
      
      const dayData = dateBasedData[searchDateKey];
      if (dayData?.weightEntries && dayData.weightEntries.length > 0) {
        const latestEntry = dayData.weightEntries[dayData.weightEntries.length - 1];
        if (latestEntry.weight > 0) {
          return latestEntry.weight;
        }
      }
    }
    
    return 0; // 何も見つからない場合
  };

  // 前日の体重を取得（その日の実際の記録を正確に取得）
  const getPreviousWeight = (date: Date): number => {
    const dateKey = getDateKey(date);
    
    // 指定された日付の実際の記録を取得（realWeightDataから）
    const realDataForDate = realWeightData.find(item => item.date === dateKey);
    if (realDataForDate && realDataForDate.weight > 0) {
      return realDataForDate.weight;
    }
    
    // fallback: ローカルデータから確認
    const dayData = dateBasedData[dateKey];
    
    if (dayData?.weightEntries && dayData.weightEntries.length > 0) {
      return dayData.weightEntries[dayData.weightEntries.length - 1].weight;
    }
    
    // その日に記録がない場合は0を返す（前日比を表示しない）
    return 0;
  };

  // 体重記録を追加
  const handleAddWeightEntry = async (data: { weight?: number; note?: string; photo?: string }) => {
    const lineUserId = liffUser?.userId;
    const dateStr = getDateKey(selectedDate);
    
    try {
      // APIに送信（体重と体脂肪のどちらかまたは両方）
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

      // ローカルデータも更新
      const newEntry: WeightEntry = {
        id: generateId(),
        date: dateStr,
        weight: data.weight || 0, // 体重が未入力の場合は0
        note: data.note,
        photo: data.photo,
        time: new Date().toTimeString().slice(0, 5),
        timestamp: Date.now()
      };

      const currentData = getCurrentDateData();
      const existingEntries = currentData.weightEntries || [];
      
      // 体重データの更新（体重が記録された場合のみ更新）
      const weightDataUpdate = data.weight ? {
        current: data.weight,
        previous: getPreviousWeight(selectedDate),
        target: weightSettingsStorage.value.targetWeight
      } : getCurrentDateData().weightData;

      updateDateData({
        weightEntries: [...existingEntries, newEntry],
        weightData: weightDataUpdate
      });

      // realWeightDataも即座に更新（体重が記録された場合）
      if (data.weight) {
        const newRealWeightEntry = {
          date: dateStr,
          weight: data.weight || 0
        };
        
        setRealWeightData(prevData => {
          // 既存の同じ日付のデータを削除して新しいデータを追加
          const filteredData = prevData.filter(item => item.date !== dateStr);
          return [...filteredData, newRealWeightEntry].sort((a, b) => 
            new Date(a.date).getTime() - new Date(b.date).getTime()
          );
        });
      }

      console.log('記録が正常に保存されました');
    } catch (error) {
      console.error('記録保存エラー:', error);
      alert('記録の保存に失敗しました。もう一度お試しください。');
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
    
    // キャッシュをクリアして最新データを再取得
    if (liffUser?.userId) {
      const cacheKey = createCacheKey('weight', liffUser.userId, 'month');
      apiCache.delete(cacheKey);
      
      // 最新データを即座に再取得
      const fetchWeightData = async () => {
        try {
          const response = await fetch(`/api/weight?lineUserId=${liffUser.userId}&period=month`);
          if (response.ok) {
            const result = await response.json();
            const weightData = result.data || [];
            
            // キャッシュに保存（5分間有効）
            apiCache.set(cacheKey, weightData, 5 * 60 * 1000);
            setRealWeightData(weightData);
          }
        } catch (error) {
          console.error('体重データ再取得エラー:', error);
        }
      };
      
      fetchWeightData();
    }
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
    
    const trendData: { date: string; weight: number }[] = [];
    
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateKey = getDateKey(d);
      const dayData = dateBasedData[dateKey];
      
      if (dayData?.weightEntries && dayData.weightEntries.length > 0) {
        const latestEntry = dayData.weightEntries[dayData.weightEntries.length - 1];
        trendData.push({
          date: dateKey,
          weight: latestEntry.weight
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
    isLoadingWeightData, // ローディング状態を追加
    
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