import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { apiCache, createCacheKey, CACHE_TTL } from '@/lib/cache';

interface FeedbackData {
  date: string;
  feedback: string;
  foodEvaluation: {
    goodPoints: string;
    improvements: string;
  };
  exerciseEvaluation: {
    goodPoints: string;
    improvements: string;
  };
}

export function useFeedbackData(selectedDate: Date, dateBasedData: any, updateDateData: (updates: any) => void) {
  const { liffUser } = useAuth();
  
  // フィードバックデータ取得用のstate
  const [feedbackData, setFeedbackData] = useState<FeedbackData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isClient, setIsClient] = useState(false);
  
  // クライアントサイドでのマウントを確認
  useEffect(() => {
    setIsClient(true);
  }, []);

  // 自動でフィードバックデータを取得
  useEffect(() => {
    if (!isClient) return;
    
    const fetchFeedbackData = async () => {
      const lineUserId = liffUser?.userId;
      
      if (!lineUserId) {
        setIsLoading(false);
        return;
      }
      
      // 未来の日付は取得しない
      const today = getDateKey(new Date());
      if (dateStr > today) return;
      
      // キャッシュキー生成
      const cacheKey = createCacheKey('feedback', lineUserId, dateStr);
      
      // キャッシュチェック
      const cachedData = apiCache.get(cacheKey);
      if (cachedData) {
        setFeedbackData(cachedData);
        return;
      }
      
      try {
        const response = await fetch('/api/feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lineUserId,
            date: dateStr
          }),
        });

        if (response.ok) {
          const result = await response.json();
          const feedbackItem = result.data;
          
          // フィードバックデータが存在する場合のみ処理
          if (feedbackItem && feedbackItem.feedback && feedbackItem.feedback.trim()) {
            const parsedFeedback = parseFeedbackText(feedbackItem.feedback);
            
            const feedbackData = {
              date: dateStr,
              feedback: feedbackItem.feedback,
              ...parsedFeedback
            };
            
            // キャッシュに保存（15分間有効 - フィードバックデータ）
            apiCache.set(cacheKey, feedbackData, CACHE_TTL.FEEDBACK);
            setFeedbackData(feedbackData);
          }
        }
      } catch (error) {
        console.error('フィードバック取得エラー:', error);
      }
    };

    fetchFeedbackData();
  }, [selectedDate, liffUser?.userId, isClient]);

  // 日付のキーを生成（日本時間基準で統一）
  const getDateKey = (date: Date) => {
    return date.toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' });
  };

  // フィードバックテキストを解析してセクション分け
  const parseFeedbackText = (feedbackText: string) => {
    const lines = feedbackText.split('\n').filter(line => line.trim());
    
    // 食事評価セクションを抽出
    const foodSection = extractSection(lines, '■ 食事評価', '■ 運動評価');
    const foodGoodPoints = foodSection.split('改善点:')[0].replace('良かった点:', '').trim() || '・栄養バランスを意識した食事選択ができています';
    const foodImprovements = foodSection.split('改善点:')[1]?.trim() || '・野菜不足が気になります\n・水分補給を意識してください';
    
    // 運動評価セクションを抽出
    const exerciseSection = extractSection(lines, '■ 運動評価', '');
    const exerciseGoodPoints = exerciseSection.split('改善提案:')[0].replace('良かった点:', '').trim() || '・継続的な運動習慣が素晴らしいです';
    const exerciseImprovements = exerciseSection.split('改善提案:')[1]?.trim() || '・筋トレと有酸素のバランスを意識\n・運動前後のストレッチを追加';
    
    return {
      foodEvaluation: {
        goodPoints: foodGoodPoints,
        improvements: foodImprovements
      },
      exerciseEvaluation: {
        goodPoints: exerciseGoodPoints,
        improvements: exerciseImprovements
      }
    };
  };

  // テキストから特定セクションを抽出するヘルパー関数
  const extractSection = (lines: string[], startMarker: string, endMarker: string): string => {
    const startIndex = lines.findIndex(line => line.includes(startMarker));
    if (startIndex === -1) return '';
    
    let endIndex = lines.length;
    if (endMarker) {
      const foundEndIndex = lines.findIndex((line, index) => index > startIndex && line.includes(endMarker));
      if (foundEndIndex !== -1) {
        endIndex = foundEndIndex;
      }
    }
    
    return lines.slice(startIndex + 1, endIndex)
      .filter(line => !line.includes('━━━━━━━━━━━━━━━━━━━━'))
      .join('\n')
      .trim();
  };

  // フィードバックデータを生成
  const generateFeedback = async () => {
    const lineUserId = liffUser?.userId;
    const dateStr = getDateKey(selectedDate);
    
    if (!lineUserId) return;
    
    setIsLoading(true);
    
    // キャッシュキー生成
    const cacheKey = createCacheKey('feedback', lineUserId, dateStr);
    
    // キャッシュチェック
    const cachedData = apiCache.get(cacheKey);
    if (cachedData) {
      setFeedbackData(cachedData);
      setIsLoading(false);
      return;
    }
    
    try {
      const response = await fetch('/api/daily-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lineUserId,
          date: dateStr
        }),
      });

      if (response.ok) {
        const result = await response.json();
        const feedbackText = result.feedback || '';
        
        const parsedFeedback = parseFeedbackText(feedbackText);
        
        const feedbackData = {
          date: dateStr,
          feedback: feedbackText,
          ...parsedFeedback
        };
        
        // キャッシュに保存（15分間有効）
        apiCache.set(cacheKey, feedbackData, CACHE_TTL.FEEDBACK);
        setFeedbackData(feedbackData);
        
      } else if (response.status === 403) {
        // 利用制限エラーの場合
        const errorData = await response.json();
        alert(errorData.error || 'フィードバック機能は有料プランの機能です。プランをアップグレードしてご利用ください。');
        console.error('フィードバック制限エラー:', errorData.error);
      } else {
        console.error('フィードバック取得に失敗しました');
      }
    } catch (error) {
      console.error('フィードバック取得エラー:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 選択した日付のフィードバックデータを取得
  const getFeedbackDataForDate = (date: Date): FeedbackData | null => {
    if (!isClient) return null;
    
    const dateKey = getDateKey(date);
    const today = getDateKey(new Date());
    
    // 未来の日付の場合はnullを返す
    if (dateKey > today) return null;
    
    return feedbackData;
  };

  // データが存在するかチェック
  const hasFeedbackData = () => {
    const dateKey = getDateKey(selectedDate);
    const today = getDateKey(new Date());
    
    // 未来の日付または今日より前で記録がない場合
    if (dateKey > today) return false;
    
    return feedbackData !== null;
  };

  return {
    // データ
    feedbackData: getFeedbackDataForDate(selectedDate),
    isLoading,
    hasFeedbackData: hasFeedbackData(),
    
    // アクション
    generateFeedback,
    
    // ユーティリティ
    getFeedbackDataForDate
  };
}