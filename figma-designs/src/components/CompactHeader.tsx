import { useState } from 'react';
import { Button } from './ui/button';
import { ChevronLeft, ChevronRight, Calendar, Menu, User, BarChart3, Settings } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

interface CompactHeaderProps {
  currentDate: Date;
  onDateSelect: (date: Date) => void;
  onCalendar: () => void;
  onNavigateToProfile?: () => void;
  onNavigateToData?: () => void;
  customContent?: React.ReactNode;
}

export function CompactHeader({ currentDate, onDateSelect, onCalendar, onNavigateToProfile, onNavigateToData, customContent }: CompactHeaderProps) {
  const [selectedWeek, setSelectedWeek] = useState(0);

  const getWeekDates = (weekOffset: number = 0) => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + weekOffset * 7);
    
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
        {/* ハンバーガーメニュー */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="w-9 h-9 p-0 text-slate-600 hover:text-slate-800 hover:bg-slate-100/80 rounded-xl"
            >
              <Menu size={20} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 backdrop-blur-xl bg-white/95 border border-slate-200/50 shadow-lg rounded-2xl" align="start">
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={onNavigateToProfile} className="cursor-pointer rounded-xl mx-1 my-1">
                <User className="mr-3 h-4 w-4 text-health-primary" />
                <span>マイページ</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onNavigateToData} className="cursor-pointer rounded-xl mx-1 my-1">
                <BarChart3 className="mr-3 h-4 w-4 text-health-primary" />
                <span>データ分析</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator className="mx-2" />
            <DropdownMenuItem onClick={onNavigateToProfile} className="cursor-pointer rounded-xl mx-1 my-1">
              <Settings className="mr-3 h-4 w-4 text-slate-500" />
              <span>設定</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* 月表示（中央） */}
        <div className="flex-1 text-center">
          {customContent || <h1 className="text-lg font-semibold text-slate-900">{currentMonth}</h1>}
        </div>

        {/* カレンダーボタン */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onCalendar}
          className="w-9 h-9 p-0 text-slate-600 hover:text-slate-800 hover:bg-slate-100/80 rounded-xl"
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
            className="w-8 h-8 p-0 rounded-lg hover:bg-slate-100/80 text-slate-600"
          >
            <ChevronLeft size={16} />
          </Button>
          
          <div className="grid grid-cols-7 gap-1 flex-1 mx-3">
            {weekDates.map((date, index) => (
              <Button
                key={date.toISOString()}
                variant="ghost"
                onClick={() => onDateSelect(date)}
                className={`h-12 flex flex-col p-1 rounded-xl transition-all ${
                  isSameDate(date, currentDate)
                    ? 'bg-health-primary text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100/60'
                }`}
              >
                <span className="text-xs font-medium opacity-80">{dayNames[index]}</span>
                <span className="text-sm font-semibold">
                  {date.getDate()}
                </span>
              </Button>
            ))}
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