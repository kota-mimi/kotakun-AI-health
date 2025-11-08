import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface CalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  counselingResult?: any;
  hasRecordsForDate?: (date: Date) => boolean;
}

export function CalendarModal({ isOpen, onClose, selectedDate, onDateSelect, counselingResult, hasRecordsForDate }: CalendarModalProps) {
  const [currentMonth, setCurrentMonth] = useState(selectedDate);

  const handleDateSelect = (date: Date | undefined) => {
    if (date && !isBeforeCounselingDate(date)) {
      onDateSelect(date);
      onClose();
    }
  };

  const handleMonthChange = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    if (direction === 'prev') {
      newMonth.setMonth(newMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1);
    }
    setCurrentMonth(newMonth);
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentMonth(today);
    onDateSelect(today);
    onClose();
  };

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString('ja-JP', { 
      year: 'numeric', 
      month: 'long' 
    });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelectedDate = (date: Date) => {
    return date.toDateString() === selectedDate.toDateString();
  };

  // カウンセリング開始日以前かチェック（カウンセリング開始日以前は選択不可）
  const isBeforeCounselingDate = (date: Date) => {
    if (!counselingResult) return false;
    
    // CompactHeaderと同じロジックで統一
    const counselingDateRaw = counselingResult.firstCompletedAt || 
                             counselingResult.createdAt || 
                             counselingResult.completedAt;
    if (!counselingDateRaw) return false;
    
    const counselingDate = new Date(counselingDateRaw);
    if (isNaN(counselingDate.getTime())) return false;
    
    // 日付のみで比較（時間は無視）
    const checkDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const counselingDateOnly = new Date(counselingDate.getFullYear(), counselingDate.getMonth(), counselingDate.getDate());
    
    return checkDate.getTime() < counselingDateOnly.getTime();
  };

  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    // 月の最初の日と最後の日
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // 月の最初の日が何曜日か（0: 日曜日）
    const firstDayOfWeek = firstDay.getDay();
    
    // カレンダーグリッド用の日付配列
    const days: (Date | null)[] = [];
    
    // 前月の日付で埋める
    for (let i = 0; i < firstDayOfWeek; i++) {
      const prevDate = new Date(year, month, -firstDayOfWeek + i + 1);
      days.push(prevDate);
    }
    
    // 当月の日付
    for (let date = 1; date <= lastDay.getDate(); date++) {
      days.push(new Date(year, month, date));
    }
    
    // 次月の日付で埋める（42日分：6週間）
    const remainingDays = 42 - days.length;
    for (let date = 1; date <= remainingDays; date++) {
      days.push(new Date(year, month + 1, date));
    }
    
    return days;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-w-md p-0 bg-white border border-slate-200 shadow-lg rounded-xl mx-auto">
        {/* ヘッダー */}
        <DialogHeader className="px-4 py-3 border-b border-slate-100">
          <div className="flex items-center justify-center">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleMonthChange('prev')}
                className="h-8 w-8 text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <DialogTitle className="text-lg font-semibold text-slate-800 min-w-[120px] text-center">
                {formatMonthYear(currentMonth)}
              </DialogTitle>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleMonthChange('next')}
                className="h-8 w-8 text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* カスタムカレンダー */}
        <div className="p-3">
          {/* 曜日ヘッダー */}
          <div className="grid grid-cols-7 gap-1 mb-3">
            {['日', '月', '火', '水', '木', '金', '土'].map((day) => (
              <div key={day} className="text-center text-slate-500 font-medium text-sm py-2">
                {day}
              </div>
            ))}
          </div>
          
          {/* カレンダーグリッド */}
          <div className="grid grid-cols-7 gap-1">
            {getDaysInMonth().map((day, index) => {
              if (!day) {
                return <div key={index} className="h-12"></div>;
              }
              
              const isToday = day.toDateString() === new Date().toDateString();
              const isSelected = day.toDateString() === selectedDate.toDateString();
              const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
              const isDisabled = isBeforeCounselingDate(day);
              const hasRecords = hasRecordsForDate ? hasRecordsForDate(day) : false;
              
              // 当月の日付のみ表示
              if (!isCurrentMonth) {
                return <div key={index} className="h-10"></div>;
              }
              
              return (
                <button
                  key={index}
                  onClick={() => handleDateSelect(day)}
                  disabled={isDisabled}
                  className={`h-10 rounded-lg font-medium transition-colors flex items-center justify-center text-sm ${
                    isDisabled
                      ? 'text-slate-300 cursor-not-allowed bg-slate-50'
                      : isSelected
                      ? 'border-2 border-blue-500 text-blue-600 bg-blue-50'
                      : isToday
                      ? 'border-2 border-blue-400 text-blue-600 bg-blue-50'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                  style={{
                    ...(hasRecords && !isSelected && !isToday && {
                      border: '2px dotted #60a5fa',
                      borderStyle: 'dotted'
                    })
                  }}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>
        </div>

        {/* フッター */}
        <div className="px-3 py-2 border-t border-slate-100 flex justify-center">
          <Button
            variant="outline"
            onClick={goToToday}
            className="text-sm text-slate-600 border-slate-300 hover:bg-slate-50 px-4 rounded-lg"
          >
            今日
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}