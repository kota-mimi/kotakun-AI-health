import { format, parseISO, startOfDay, endOfDay, subDays, addDays, isSameDay } from 'date-fns';
import { ja } from 'date-fns/locale';

export function formatDate(date: Date | string, formatString: string = 'yyyy-MM-dd'): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, formatString, { locale: ja });
}

export function formatDateTime(date: Date | string): string {
  return formatDate(date, 'yyyy年MM月dd日 HH:mm');
}

export function formatTime(date: Date | string): string {
  return formatDate(date, 'HH:mm');
}

export function formatDateRelative(date: Date | string): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  const today = new Date();
  const yesterday = subDays(today, 1);
  const tomorrow = addDays(today, 1);

  if (isSameDay(dateObj, today)) {
    return '今日';
  } else if (isSameDay(dateObj, yesterday)) {
    return '昨日';
  } else if (isSameDay(dateObj, tomorrow)) {
    return '明日';
  } else {
    return formatDate(dateObj, 'MM月dd日');
  }
}

export function getTodayString(): string {
  return formatDate(new Date(), 'yyyy-MM-dd');
}

export function getYesterdayString(): string {
  return formatDate(subDays(new Date(), 1), 'yyyy-MM-dd');
}

export function getDayStart(date: Date | string = new Date()): Date {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return startOfDay(dateObj);
}

export function getDayEnd(date: Date | string = new Date()): Date {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return endOfDay(dateObj);
}

export function getDateRange(days: number): { start: Date; end: Date } {
  const end = new Date();
  const start = subDays(end, days - 1);
  return { start, end };
}

export function getWeekRange(): { start: Date; end: Date } {
  return getDateRange(7);
}

export function getMonthRange(): { start: Date; end: Date } {
  return getDateRange(30);
}

export function isToday(date: Date | string): boolean {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return isSameDay(dateObj, new Date());
}

export function getMealTimeLabel(hour: number): '朝食' | '昼食' | '夕食' | '間食' {
  if (hour >= 5 && hour < 10) return '朝食';
  if (hour >= 10 && hour < 15) return '昼食';
  if (hour >= 15 && hour < 21) return '夕食';
  return '間食';
}

export function getCurrentMealType(): 'breakfast' | 'lunch' | 'dinner' | 'snack' {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 10) return 'breakfast';
  if (hour >= 10 && hour < 15) return 'lunch';
  if (hour >= 15 && hour < 21) return 'dinner';
  return 'snack';
}

export function getWeekdayName(date: Date | string): string {
  return formatDate(date, 'EEEE');
}

export function getMonthName(date: Date | string): string {
  return formatDate(date, 'MMMM');
}

export function parseTimeString(timeString: string): { hours: number; minutes: number } {
  const [hours, minutes] = timeString.split(':').map(Number);
  return { hours: hours || 0, minutes: minutes || 0 };
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}分`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) {
    return `${hours}時間`;
  }
  return `${hours}時間${remainingMinutes}分`;
}