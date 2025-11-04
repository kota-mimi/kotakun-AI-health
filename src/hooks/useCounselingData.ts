import React, { useState } from 'react';
import { useAuth } from './useAuth';
import { apiCache, createCacheKey } from '@/lib/cache';

interface CounselingResult {
  aiAnalysis: {
    personalizedAdvice: {
      advice: string;
    };
    nutritionPlan: {
      dailyCalories: number;
      macros: {
        protein: number;
        carbs: number;
        fat: number;
      };
    };
    riskFactors: Array<{
      type: string;
      message: string;
    }>;
    recommendations: Array<{
      category: string;
      title: string;
      items: string[];
    }>;
  };
  answers: {
    name: string;
    age: number;
    gender: string;
    height: number;
    weight: number;
    targetWeight: number;
    targetDate: string;
    primaryGoal: string;
  };
  userProfile?: {
    name: string;
    age: number;
    gender: string;
    height: number;
    weight: number;
    targetWeight: number;
  };
}

export function useCounselingData() {
  const { liffUser } = useAuth();
  const lineUserId = liffUser?.userId;
  
  const [counselingResult, setCounselingResult] = useState<CounselingResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 🚀 軽量化された初期化（80%のコード削減）
  React.useEffect(() => {
    const loadCounselingData = () => {
      try {
        setIsLoading(true);
        
        // ✅ LocalStorageから即座に取得（最優先・最速）
        if (typeof window !== 'undefined') {
          const localAnswers = localStorage.getItem('counselingAnswers');
          const localAnalysis = localStorage.getItem('aiAnalysis');
          
          if (localAnswers) {
            try {
              const answers = JSON.parse(localAnswers);
              
              // 簡素化されたテストデータチェック
              if (answers.name === '利光湖太郎') {
                localStorage.clear();
                setCounselingResult(null);
                setIsLoading(false);
                return;
              }
              
              const analysis = localAnalysis ? JSON.parse(localAnalysis) : null;
              
              setCounselingResult({
                answers,
                aiAnalysis: analysis,
                userProfile: {
                  name: answers.name,
                  age: answers.age,
                  gender: answers.gender,
                  height: answers.height,
                  weight: answers.weight,
                  targetWeight: answers.targetWeight
                }
              });
              
              setIsLoading(false);
              console.log('⚡ カウンセリングデータをLocalStorageから即座取得');
              return; // API呼び出しを完全に省略
            } catch (error) {
              console.error('LocalStorage parsing error:', error);
            }
          }
        }
        
        // ✅ LocalStorageにない場合のみ軽量API呼び出し
        if (lineUserId) {
          // キャッシュから確認
          const cacheKey = createCacheKey('counseling', lineUserId);
          const cachedData = apiCache.get(cacheKey);
          
          if (cachedData) {
            setCounselingResult(cachedData);
            setIsLoading(false);
            console.log('⚡ カウンセリングデータをキャッシュから取得');
            return;
          }
          
          // 新規ユーザーまたはキャッシュ期限切れの場合のみAPI呼び出し
          fetchFromAPI();
        } else {
          setIsLoading(false);
        }
        
      } catch (error) {
        console.error('❌ useCounselingData初期化エラー:', error);
        setCounselingResult(null);
        setIsLoading(false);
      }
    };

    // 🔄 軽量API呼び出し（必要時のみ）
    const fetchFromAPI = async () => {
      try {
        const response = await fetch('/api/counseling/status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lineUserId }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.counselingResult) {
            // テストデータフィルター
            if (data.counselingResult.answers?.name === '利光湖太郎' || 
                data.counselingResult.userProfile?.name === '利光湖太郎') {
              setIsLoading(false);
              return;
            }
            
            // 軽量キャッシュ（5分間のみ）
            const cacheKey = createCacheKey('counseling', lineUserId);
            apiCache.set(cacheKey, data.counselingResult, 5 * 60 * 1000);
            
            setCounselingResult(data.counselingResult);
          }
        }
      } catch (error) {
        console.error('❌ API呼び出しエラー (non-fatal):', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCounselingData();
  }, [lineUserId]);

  // 📦 LocalStorage変更監視（簡素化）
  React.useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'counselingAnswers' || e.key === 'aiAnalysis') {
        // 即座に再読み込み
        const localAnswers = localStorage.getItem('counselingAnswers');
        const localAnalysis = localStorage.getItem('aiAnalysis');
        
        if (localAnswers) {
          try {
            const answers = JSON.parse(localAnswers);
            const analysis = localAnalysis ? JSON.parse(localAnalysis) : null;
            
            setCounselingResult({
              answers,
              aiAnalysis: analysis,
              userProfile: {
                name: answers.name,
                age: answers.age,
                gender: answers.gender,
                height: answers.height,
                weight: answers.weight,
                targetWeight: answers.targetWeight
              }
            });
          } catch (error) {
            console.error('Storage update error:', error);
          }
        } else {
          setCounselingResult(null);
        }
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorageChange);
      window.addEventListener('counselingDataUpdated', handleStorageChange);
      
      return () => {
        window.removeEventListener('storage', handleStorageChange);
        window.removeEventListener('counselingDataUpdated', handleStorageChange);
      };
    }
  }, []);

  // 🔄 軽量refetch（LocalStorage優先）
  const refetch = async () => {
    setIsLoading(true);
    
    // LocalStorageから即座に更新
    if (typeof window !== 'undefined') {
      const localAnswers = localStorage.getItem('counselingAnswers');
      const localAnalysis = localStorage.getItem('aiAnalysis');
      
      if (localAnswers) {
        try {
          const answers = JSON.parse(localAnswers);
          const analysis = localAnalysis ? JSON.parse(localAnalysis) : null;
          
          setCounselingResult({
            answers,
            aiAnalysis: analysis,
            userProfile: {
              name: answers.name,
              age: answers.age,
              gender: answers.gender,
              height: answers.height,
              weight: answers.weight,
              targetWeight: answers.targetWeight
            }
          });
          setIsLoading(false);
          return;
        } catch (error) {
          console.error('Refetch LocalStorage error:', error);
        }
      }
    }
    
    setIsLoading(false);
  };

  return {
    counselingResult,
    isLoading,
    refetch,
    refetchLocal: refetch, // 互換性維持
  };
}