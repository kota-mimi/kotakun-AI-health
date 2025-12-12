export interface PfcData {
  current: number;
  target: number;
  unit: string;
}

export interface DailyLogData {
  date: Date;
  weight: {
    current: number;
    diff: number; // e.g., -0.2 or +0.1
  };
  calories: {
    current: number;
    target: number;
  };
  pfc: {
    p: PfcData;
    f: PfcData;
    c: PfcData;
  };
  exercise: {
    minutes: number;
    caloriesBurned: number;
  };
  achievementRate: number; // 0 to 100
}

export enum ThemeColor {
  EMERALD = 'text-emerald-400 bg-emerald-500 border-emerald-500/20',
  CYAN = 'text-cyan-400 bg-cyan-500 border-cyan-500/20',
  INDIGO = 'text-indigo-400 bg-indigo-500 border-indigo-500/20',
}

// Supported font styles
export type FontStyleId = 'standard' | 'sketch' | 'marker' | 'pen' | 'novel' | 'pixel' | 'cute' | 'elegant';

// Simplified to just one x/y position for the whole group
export interface LayoutConfig {
  x: number;
  y: number;
}