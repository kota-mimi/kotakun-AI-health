export interface DailyLogData {
  date: Date;
  weight: {
    current: number;
    diff: number;
  };
  calories: {
    current: number;
    target: number;
  };
  pfc: {
    p: { current: number; target: number };
    f: { current: number; target: number };
    c: { current: number; target: number };
  };
  exercise: {
    minutes: number;
    caloriesBurned: number;
  };
}

export type ThemeColor = 'text-emerald-500' | 'text-cyan-500' | 'text-blue-500' | 'text-indigo-500' | 'text-purple-500' | 'text-pink-500' | string;

export interface LayoutConfig {
  x: number;
  y: number;
}