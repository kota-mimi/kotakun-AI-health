import { useState } from 'react';
import { Calendar } from './ui/calendar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface CalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
}

export function CalendarModal({ isOpen, onClose, selectedDate, onDateSelect }: CalendarModalProps) {
  const [currentMonth, setCurrentMonth] = useState(selectedDate);

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm mx-auto p-0 bg-white/95 backdrop-blur-md border border-white/20 shadow-xl">
        {/* ヘッダー */}
        <DialogHeader className="px-6 py-4 border-b border-slate-200/50">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleMonthChange('prev')}
              className="h-8 w-8 text-slate-600 hover:bg-slate-100"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <DialogTitle className="text-lg font-medium text-slate-800">
              {formatMonthYear(currentMonth)}
            </DialogTitle>
            
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleMonthChange('next')}
                className="h-8 w-8 text-slate-600 hover:bg-slate-100"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8 text-slate-600 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* カレンダー本体 */}
        <div className="px-6 py-4">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            month={currentMonth}
            onMonthChange={setCurrentMonth}
            className="rounded-lg w-full"
            classNames={{
              months: "flex flex-col space-y-4 w-full",
              month: "space-y-4 w-full",
              caption: "hidden",
              caption_label: "hidden", 
              nav: "hidden",
              nav_button: "hidden",
              nav_button_previous: "hidden",
              nav_button_next: "hidden",
              table: "w-full border-collapse space-y-1",
              head_row: "flex",
              head_cell: "text-slate-500 rounded-md w-9 font-medium text-sm text-center p-0 relative",
              row: "flex w-full mt-2",
              cell: "text-center text-sm relative p-0 focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-blue-50 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md",
              day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-slate-100 rounded-md transition-colors",
              day_selected: "bg-blue-500 text-white hover:bg-blue-600 focus:bg-blue-600 rounded-md",
              day_today: "bg-slate-100 text-slate-900 font-medium",
              day_outside: "text-slate-400 opacity-50",
              day_disabled: "text-slate-400 opacity-50 cursor-not-allowed",
              day_range_middle: "aria-selected:bg-slate-100 aria-selected:text-slate-900",
              day_hidden: "invisible"
            }}
          />
        </div>

        {/* フッター */}
        <div className="px-6 py-4 border-t border-slate-200/50 flex justify-center">
          <Button
            variant="outline"
            onClick={goToToday}
            className="text-sm text-slate-700 border-slate-300 hover:bg-slate-50 px-6"
          >
            今日に戻る
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}