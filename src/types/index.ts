export interface User {
  userId: string;
  lineUserId: string;
  profile: UserProfile;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile {
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  height: number; // cm
  weight: number; // kg
  targetWeight?: number; // kg
  targetDate?: string; // date string
  activityLevel: 'low' | 'slightly_low' | 'normal' | 'high' | 'very_high';
  goals: HealthGoal[];
  targetAreas?: string; // 気になる部位
  sleepDuration: 'under_3h' | '4_5h' | '6_7h' | '8h_plus';
  sleepQuality: 'good' | 'normal' | 'bad';
  exerciseHabit: 'yes' | 'no';
  exerciseFrequency: 'none' | 'weekly_1_2' | 'weekly_3_4' | 'weekly_5_6' | 'daily';
  exerciseEnvironment?: 'gym' | 'home' | 'both';
  mealFrequency: '1' | '2' | '3' | '4_plus';
  snackFrequency: 'none' | 'sometimes' | 'almost_daily' | 'daily';
  alcoholFrequency: 'none' | 'sometimes' | 'almost_daily' | 'daily';
  dietaryRestrictions?: string;
  medicalConditions?: string;
  allergies?: string;
}

export interface HealthGoal {
  type: 'weight_loss' | 'healthy_beauty' | 'weight_gain' | 'muscle_gain' | 'lean_muscle' | 'fitness_improve' | 'other';
  targetValue?: number;
  targetDate?: Date;
}

export interface CounselingResult {
  id: string;
  userId: string;
  answers: Record<string, string | number | boolean>;
  aiAdvice: string;
  categories: HealthCategory[];
  priority: 'high' | 'medium' | 'low';
  createdAt: Date;
}

export type HealthCategory = 
  | 'nutrition' 
  | 'exercise' 
  | 'sleep' 
  | 'stress' 
  | 'hydration' 
  | 'supplements';

export interface DailyRecord {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  meals: Meal[];
  weight?: number;
  exercise?: Exercise[];
  sleep?: SleepRecord;
  water?: number; // ml
  symptoms?: string[];
  mood?: MoodLevel;
  createdAt: Date;
  updatedAt: Date;
}

export interface Meal {
  id: string;
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  imageUrl?: string;
  description?: string;
  analysis: NutritionAnalysis;
  timestamp: Date;
}

export interface NutritionAnalysis {
  calories: number;
  protein: number; // g
  carbohydrates: number; // g
  fat: number; // g
  fiber: number; // g
  sugar: number; // g
  sodium: number; // mg
  confidence: number; // 0-1
  ingredients: string[];
  warnings?: string[];
}

export interface Exercise {
  id: string;
  type: 'cardio' | 'strength' | 'flexibility' | 'sports' | 'other' | 'daily';
  name: string;
  duration: number; // minutes
  intensity?: 'low' | 'moderate' | 'high' | 'light' | 'medium' | null;
  caloriesBurned?: number;
  calories?: number; // Added for compatibility
  notes?: string;
  timestamp: Date;
  time?: string; // Time string for display
  sets?: number;
  reps?: number;
  weight?: number;
  distance?: number;
  timeOfDay?: string; // Time of day (morning, evening, etc.)
  totalSets?: number;
  avgWeight?: number;
  totalReps?: number;
}

export interface SleepRecord {
  bedtime: Date;
  wakeTime: Date;
  quality: 1 | 2 | 3 | 4 | 5;
  notes?: string;
}

export type MoodLevel = 1 | 2 | 3 | 4 | 5;

export interface AIAnalysis {
  type: 'meal' | 'overall_health' | 'recommendation';
  content: string;
  confidence: number;
  suggestions: string[];
  warnings?: string[];
  timestamp: Date;
}

export interface NotificationSettings {
  mealReminders: boolean;
  exerciseReminders: boolean;
  waterReminders: boolean;
  weeklyReports: boolean;
  customReminders: CustomReminder[];
}

export interface CustomReminder {
  id: string;
  message: string;
  time: string; // HH:MM
  days: number[]; // 0=Sunday, 1=Monday, ...
  active: boolean;
}

// API関連の型
export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends APIResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// フォーム関連の型
export interface CounselingAnswer {
  questionId: string;
  answer: string | number | string[];
  questionType: 'text' | 'select' | 'multiselect' | 'number' | 'boolean';
}

export interface CounselingQuestion {
  id: string;
  question: string;
  type: 'text' | 'select' | 'multiselect' | 'number' | 'boolean';
  options?: string[];
  required: boolean;
  category: HealthCategory;
  order: number;
}

// LIFF関連の型
export interface LIFFUser {
  userId: string;
  displayName: string;
  pictureUrl?: string;
  statusMessage?: string;
}

export interface LIFFContext {
  type: 'utou' | 'room' | 'group' | 'none' | 'square_chat' | 'external';
  viewType?: 'compact' | 'tall' | 'full' | 'frame' | 'full-flex';
  userId?: string;
  utouId?: string;
  roomId?: string;
  groupId?: string;
}