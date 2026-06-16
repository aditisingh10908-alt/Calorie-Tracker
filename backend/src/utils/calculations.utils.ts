import { ActivityLevel } from '../types';

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  SEDENTARY: 1.2,
  LIGHT: 1.375,
  MODERATE: 1.55,
  ACTIVE: 1.725,
  VERY_ACTIVE: 1.9,
};

/**
 * Calculate Basal Metabolic Rate using the Mifflin-St Jeor equation.
 * @param weight - Weight in kg
 * @param height - Height in cm
 * @param age - Age in years
 * @param gender - 'male' or 'female'
 * @returns BMR in kcal/day
 */
export const calculateBMR = (
  weight: number,
  height: number,
  age: number,
  gender: string
): number => {
  if (gender.toLowerCase() === 'male') {
    return 10 * weight + 6.25 * height - 5 * age + 5;
  }
  return 10 * weight + 6.25 * height - 5 * age - 161;
};

/**
 * Calculate Total Daily Energy Expenditure.
 * @param bmr - Basal Metabolic Rate in kcal/day
 * @param activityLevel - Activity level enum string
 * @returns TDEE in kcal/day
 */
export const calculateTDEE = (bmr: number, activityLevel: ActivityLevel): number => {
  const multiplier = ACTIVITY_MULTIPLIERS[activityLevel] || ACTIVITY_MULTIPLIERS.SEDENTARY;
  return Math.round(bmr * multiplier);
};

/**
 * Calculate calorie deficit needed per day to reach goal weight by target date.
 * @param currentWeight - Current weight in kg
 * @param goalWeight - Target weight in kg
 * @param tdee - Total Daily Energy Expenditure
 * @param weeksToGoal - Number of weeks to achieve goal (default 12)
 * @returns Deficit in kcal/day
 */
export const calculateDeficit = (
  currentWeight: number,
  goalWeight: number,
  tdee: number,
  weeksToGoal: number = 12
): number => {
  const weightToLose = currentWeight - goalWeight;
  if (weightToLose <= 0) return 0;

  // 1 kg of body fat ≈ 7700 kcal
  const totalCaloriesToBurn = weightToLose * 7700;
  const daysToGoal = weeksToGoal * 7;
  const dailyDeficit = Math.round(totalCaloriesToBurn / daysToGoal);

  // Cap at a maximum safe deficit (no more than 1000 kcal/day)
  const safeDeficit = Math.min(dailyDeficit, 1000);

  // Ensure target doesn't go below 1200 for women or 1500 for men (use 1200 as floor)
  const minCalories = 1200;
  const maxDeficit = tdee - minCalories;

  return Math.min(safeDeficit, Math.max(maxDeficit, 0));
};

/**
 * Calculate daily calorie target based on TDEE and deficit.
 * @param tdee - Total Daily Energy Expenditure
 * @param deficit - Daily calorie deficit
 * @returns Target calories per day
 */
export const calculateDailyCalorieTarget = (tdee: number, deficit: number): number => {
  return Math.max(tdee - deficit, 1200);
};
