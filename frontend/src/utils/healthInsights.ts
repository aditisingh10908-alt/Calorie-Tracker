/**
 * Smart Health Insights Calculation Engine
 * 
 * All calculations use the user's profile data (age, gender, height,
 * current weight, goal weight, activity level) to produce personalised
 * health recommendations.
 */

// ─── Types ───────────────────────────────────────────────────────────

export type GoalType = 'loss' | 'gain' | 'maintain';

export interface HealthInsights {
  bmi: { value: number; category: string; color: string };
  bmr: number;
  tdee: number;
  goalType: GoalType;
  recommendedCalories: number;
  proteinRange: { min: number; max: number };
  waterRange: { min: number; max: number };
  estimatedWeeks: number | null;
  estimatedDate: string | null;
  messages: string[];
}

// ─── Activity multipliers (Mifflin-St Jeor × Harris-Benedict hybrid) ─

const ACTIVITY_MULTIPLIERS: Record<string, number> = {
  SEDENTARY: 1.2,
  LIGHT: 1.375,
  MODERATE: 1.55,
  ACTIVE: 1.725,
  VERY_ACTIVE: 1.9,
};

// ─── BMI ─────────────────────────────────────────────────────────────

function calcBMI(weightKg: number, heightCm: number) {
  const heightM = heightCm / 100;
  const value = Math.round((weightKg / (heightM * heightM)) * 10) / 10;

  let category: string;
  let color: string;
  if (value < 18.5) {
    category = 'Underweight';
    color = '#3b82f6';
  } else if (value < 25) {
    category = 'Normal';
    color = '#22c55e';
  } else if (value < 30) {
    category = 'Overweight';
    color = '#f59e0b';
  } else {
    category = 'Obese';
    color = '#ef4444';
  }

  return { value, category, color };
}

// ─── BMR (Mifflin-St Jeor) ──────────────────────────────────────────

function calcBMR(weightKg: number, heightCm: number, age: number, gender: string): number {
  if (gender.toLowerCase() === 'male') {
    return 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
  }
  return 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
}

// ─── TDEE ────────────────────────────────────────────────────────────

function calcTDEE(bmr: number, activityLevel: string): number {
  const multiplier = ACTIVITY_MULTIPLIERS[activityLevel] || ACTIVITY_MULTIPLIERS.SEDENTARY;
  return Math.round(bmr * multiplier);
}

// ─── Goal type detection ─────────────────────────────────────────────

function detectGoalType(currentWeight: number, goalWeight: number): GoalType {
  if (goalWeight < currentWeight) return 'loss';
  if (goalWeight > currentWeight) return 'gain';
  return 'maintain';
}

// ─── Recommended Calories ────────────────────────────────────────────

function calcRecommendedCalories(tdee: number, goalType: GoalType): number {
  if (goalType === 'loss') return Math.max(tdee - 500, 1200);   // ≈ 0.5 kg/week loss
  if (goalType === 'gain') return tdee + 400;                    // mid-range surplus
  return tdee;
}

// ─── Protein target ──────────────────────────────────────────────────

function calcProteinRange(weightKg: number, goalType: GoalType): { min: number; max: number } {
  if (goalType === 'loss') {
    return { min: Math.round(1.8 * weightKg), max: Math.round(2.2 * weightKg) };
  }
  if (goalType === 'gain') {
    return { min: Math.round(1.6 * weightKg), max: Math.round(2.0 * weightKg) };
  }
  return { min: Math.round(1.4 * weightKg), max: Math.round(1.8 * weightKg) };
}

// ─── Water target ────────────────────────────────────────────────────

function calcWaterRange(weightKg: number): { min: number; max: number } {
  return {
    min: Math.round(weightKg * 35),
    max: Math.round(weightKg * 40),
  };
}

// ─── Estimated time to reach goal ────────────────────────────────────

function calcEstimatedWeeks(currentWeight: number, goalWeight: number, goalType: GoalType): number | null {
  if (goalType === 'maintain') return null;
  const diff = Math.abs(currentWeight - goalWeight);
  const weeklyRate = goalType === 'loss' ? 0.5 : 0.375; // kg/week (gain uses mid-range 0.25-0.5)
  return Math.round(diff / weeklyRate);
}

