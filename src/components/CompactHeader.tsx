import { useState } from 'react';
import { Button } from './ui/button';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

interface CompactHeaderProps {
  currentDate: Date;
  onDateSelect: (date: Date) => void;
  onCalendar: () => void;
  onNavigateToProfile?: () => void;
  onNavigateToData?: () => void;
  customContent?: React.ReactNode;
  counselingResult?: any;
}

export function CompactHeader({ currentDate, onDateSelect, onCalendar, onNavigateToProfile, onNavigateToData, customContent, counselingResult }: CompactHeaderProps) {
  const [selectedWeek, setSelectedWeek] = useState(0);

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
    const appStartDate = getAppStartDate();
    const today = new Date();
    
    // アプリ開始日からの経過週数を計算
    const msPerDay = 24 * 60 * 60 * 1000;
    const daysSinceStart = Math.floor((today.getTime() - appStartDate.getTime()) / msPerDay);
    const weeksSinceStart = Math.floor(daysSinceStart / 7);
    
    // 週オフセットが負の場合、アプリ開始前には戻れない
    const actualWeekOffset = Math.max(weekOffset, -weeksSinceStart);
    
    // アプリ開始日を基準に週の開始を計算
    const startOfWeek = new Date(appStartDate);
    startOfWeek.setDate(appStartDate.getDate() + actualWeekOffset * 7);
    
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
  
  // 前の週に戻れるかチェック
  const canGoPrevious = () => {
    const appStartDate = getAppStartDate();
    const msPerDay = 24 * 60 * 60 * 1000;
    const today = new Date();
    const daysSinceStart = Math.floor((today.getTime() - appStartDate.getTime()) / msPerDay);
    const weeksSinceStart = Math.floor(daysSinceStart / 7);
    return selectedWeek > -weeksSinceStart;
  };
  
  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSameDate = (date1: Date, date2: Date) => {
    return date1.toDateString() === date2.toDateString();
  };

  const currentMonth = currentDate.toLocaleDateString('ja-JP', { 
    year: 'numeric', 
    month: 'long' 
  });

  return (
    <div className="backdrop-blur-xl bg-white/95 border-b border-slate-200/50 shadow-sm">
      {/* メインヘッダー */}
      <div className="px-4 py-4 flex items-center justify-between">
        {/* 月表示（中央） */}
        <div className="flex-1 text-center">
          {customContent || <h1 className="text-lg font-semibold text-slate-900">{currentMonth}</h1>}
        </div>

        {/* カレンダーボタン */}
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
      <div className="px-4 pb-4">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedWeek(selectedWeek - 1)}
            disabled={!canGoPrevious()}
            className={`w-8 h-8 p-0 rounded-lg ${
              canGoPrevious() 
                ? 'hover:bg-slate-100/80 text-slate-600' 
                : 'text-slate-300 cursor-not-allowed'
            }`}
          >
            <ChevronLeft size={16} />
          </Button>
          
          <div className="grid grid-cols-7 gap-1 flex-1 mx-3">
            {weekDates.map((date, index) => {
              const appStartDate = getAppStartDate();
              const isBeforeAppStart = date < appStartDate;
              
              // 日付が無効な場合のフォールバック
              const dateKey = isNaN(date.getTime()) ? `invalid-${index}` : date.toISOString();
              
              return (
                <Button
                  key={dateKey}
                  variant="ghost"
                  onClick={() => !isBeforeAppStart && onDateSelect(date)}
                  disabled={isBeforeAppStart}
                  className={`h-12 flex flex-col p-1 rounded-xl transition-all ${
                    isBeforeAppStart
                      ? 'text-slate-300 cursor-not-allowed'
                      : isSameDate(date, currentDate)
                      ? 'bg-health-primary text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100/60'
                  }`}
                >
                <span className="text-xs font-medium opacity-80">{dayNames[index]}</span>
                <span className="text-sm font-semibold">
                  {date.getDate()}
                </span>
              </Button>
              );
            })}
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedWeek(selectedWeek + 1)}
            className="w-8 h-8 p-0 rounded-lg hover:bg-slate-100/80 text-slate-600"
          >
            <ChevronRight size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
}