import React, { useState } from 'react';
import { useAuth } from './useAuth';

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
  console.log('🔥 useCounselingData hook - LIVE API VERSION FOR PRODUCTION');
  const { liffUser } = useAuth();
  
  const lineUserId = liffUser?.userId;
  console.log('🔥 lineUserId:', lineUserId);
  
  const [counselingResult, setCounselingResult] = useState<CounselingResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // useEffectを使用して、完全に安全にデータを取得
  React.useEffect(() => {
    console.log('🔥 useEffect triggered');
    
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        if (!lineUserId) {
          console.log('🔥 No lineUserId, using localStorage only');
          // lineUserIdがない場合はローカルストレージのみ
          if (typeof window !== 'undefined') {
            const localAnswers = localStorage.getItem('counselingAnswers');
            const localAnalysis = localStorage.getItem('aiAnalysis');
            
            if (localAnswers) {
              console.log('🔥 Found local counseling data (no lineUserId)');
              const answers = JSON.parse(localAnswers);
              const analysis = localAnalysis ? JSON.parse(localAnalysis) : null;
              
              setCounselingResult({
                answers,
                aiAnalysis: analysis,
                userProfile: answers
              });
            }
          }
          setIsLoading(false);
          return;
        }

        console.log('🔥 Making API call with lineUserId:', lineUserId);
        
        // まずローカルストレージをチェック（即座に表示）
        if (typeof window !== 'undefined') {
          const localAnswers = localStorage.getItem('counselingAnswers');
          const localAnalysis = localStorage.getItem('aiAnalysis');
          
          if (localAnswers) {
            console.log('🔥 Setting localStorage data first for immediate display');
            const answers = JSON.parse(localAnswers);
            const analysis = localAnalysis ? JSON.parse(localAnalysis) : null;
            
            setCounselingResult({
              answers,
              aiAnalysis: analysis,
              userProfile: answers
            });
          }
        }
        
        // 次にFirestoreから最新データを取得（バックグラウンド）
        try {
          const response = await fetch('/api/counseling/status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lineUserId }),
          });

          console.log('🔥 API response status:', response.status);
          if (response.ok) {
            const data = await response.json();
            console.log('🔥 Firestore API SUCCESS! Data received:', data);
            
            if (data.counselingResult) {
              console.log('🔥 Updating with Firestore counseling result:', data.counselingResult);
              setCounselingResult(data.counselingResult);
            }
          } else {
            console.log('🔥 API error:', response.status, response.statusText);
            // APIエラーでもローカルストレージデータがあれば問題なし
          }
        } catch (apiError) {
          console.error('🔥 API fetch error (non-fatal):', apiError);
          // APIエラーでもローカルストレージデータがあれば問題なし
        }
        
      } catch (error) {
        console.error('🔥 Fatal error in useCounselingData:', error);
        // 最悪でもnullでエラーにならない
        setCounselingResult(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [lineUserId]);
  
  console.log('🔥 Current counselingResult:', counselingResult);

  return {
    counselingResult,
    isLoading,
    refetch: async () => {
      console.log('🔥 Manual refetch called');
      try {
        setIsLoading(true);
        
        // まずローカルストレージから最新のデータを確認
        if (typeof window !== 'undefined') {
          const localAnswers = localStorage.getItem('counselingAnswers');
          const localAnalysis = localStorage.getItem('aiAnalysis');
          
          if (localAnswers) {
            console.log('🔥 Refetch: Found local counseling data, using it');
            const answers = JSON.parse(localAnswers);
            const analysis = localAnalysis ? JSON.parse(localAnalysis) : null;
            
            setCounselingResult({
              answers,
              aiAnalysis: analysis,
              userProfile: answers
            });
          }
        }

        // APIからも取得を試行（エラーでも無視）
        if (lineUserId) {
          try {
            const response = await fetch('/api/counseling/status', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ lineUserId }),
            });
            if (response.ok) {
              const data = await response.json();
              if (data.counselingResult) {
                setCounselingResult(data.counselingResult);
              }
            }
          } catch (apiError) {
            console.log('🔥 Refetch API error (ignored):', apiError);
            // エラーは無視、ローカルストレージデータを使用
          }
        }
      } catch (error) {
        console.error('🔥 Refetch fatal error:', error);
      } finally {
        setIsLoading(false);
      }
    },
  };
}