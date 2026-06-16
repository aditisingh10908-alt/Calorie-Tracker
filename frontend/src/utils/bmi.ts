/**
 * BMI Calculation Utility
 * BMI = weight (kg) / (height (m))^2
 */

export interface BMIResult {
  value: number;
  category: string;
  color: string;
  range: string;
}

export function calculateBMI(heightCm: number, weightKg: number): BMIResult | null {
  if (!heightCm || !weightKg || heightCm <= 0 || weightKg <= 0) return null;

  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);
  const value = Math.round(bmi * 10) / 10;

  if (value < 18.5) {
    return { value, category: 'Underweight', color: '#3b82f6', range: '< 18.5' };
  } else if (value < 25) {
    return { value, category: 'Normal', color: '#22c55e', range: '18.5 – 24.9' };
  } else if (value < 30) {
    return { value, category: 'Overweight', color: '#f59e0b', range: '25 – 29.9' };
  } else {
    return { value, category: 'Obese', color: '#ef4444', range: '≥ 30' };
  }
}
