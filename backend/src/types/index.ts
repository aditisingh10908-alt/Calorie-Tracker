import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

export interface JwtPayload {
  userId: string;
  email: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface DailyCalorieSummary {
  date: string;
  consumed: number;
  target: number;
  deficit: number;
  remaining: number;
  breakdown: {
    breakfast: number;
    lunch: number;
    dinner: number;
    snack: number;
  };
}

export interface DailyMealSummary {
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFats: number;
  meals: {
    mealType: string;
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
  }[];
}

export interface WeeklyReport {
  startDate: string;
  endDate: string;
  avgCalories: number;
  avgProtein: number;
  avgWater: number;
  avgWeight: number | null;
  totalDaysLogged: number;
  calorieData: { date: string; calories: number }[];
  weightData: { date: string; weight: number }[];
}

export interface MonthlyReport extends WeeklyReport {
  weeklyBreakdown: {
    week: number;
    avgCalories: number;
    avgProtein: number;
    avgWater: number;
  }[];
}

export interface TrendData {
  date: string;
  value: number;
}

export interface BMRResult {
  bmr: number;
  tdee: number;
  targetCalories: number;
  deficit: number;
}

export interface MLPrediction {
  predictedWeight?: number;
  predictedDate?: string;
  confidence?: number;
  recommendations?: string[];
}

export type ActivityLevel = 'SEDENTARY' | 'LIGHT' | 'MODERATE' | 'ACTIVE' | 'VERY_ACTIVE';

export type StreakType = 'LOGGING' | 'GOAL' | 'WEIGHT';

export type GoalStatus = 'ACTIVE' | 'COMPLETED' | 'ABANDONED';
