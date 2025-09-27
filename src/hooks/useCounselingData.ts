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
  
  const lineUserId = liffUser?.userId || 'U7fd12476d6263912e0d9c99fc3a6bef9';
  console.log('🔥 lineUserId:', lineUserId);
  
  const [counselingResult, setCounselingResult] = useState<CounselingResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // useLayoutEffectを使用してSSRの問題を回避
  React.useLayoutEffect(() => {
    console.log('🔥 useLayoutEffect triggered');
    
    const fetchData = async () => {
      if (!lineUserId) {
        console.log('🔥 No lineUserId, skipping API call');
        setIsLoading(false);
        return;
      }

      console.log('🔥 Making API call with lineUserId:', lineUserId);
      
      try {
        const response = await fetch('/api/counseling/status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lineUserId }),
        });

        console.log('🔥 API response status:', response.status);
        if (response.ok) {
          const data = await response.json();
          console.log('🔥 API SUCCESS! Data received:', data);
          
          if (data.counselingResult) {
            console.log('🔥 Setting counseling result:', data.counselingResult);
            setCounselingResult(data.counselingResult);
          } else {
            console.log('🔥 No counseling result in response');
          }
        } else {
          console.log('🔥 API error:', response.status, response.statusText);
        }
      } catch (error) {
        console.error('🔥 API fetch error:', error);
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
      // useEffectと同じロジックを再実行
      if (lineUserId) {
        setIsLoading(true);
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
        } catch (error) {
          console.error('Refetch failed:', error);
        } finally {
          setIsLoading(false);
        }
      }
    },
  };
}