function calcEstimatedDate(weeks: number | null): string | null {
  if (weeks === null) return null;
  const target = new Date();
  target.setDate(target.getDate() + weeks * 7);
  return target.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

// ─── Motivational messages ───────────────────────────────────────────

function buildMessages(
  goalType: GoalType,
  recommendedCalories: number,
  proteinRange: { min: number; max: number },
  waterRange: { min: number; max: number },
  estimatedWeeks: number | null,
  waterConsumedMl: number,
  caloriesConsumed: number,
  tdee: number,
): string[] {
  const msgs: string[] = [];

  // Calorie guidance
  if (goalType === 'loss') {
    msgs.push(`To lose weight safely, aim for ≈${recommendedCalories} kcal/day (500 kcal below your TDEE).`);
  } else if (goalType === 'gain') {
    msgs.push(`To gain lean mass, aim for ≈${recommendedCalories} kcal/day (400 kcal above your TDEE).`);
  } else {
    msgs.push(`To maintain your weight, aim for ≈${recommendedCalories} kcal/day.`);
  }

  // Protein
  msgs.push(`Recommended protein: ${proteinRange.min}–${proteinRange.max} g/day.`);

  // Water progress
  const waterGoal = waterRange.max;
  if (waterGoal > 0 && waterConsumedMl > 0) {
    const pct = Math.min(Math.round((waterConsumedMl / waterGoal) * 100), 100);
    if (pct >= 100) {
      msgs.push(`🎉 You've hit your water goal for today!`);
    } else {
      msgs.push(`💧 You're ${pct}% toward today's water goal.`);
    }
  }

  // Calorie pacing
  if (caloriesConsumed > 0) {
    const remaining = Math.max(recommendedCalories - caloriesConsumed, 0);
    const hour = new Date().getHours();
    if (remaining === 0) {
      msgs.push(`You've reached your calorie target — keep it balanced for the rest of the day.`);
    } else if (hour < 20) {
      msgs.push(`You have ≈${remaining} kcal left for the rest of the day.`);
    }
  }

  // Timeline
  if (estimatedWeeks !== null) {
    const label = goalType === 'loss' ? 'Losing 0.5 kg/week' : 'Gaining ~0.375 kg/week';
    msgs.push(`${label}, you can reach your goal in ≈${estimatedWeeks} weeks.`);
  }

  return msgs;
}

// ─── Main entry point ────────────────────────────────────────────────

export interface HealthInsightsInput {
  age?: number;
  gender?: string;
  heightCm?: number;
  currentWeightKg?: number;
  goalWeightKg?: number;
  activityLevel?: string;
  waterConsumedMl?: number;
  caloriesConsumed?: number;
}

export function computeHealthInsights(input: HealthInsightsInput): HealthInsights | null {
  const { age, gender, heightCm, currentWeightKg, goalWeightKg, activityLevel } = input;

  // Need at minimum weight + height + age + gender to compute anything useful
  if (!age || !gender || !heightCm || !currentWeightKg || heightCm <= 0 || currentWeightKg <= 0) {
    return null;
  }

  const effectiveGoalWeight = goalWeightKg && goalWeightKg > 0 ? goalWeightKg : currentWeightKg;

  const bmi = calcBMI(currentWeightKg, heightCm);
  const bmr = Math.round(calcBMR(currentWeightKg, heightCm, age, gender));
  const tdee = calcTDEE(bmr, activityLevel || 'SEDENTARY');
  const goalType = detectGoalType(currentWeightKg, effectiveGoalWeight);
  const recommendedCalories = calcRecommendedCalories(tdee, goalType);
  const proteinRange = calcProteinRange(currentWeightKg, goalType);
  const waterRange = calcWaterRange(currentWeightKg);
  const estimatedWeeks = calcEstimatedWeeks(currentWeightKg, effectiveGoalWeight, goalType);
  const estimatedDate = calcEstimatedDate(estimatedWeeks);

  const messages = buildMessages(
    goalType,
    recommendedCalories,
    proteinRange,
    waterRange,
    estimatedWeeks,
    input.waterConsumedMl || 0,
    input.caloriesConsumed || 0,
    tdee,
  );

  return {
    bmi,
    bmr,
    tdee,
    goalType,
    recommendedCalories,
    proteinRange,
    waterRange,
    estimatedWeeks,
    estimatedDate,
    messages,
  };
}
