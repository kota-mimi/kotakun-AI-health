import { useState } from 'react';
import { Button } from './ui/button';
import { ChevronLeft, ChevronRight, Calendar, Share2 } from 'lucide-react';

interface CompactHeaderProps {
  currentDate: Date;
  onDateSelect: (date: Date) => void;
  onCalendar: () => void;
  onNavigateToProfile?: () => void;
  onNavigateToData?: () => void;
  customContent?: React.ReactNode;
  counselingResult?: any;
  hasRecordsForDate?: (date: Date) => boolean;
  onShareRecord?: () => void;
}

export function CompactHeader({ currentDate, onDateSelect, onCalendar, onNavigateToProfile, onNavigateToData, customContent, counselingResult, hasRecordsForDate, onShareRecord }: CompactHeaderProps) {
  // currentDateから今日までの週オフセットを計算（日曜日始まりの週で計算）
  const calculateWeekOffset = () => {
    const today = new Date();
    
    // 今日を含む週の開始日（日曜日）を計算
    const todayWeekStart = new Date(today);
    todayWeekStart.setDate(today.getDate() - today.getDay());
    
    // currentDateを含む週の開始日（日曜日）を計算
    const currentWeekStart = new Date(currentDate);
    currentWeekStart.setDate(currentDate.getDate() - currentDate.getDay());
    
    // 週の差を計算
    const msPerWeek = 7 * 24 * 60 * 60 * 1000;
    const weekDiff = Math.round((currentWeekStart.getTime() - todayWeekStart.getTime()) / msPerWeek);
    
    return weekDiff;
  };
  
  const selectedWeek = calculateWeekOffset();

  // アプリ開始日を取得（最初のカウンセリング完了日）
  const getAppStartDate = () => {
    if (!counselingResult) return new Date();
    
    // 最初のカウンセリング完了日を優先的に使用
    // firstCompletedAtがない場合は、createdAtかcompletedAtを使用
    const counselingDateRaw = counselingResult.firstCompletedAt || 
                             counselingResult.createdAt || 
                             counselingResult.completedAt;
    
    if (counselingDateRaw) {
      let date = new Date(counselingDateRaw);
      // 日付が無効な場合は現在の日付を返す
      if (isNaN(date.getTime())) {
        console.warn('⚠️ Invalid counseling date in CompactHeader:', counselingDateRaw);
        date = new Date();
      }
      return date;
    }
    return new Date();
  };

  const getWeekDates = (weekOffset: number = 0) => {
    const today = new Date();
    
    // 今日を基準に週の開始を計算（制限なし）
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() + weekOffset * 7 - today.getDay());
    
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const weekDates = getWeekDates(selectedWeek);
  const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
  
  // 前の週に戻れるかチェック（アプリ開始日の週まで戻れる）
  const canGoPrevious = () => {
    const appStartDate = getAppStartDate();
    const today = new Date();
    
    // アプリ開始日の週の開始日を計算
    const appStartDayOfWeek = appStartDate.getDay();
    const appStartWeekStart = new Date(appStartDate);
    appStartWeekStart.setDate(appStartDate.getDate() - appStartDayOfWeek);
    
    // 現在表示中の週の開始日を計算
    const currentWeekStart = new Date(today);
    currentWeekStart.setDate(today.getDate() + selectedWeek * 7 - today.getDay());
    
    // アプリ開始日の週まで戻れる
    return currentWeekStart >= appStartWeekStart;
  };
  
  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSameDate = (date1: Date, date2: Date) => {
    if (!date1 || !date2) return false;
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  };

  const currentMonth = currentDate.toLocaleDateString('ja-JP', { 
    year: 'numeric', 
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="bg-white shadow-sm border border-gray-200 rounded-xl mx-4 my-2">
      {/* メインヘッダー */}
      <div className="px-4 py-4 flex items-center justify-between">
        {/* 共有ボタン（左）- 常に表示 */}
        <button
          onClick={onShareRecord || (() => console.log('Share clicked but no handler'))}
          className="w-10 h-10 p-0 text-slate-600 hover:text-slate-800 hover:bg-slate-100/80 rounded-xl transition-all bg-transparent border-none cursor-pointer flex items-center justify-center"
          title="記録を共有"
        >
          <Share2 size={20} />
        </button>

        {/* 月表示（中央） */}
        <div className="flex-1 text-center">
          {customContent || <h1 className="text-lg font-semibold text-slate-900">{currentMonth}</h1>}
        </div>

        {/* カレンダーボタン（右） */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onCalendar}
          className="w-10 h-10 p-0 text-slate-600 hover:text-slate-800 hover:bg-slate-100/80 rounded-xl"
        >
          <Calendar size={20} />
        </Button>
      </div>

      {/* 週間カレンダー */}
      <div className="px-4 pb-3">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const prevWeek = new Date(currentDate);
              prevWeek.setDate(currentDate.getDate() - 7);
              onDateSelect(prevWeek);
            }}
            className="w-8 h-8 p-0 rounded-lg hover:bg-slate-100/80 text-slate-600"
          >
            <ChevronLeft size={16} />
          </Button>
          
          <div className="flex gap-2 flex-1 mx-3 justify-between">
            {weekDates.map((date, index) => {
              // 日付が無効な場合のフォールバック
              const dateKey = isNaN(date.getTime()) ? `invalid-${index}` : date.toISOString();
              
              const hasRecords = hasRecordsForDate ? hasRecordsForDate(date) : false;
              const debugDateKey = date.toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' });
              console.log(`📅 Date ${debugDateKey}: hasRecords=${hasRecords}`);
              
              return (
                <button
                  key={dateKey}
                  onClick={() => onDateSelect(date)}
                  className={`flex flex-col items-center py-2 px-3 rounded-xl transition-all ${
                    isSameDate(date, currentDate)
                      ? 'bg-health-primary text-white shadow-lg'
                      : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
                  }`}
                  style={{
                    ...(hasRecords && !isSameDate(date, currentDate) && {
                      borderColor: '#60a5fa'
                    })
                  }}
                >
                  {/* 曜日名 */}
                  <span className={`text-xs font-medium mb-1 ${
                    isSameDate(date, currentDate) ? 'text-white' : 'text-slate-500'
                  }`}>
                    {dayNames[date.getDay()]}
                  </span>
                  
                  {/* 日付 */}
                  <span className={`text-sm font-semibold ${
                    isSameDate(date, currentDate) ? 'text-white' : 'text-slate-700'
                  }`}>
                    {date.getDate()}
                  </span>
                </button>
              );
            })}
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const nextWeek = new Date(currentDate);
              nextWeek.setDate(currentDate.getDate() + 7);
              onDateSelect(nextWeek);
            }}
            className="w-8 h-8 p-0 rounded-lg hover:bg-slate-100/80 text-slate-600"
          >
            <ChevronRight size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
}