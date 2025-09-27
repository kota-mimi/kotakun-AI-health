import { useState, useEffect } from 'react';

/**
 * localStorage自動保存・復元フック
 * データの永続化を自動的に処理します
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  // 初期値の設定（localStorageから復元を試行）
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      // ブラウザ環境チェック
      if (typeof window === 'undefined') {
        return initialValue;
      }

      // localStorageからデータを取得
      const item = window.localStorage.getItem(key);
      
      if (item === null) {
        return initialValue;
      }

      // JSONパース（破損データのエラーハンドリング）
      const parsedItem = JSON.parse(item);
      
      // データの整合性チェック
      if (typeof parsedItem === typeof initialValue) {
        return parsedItem;
      } else {
        console.warn(`localStorage data type mismatch for key "${key}". Using initial value.`);
        return initialValue;
      }
    } catch (error) {
      console.error(`Error loading from localStorage for key "${key}":`, error);
      return initialValue;
    }
  });

  // 値の設定（localStorageに自動保存）
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      // 関数の場合は現在の値を使って実行
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      // 状態を更新
      setStoredValue(valueToStore);
      
      // ブラウザ環境チェック
      if (typeof window !== 'undefined') {
        // localStorageに保存
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error(`Error saving to localStorage for key "${key}":`, error);
    }
  };

  // データの削除
  const removeValue = () => {
    try {
      setStoredValue(initialValue);
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key);
      }
    } catch (error) {
      console.error(`Error removing from localStorage for key "${key}":`, error);
    }
  };

  // データのエクスポート（バックアップ機能）
  const exportData = () => {
    try {
      return JSON.stringify(storedValue, null, 2);
    } catch (error) {
      console.error(`Error exporting data for key "${key}":`, error);
      return null;
    }
  };

  // データのインポート（復元機能）
  const importData = (jsonString: string) => {
    try {
      const importedData = JSON.parse(jsonString);
      if (typeof importedData === typeof initialValue) {
        setValue(importedData);
        return true;
      } else {
        console.warn(`Imported data type mismatch for key "${key}"`);
        return false;
      }
    } catch (error) {
      console.error(`Error importing data for key "${key}":`, error);
      return false;
    }
  };

  return {
    value: storedValue,
    setValue,
    removeValue,
    exportData,
    importData
  };
}

/**
 * 複数のlocalStorageキーをまとめて管理するフック
 */
export function useMultipleLocalStorage<T extends Record<string, any>>(
  keyPrefix: string,
  initialData: T
) {
  const storageKey = `${keyPrefix}_data`;
  const localStorage = useLocalStorage(storageKey, initialData);

  // 特定のキーの値を更新
  const updateKey = <K extends keyof T>(key: K, value: T[K] | ((prev: T[K]) => T[K])) => {
    localStorage.setValue(prev => ({
      ...prev,
      [key]: value instanceof Function ? value(prev[key]) : value
    }));
  };

  // 複数のキーを一括更新
  const updateMultiple = (updates: Partial<T>) => {
    localStorage.setValue(prev => ({
      ...prev,
      ...updates
    }));
  };

  // 特定のキーをリセット
  const resetKey = <K extends keyof T>(key: K) => {
    localStorage.setValue(prev => ({
      ...prev,
      [key]: initialData[key]
    }));
  };

  return {
    data: localStorage.value,
    updateKey,
    updateMultiple,
    resetKey,
    setValue: localStorage.setValue,
    removeValue: localStorage.removeValue,
    exportData: localStorage.exportData,
    importData: localStorage.importData
  };
}