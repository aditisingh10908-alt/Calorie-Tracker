export interface User {
  id: string;
  name: string;
  email: string;
  age?: number;
  gender?: string;
  height?: number;
  currentWeight?: number;
  goalWeight?: number;
  activityLevel?: string;
  tdee?: number;
  createdAt: string;
}

export interface Food {
  id: string;
  name: string;
  servingSize: number;
  servingUnit: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  category?: string;
  isDefault: boolean;
  isFavorite?: boolean;
}

export interface MealItem {
  id: string;
  foodId: string;
  food?: Food;
  quantity: number;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

export interface Meal {
  id: string;
  date: string;
  mealType: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';
  notes?: string;
  items: MealItem[];
}

export interface DailyMealSummary {
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFats: number;
  breakdown: {
    breakfast: number;
    lunch: number;
    dinner: number;
    snack: number;
  };
  meals: {
    id: string;
    mealType: 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';
    notes?: string;
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
    itemsCount: number;
  }[];
}

export interface WaterLog {
  id: string;
  amount: number;
  date: string;
  time?: string;
}

export interface DailyWaterSummary {
  total: number;
  logs: WaterLog[];
}

export interface WeightLog {
  id: string;
  weight: number;
  date: string;
  note?: string;
}

export interface CalorieSummary {
  date: string;
  consumed: number;
  target: number;
  remaining: number;
  deficit: number;
  tdee: number;
  bmr: number;
  breakdown: {
    breakfast: number;
    lunch: number;
    dinner: number;
    snack: number;
  };
}

export interface ProteinSummary {
  goal: number;
  consumed: number;
  remaining: number;
  percentage: number;
  fromMeals: number;
  fromCustom: number;
}

export interface Streak {
  id: string;
  streakType: 'LOGGING' | 'GOAL' | 'WEIGHT';
  currentStreak: number;
  longestStreak: number;
  lastLogDate?: string;
}

export interface Notification {
  id: string;
  type: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface WeightPrediction {
  predicted_weight_7d: number;
  predicted_weight_30d: number;
  weekly_rate: number;
  confidence: number;
  is_fallback?: boolean;
}

export interface GoalPrediction {
  probability: number;
  estimated_days: number;
  estimated_date: string;
  risk_factors: string[];
  is_fallback?: boolean;
}

export interface DeficitAnalysis {
  average_deficit: number;
  consistency_score: number;
  plateau_risk: 'LOW' | 'MEDIUM' | 'HIGH';
  analysis: string;
  is_fallback?: boolean;
}

export interface Recommendation {
  recommended_calories: number;
  recommended_protein: number;
  recommended_water: number;
  recommended_deficit: number;
  explanation: string;
  is_fallback?: boolean;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}
