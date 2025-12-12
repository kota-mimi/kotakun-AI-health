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

export type ThemeColor = string;

export interface LayoutConfig {
  x: number;
  y: number;
}