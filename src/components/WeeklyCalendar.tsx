import { useState } from 'react';
import { Button } from './ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface WeeklyCalendarProps {
  currentDate: Date;
  onDateSelect: (date: Date) => void;
}

export function WeeklyCalendar({ currentDate, onDateSelect }: WeeklyCalendarProps) {
  const [selectedWeek, setSelectedWeek] = useState(0);

  const getWeekDates = (weekOffset: number = 0) => {
    const today = new Date();
    const startOfWeek = new Date(today);
    // 月曜日を週の始まりとする（日本標準）
    const dayOfWeek = today.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // 日曜日の場合は-6、それ以外は1-dayOfWeek
    startOfWeek.setDate(today.getDate() + mondayOffset + weekOffset * 7);
    
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const weekDates = getWeekDates(selectedWeek);
  const dayNames = ['月', '火', '水', '木', '金', '土', '日'];
  
  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSameDate = (date1: Date, date2: Date) => {
    return date1.toDateString() === date2.toDateString();
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 shadow-emerald-100/20">
      <div className="flex items-center justify-between mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSelectedWeek(selectedWeek - 1)}
          className="p-3 rounded-xl hover:bg-gray-100 text-slate-600 border border-gray-200"
        >
          <ChevronLeft size={16} />
        </Button>
        <div className="grid grid-cols-7 gap-2 flex-1 mx-4">
          {weekDates.map((date, index) => (
            <Button
              key={date.toISOString()}
              variant="ghost"
              onClick={() => onDateSelect(date)}
              className="h-14 flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-200 text-slate-600 hover:bg-gray-100 border border-transparent hover:border-gray-200"
            >
              <span className="text-xs mb-2 text-slate-500">
                {dayNames[date.getDay()]}
              </span>
              <div className={`w-8 h-8 flex items-center justify-center rounded-full transition-all duration-200 ${
                isSameDate(date, currentDate)
                  ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-sm'
                  : isToday(date)
                  ? 'bg-blue-100 text-blue-700 border border-blue-200'
                  : 'text-slate-700'
              }`}>
                <span className={`text-sm ${
                  isSameDate(date, currentDate) ? 'font-semibold text-white' : 
                  isToday(date) ? 'font-medium' : 'font-medium'
                }`}>
                  {date.getDate()}
                </span>
              </div>
            </Button>
          ))}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSelectedWeek(selectedWeek + 1)}
          className="p-3 rounded-xl hover:bg-gray-100 text-slate-600 border border-gray-200"
        >
          <ChevronRight size={16} />
        </Button>
      </div>
    </div>
  );
}