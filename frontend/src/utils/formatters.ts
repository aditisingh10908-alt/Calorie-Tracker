import { format, parseISO } from 'date-fns';

export const formatDate = (dateStr: string, formatTemplate = 'MMM dd, yyyy') => {
  try {
    return format(parseISO(dateStr), formatTemplate);
  } catch (error) {
    return dateStr;
  }
};

export const formatCalories = (cal: number) => {
  return `${Math.round(cal)} kcal`;
};

export const formatWeight = (kg: number) => {
  return `${kg.toFixed(1)} kg`;
};

export const formatWater = (ml: number) => {
  if (ml >= 1000) {
    return `${(ml / 1000).toFixed(1)} L`;
  }
  return `${ml} ml`;
};

export const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
};

export const getActivityLabel = (level?: string) => {
  if (!level) return 'Sedentary';
  const levels: Record<string, string> = {
    SEDENTARY: 'Sedentary',
    LIGHT: 'Lightly Active',
    MODERATE: 'Moderately Active',
    ACTIVE: 'Active',
    VERY_ACTIVE: 'Very Active',
  };
  return levels[level] || level;
};
