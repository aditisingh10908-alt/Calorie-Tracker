'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { CalorieService } from '../../services/calorie.service';
import { WaterService } from '../../services/water.service';
import { WeightService } from '../../services/weight.service';
import { MealService } from '../../services/meal.service';
import { StreakService } from '../../services/streak.service';
import { CalorieSummary, DailyWaterSummary, WeightLog, DailyMealSummary, Streak } from '../../types';
import { format } from 'date-fns';
// Health insights are computed inline in the useMemo below
import {
  Flame,
  Droplets,
  Scale,
  Activity,
  Dumbbell,
  Leaf,
  Calendar,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Minus,
  Trophy,
  Award,
  CheckCircle2,
  Utensils,
  Plus
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [weightRange, setWeightRange] = useState<string>('7 Days');

  // Daily summary states
  const [calorieSummary, setCalorieSummary] = useState<CalorieSummary | null>(null);
  const [waterSummary, setWaterSummary] = useState<DailyWaterSummary | null>(null);
  const [latestWeight, setLatestWeight] = useState<WeightLog | null>(null);
  const [mealSummary, setMealSummary] = useState<DailyMealSummary | null>(null);
  const [weightHistory, setWeightHistory] = useState<WeightLog[]>([]);
  const [streaks, setStreaks] = useState<Streak[]>([]);
  const [topFoods, setTopFoods] = useState<any[]>([]);

  // Setup mounted state for SSR safety with Recharts
  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchDashboardData = async (dateStr: string) => {
    try {
      setLoading(true);
      const [calData, waterData, weightData, mealData, weightHist, streaksData] = await Promise.all([
        CalorieService.getDailySummary(dateStr).catch(() => null),
        WaterService.getDailyWater(dateStr).catch(() => null),
        WeightService.getLatestWeight().catch(() => null),
        MealService.getMealsByDate(dateStr).catch(() => null),
        WeightService.getWeightHistory(30).catch(() => []),
        StreakService.getStreaks().catch(() => []),
      ]);

      if (calData) setCalorieSummary(calData);
      if (waterData) setWaterSummary(waterData);
      if (weightData) setLatestWeight(weightData);
      if (mealData) setMealSummary(mealData);
      if (weightHist) setWeightHistory(weightHist);
      if (streaksData) setStreaks(streaksData);

      // Aggregate last 7 days of meals for Top Logged Foods
      const dates = Array.from({ length: 7 }).map((_, i) => {
        const d = new Date(dateStr);
        d.setDate(d.getDate() - i);
        return format(d, 'yyyy-MM-dd');
      });
      const weeklyMealsData = await Promise.all(
        dates.map(d => MealService.getMealsByDate(d).catch(() => null))
      );

      const foodCounts: Record<string, { count: number; calories: number }> = {};
      weeklyMealsData.forEach((summary) => {
        if (!summary || !summary.meals) return;
        summary.meals.forEach((meal: any) => {
          if (!meal.items) return;
          meal.items.forEach((item: any) => {
            const foodName = item.food?.name || 'Unknown Food';
            if (!foodCounts[foodName]) {
              foodCounts[foodName] = { count: 0, calories: 0 };
            }
            foodCounts[foodName].count += item.quantity;
            foodCounts[foodName].calories += item.calories;
          });
        });
      });

      const sortedTopFoods = Object.entries(foodCounts)
        .map(([name, data]) => ({
          name,
          count: data.count,
          calories: Math.round(data.calories),
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 4);

      setTopFoods(sortedTopFoods);
    } catch (error) {
      console.error('Error fetching dashboard data', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData(selectedDate);
  }, [selectedDate]);

  // Derived Values & Calculations Layer
  const consumedCalories = calorieSummary?.consumed || mealSummary?.totalCalories || 0;
  const consumedProtein = mealSummary?.totalProtein || 0;
  const consumedCarbs = mealSummary?.totalCarbs || 0;
  const consumedFats = mealSummary?.totalFats || 0;

  // Dynamic metrics from user profile and current weight log with fallbacks
  const healthInsights = useMemo(() => {
    const effectiveAge = user?.age || 25;
    const effectiveGender = user?.gender || 'male';
    const effectiveHeight = user?.height || 170;
    const effectiveWeight = latestWeight?.weight || user?.currentWeight || 70;
    const effectiveGoalWeight = user?.goalWeight || effectiveWeight;
    const effectiveActivityLevel = user?.activityLevel || 'SEDENTARY';

    // BMI
    const heightM = effectiveHeight / 100;
    const bmiVal = heightM > 0 ? (effectiveWeight / (heightM * heightM)) : 0;
    const bmiValueFormatted = Math.round(bmiVal * 10) / 10;
    let bmiCategory = 'Normal';
    let bmiColor = '#22c55e';
    if (bmiValueFormatted < 18.5) {
      bmiCategory = 'Underweight';
      bmiColor = '#3b82f6';
    } else if (bmiValueFormatted < 25) {
      bmiCategory = 'Normal';
      bmiColor = '#22c55e';
    } else if (bmiValueFormatted < 30) {
      bmiCategory = 'Overweight';
      bmiColor = '#f59e0b';
    } else {
      bmiCategory = 'Obese';
      bmiColor = '#ef4444';
    }

    // BMR (Mifflin-St Jeor)
    let bmrVal = 0;
    if (effectiveGender.toLowerCase() === 'male') {
      bmrVal = 10 * effectiveWeight + 6.25 * effectiveHeight - 5 * effectiveAge + 5;
    } else {
      bmrVal = 10 * effectiveWeight + 6.25 * effectiveHeight - 5 * effectiveAge - 161;
    }
    const bmr = Math.round(bmrVal);

    // TDEE
    const multipliers: Record<string, number> = {
      SEDENTARY: 1.2,
      LIGHT: 1.375,
      MODERATE: 1.55,
      ACTIVE: 1.725,
      VERY_ACTIVE: 1.9,
    };
    const multiplier = multipliers[effectiveActivityLevel] || 1.2;
    const tdee = Math.round(bmr * multiplier);

    // Goal Type
    let goalType: 'loss' | 'gain' | 'maintain' = 'maintain';
    if (effectiveGoalWeight < effectiveWeight) {
      goalType = 'loss';
    } else if (effectiveGoalWeight > effectiveWeight) {
      goalType = 'gain';
    }

    // Recommended Calories
    const caloriesLoss = Math.max(tdee - 500, 1200);
    const caloriesGain = tdee + 300;
    
    let targetCalories = tdee;
    if (goalType === 'loss') {
      targetCalories = caloriesLoss;
    } else if (goalType === 'gain') {
      targetCalories = caloriesGain;
    }

    // Protein Target
    let proteinTarget = 1.2 * effectiveWeight; // Maintain
    if (goalType === 'loss') {
      proteinTarget = 1.8 * effectiveWeight;
    } else if (goalType === 'gain') {
      proteinTarget = 2.0 * effectiveWeight;
    }
    proteinTarget = Math.round(proteinTarget);

    // Water Goal (ml)
    const waterGoal = Math.round(35 * effectiveWeight);

    // Goal Timeline / ETA
    let estimatedWeeks = null;
    let estimatedDate = null;
    if (goalType !== 'maintain') {
      const weightDiff = Math.abs(effectiveWeight - effectiveGoalWeight);
      const weeklyChange = goalType === 'loss' ? 0.5 : 0.35; // kg per week
      estimatedWeeks = Math.round(weightDiff / weeklyChange);
      if (estimatedWeeks > 0) {
        const targetD = new Date();
        targetD.setDate(targetD.getDate() + estimatedWeeks * 7);
        estimatedDate = format(targetD, 'MMMM yyyy');
      }
    }

    return {
      weight: effectiveWeight,
      height: effectiveHeight,
      bmi: { value: bmiValueFormatted, category: bmiCategory, color: bmiColor },
      bmr,
      tdee,
      goalType,
      targetCalories,
      caloriesLoss,
      caloriesGain,
      proteinTarget,
      waterGoal,
      estimatedWeeks,
      estimatedDate,
    };
  }, [user, latestWeight]);

  const targetCalories = healthInsights.targetCalories;
  const currentWeightVal = healthInsights.weight;
  const heightVal = healthInsights.height;
  const bmi = healthInsights.bmi;

  const proteinGoal = healthInsights.proteinTarget;
  const waterGoal = healthInsights.waterGoal;
  const fatsGoal = Math.round((targetCalories * 0.25) / 9);
  const carbsGoal = Math.round((targetCalories - (proteinGoal * 4) - (fatsGoal * 9)) / 4);

  const formatWater = (ml: number) => {
    const L = ml / 1000;
    return L % 1 === 0 ? `${L.toFixed(1)}` : `${L}`;
  };

  // Streak Info
  const loggingStreak = streaks.find(s => s.streakType === 'LOGGING') || {
    currentStreak: 0,
    longestStreak: 0,
  };

  // Weight Trend Line Chart
  const weightChartData = useMemo(() => {
    const limit = weightRange === '7 Days' ? 7 : 30;
    const logs = [...weightHistory]
      .slice(0, limit)
      .reverse()
      .map(log => ({
        date: format(new Date(log.date), 'dd MMM'),
        weight: log.weight,
      }));

    if (logs.length > 0) return logs;

    // Fallback Mock Data with current/goal weights
    const baseWeight = currentWeightVal || 70;
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return {
        date: format(d, 'dd MMM'),
        weight: baseWeight - (6 - i) * 0.1,
      };
    });
  }, [weightHistory, weightRange, currentWeightVal]);

  // Weight Difference vs Last Log
  const weightChangeVsLast = useMemo(() => {
    if (weightHistory.length < 2) return null;
    const diff = weightHistory[0].weight - weightHistory[1].weight;
    return {
      value: Math.abs(diff).toFixed(1),
      isLoss: diff < 0,
      isGain: diff > 0,
    };
  }, [weightHistory]);

  // Nutrient balance chart data
  const nutrientChartData = useMemo(() => {
    const total = consumedProtein + consumedCarbs + consumedFats;
    if (total === 0) {
      return [
        { name: 'Carbs', value: 45, fill: '#22c55e' },
        { name: 'Protein', value: 25, fill: '#3b82f6' },
        { name: 'Fats', value: 30, fill: '#f59e0b' },
      ];
    }
    return [
      { name: 'Carbs', value: Math.round((consumedCarbs / total) * 100), fill: '#22c55e' },
      { name: 'Protein', value: Math.round((consumedProtein / total) * 100), fill: '#3b82f6' },
      { name: 'Fats', value: Math.round((consumedFats / total) * 100), fill: '#f59e0b' },
    ];
  }, [consumedProtein, consumedCarbs, consumedFats]);

  // Calories donut chart data
  const caloriesChartData = useMemo(() => {
    const remaining = Math.max(0, targetCalories - consumedCalories);
    return [
      { name: 'Consumed', value: consumedCalories, fill: '#22c55e' },
      { name: 'Remaining', value: remaining, fill: 'rgba(148, 163, 184, 0.15)' },
    ];
  }, [consumedCalories, targetCalories]);

  // Weight Goal Completion percentage
  const weightProgress = useMemo(() => {
    const startWeight = user?.currentWeight || currentWeightVal;
    const targetWeight = user?.goalWeight || currentWeightVal;
    if (Math.abs(startWeight - targetWeight) === 0) return 100;
    const totalChangeNeeded = Math.abs(startWeight - targetWeight);
    const changeAchieved = Math.abs(startWeight - currentWeightVal);
    return Math.min(Math.round((changeAchieved / totalChangeNeeded) * 100), 100);
  }, [user, currentWeightVal]);

  // Greeting Message
  const timeGreeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  }, []);

  // Today's Motivation Messages
  const motivationMessages = useMemo(() => {
    const list = [];
    const waterTotal = waterSummary?.total || 0;
    const waterPct = Math.round((waterTotal / waterGoal) * 100);
    list.push({ text: `You're ${waterPct}% toward today's water goal.`, type: 'water' });

    const protLeft = Math.max(0, proteinGoal - consumedProtein);
    if (protLeft > 0) {
      list.push({ text: `Only ${Math.round(protLeft)}g protein left to hit your target.`, type: 'protein' });
    } else {
      list.push({ text: `🎉 Protein goal fully achieved for today!`, type: 'protein' });
    }

    if (healthInsights.goalType === 'loss') {
      list.push({ text: `Losing 0.5 kg/week requires approximately ${healthInsights.caloriesLoss.toLocaleString()} calories/day.`, type: 'calorie' });
    } else if (healthInsights.goalType === 'gain') {
      list.push({ text: `Gaining ~0.35 kg/week requires approximately ${healthInsights.caloriesGain.toLocaleString()} calories/day.`, type: 'calorie' });
    } else {
      list.push({ text: `Maintaining weight requires approximately ${healthInsights.tdee.toLocaleString()} calories/day.`, type: 'calorie' });
    }

    if (healthInsights.estimatedWeeks && healthInsights.estimatedWeeks > 0) {
      const goalDate = new Date();
      goalDate.setDate(goalDate.getDate() + healthInsights.estimatedWeeks * 7);
      list.push({ text: `At your current pace, you'll reach your goal by ${format(goalDate, 'MMMM yyyy')}.`, type: 'eta' });
    }

    const currentStreakVal = loggingStreak.currentStreak || 0;
    if (currentStreakVal > 0) {
      list.push({ text: `Consistency today, results tomorrow! Keep going on your ${currentStreakVal}-day streak! 🚀`, type: 'streak' });
    } else {
      list.push({ text: `Start logging food/water today to build a healthy logging habit! 🌱`, type: 'streak' });
    }

    return list;
  }, [healthInsights, waterSummary, consumedProtein, proteinGoal, loggingStreak, waterGoal]);

  const caloriesDeficit = Math.round(targetCalories - consumedCalories);

  // Fallback top food lists matching reference
  const finalTopFoods = useMemo(() => {
    if (topFoods.length > 0) return topFoods;
    return [
      { name: 'Roti', count: 12, calories: 540 },
      { name: 'Dal Tadka', count: 8, calories: 960 },
      { name: 'Rice (Cooked)', count: 6, calories: 780 },
      { name: 'Banana', count: 5, calories: 525 },
    ];
  }, [topFoods]);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Header Block */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-dark-900 dark:text-white">Dashboard</h1>
          <p className="text-dark-500 dark:text-dark-400 mt-1">Here's your health summary for today.</p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {/* Beautiful Datepicker */}
          <div className="flex items-center gap-2 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 px-4 py-2.5 rounded-xl text-sm font-semibold shadow-sm text-dark-800 dark:text-white">
            <Calendar size={16} className="text-primary-500" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent border-none outline-none text-dark-800 dark:text-white cursor-pointer font-sans"
            />
          </div>

          {/* User Welcome Box */}
          <div className="bg-green-50/80 dark:bg-green-500/5 border border-green-100 dark:border-green-500/10 px-5 py-2.5 rounded-2xl flex items-center gap-3">
            <span className="text-xl">👋</span>
            <div>
              <p className="text-xs text-dark-500 dark:text-dark-400 font-medium">
                {timeGreeting}, <span className="font-bold text-dark-800 dark:text-white">{user?.name || 'User'}</span>!
              </p>
              <p className="text-[10px] text-green-600 dark:text-green-400 font-bold">You're one step closer today!</p>
            </div>
          </div>

          <button
            onClick={() => window.location.href = '/dashboard/food'}
            className="gradient-btn px-5 py-2.5 rounded-xl font-semibold shadow-lg shadow-green-500/20 text-white flex items-center gap-2"
          >
            <Plus size={16} /> Log Food
          </button>
        </div>
      </div>

      {/* Top row of summary cards: Calories, Protein, Carbs, Fats, Water */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
        {/* Calories Card */}
        <div className="glass-card p-5 rounded-2xl flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="text-xs font-semibold text-dark-500 dark:text-dark-400 uppercase tracking-wider">Calories</p>
              <h3 className="text-2xl font-black text-dark-900 dark:text-white mt-1">
                {consumedCalories.toLocaleString()}
                <span className="text-xs font-medium text-dark-400 dark:text-dark-500"> / {targetCalories} kcal</span>
              </h3>
            </div>
            <div className="p-2.5 bg-orange-500/10 text-orange-500 rounded-xl">
              <Flame size={18} />
            </div>
          </div>
          <div className="mt-4">
            <div className="h-1.5 w-full bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
              <div 
                className="h-full bg-orange-500 rounded-full transition-all duration-500" 
                style={{ width: `${Math.min((consumedCalories / targetCalories) * 100, 100)}%` }}
              />
            </div>
            <p className="text-[10px] font-bold text-orange-600 dark:text-orange-400 mt-2">
              {Math.round((consumedCalories / targetCalories) * 100)}% of daily goal
            </p>
          </div>
        </div>

        {/* Protein Card */}
        <div className="glass-card p-5 rounded-2xl flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="text-xs font-semibold text-dark-500 dark:text-dark-400 uppercase tracking-wider">Protein</p>
              <h3 className="text-2xl font-black text-dark-900 dark:text-white mt-1">
                {Math.round(consumedProtein)}g
                <span className="text-xs font-medium text-dark-400 dark:text-dark-500"> / {proteinGoal} g</span>
              </h3>
            </div>
            <div className="p-2.5 bg-blue-500/10 text-blue-500 rounded-xl">
              <Dumbbell size={18} />
            </div>
          </div>
          <div className="mt-4">
            <div className="h-1.5 w-full bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 rounded-full transition-all duration-500" 
                style={{ width: `${Math.min((consumedProtein / proteinGoal) * 100, 100)}%` }}
              />
            </div>
            <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 mt-2">
              {Math.round((consumedProtein / proteinGoal) * 100)}% of daily goal
            </p>
          </div>
        </div>

        {/* Carbs Card */}
        <div className="glass-card p-5 rounded-2xl flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="text-xs font-semibold text-dark-500 dark:text-dark-400 uppercase tracking-wider">Carbs</p>
              <h3 className="text-2xl font-black text-dark-900 dark:text-white mt-1">
                {Math.round(consumedCarbs)}g
                <span className="text-xs font-medium text-dark-400 dark:text-dark-500"> / {carbsGoal} g</span>
              </h3>
            </div>
            <div className="p-2.5 bg-green-500/10 text-green-500 rounded-xl">
              <Leaf size={18} />
            </div>
          </div>
          <div className="mt-4">
            <div className="h-1.5 w-full bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
              <div 
                className="h-full bg-green-500 rounded-full transition-all duration-500" 
                style={{ width: `${Math.min((consumedCarbs / carbsGoal) * 100, 100)}%` }}
              />
            </div>
            <p className="text-[10px] font-bold text-green-600 dark:text-green-400 mt-2">
              {Math.round((consumedCarbs / carbsGoal) * 100)}% of daily goal
            </p>
          </div>
        </div>

        {/* Fats Card */}
        <div className="glass-card p-5 rounded-2xl flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="text-xs font-semibold text-dark-500 dark:text-dark-400 uppercase tracking-wider">Fats</p>
              <h3 className="text-2xl font-black text-dark-900 dark:text-white mt-1">
                {Math.round(consumedFats)}g
                <span className="text-xs font-medium text-dark-400 dark:text-dark-500"> / {fatsGoal} g</span>
              </h3>
            </div>
            <div className="p-2.5 bg-yellow-500/10 text-yellow-500 rounded-xl">
              <Flame size={18} />
            </div>
          </div>
          <div className="mt-4">
            <div className="h-1.5 w-full bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
              <div 
                className="h-full bg-yellow-500 rounded-full transition-all duration-500" 
                style={{ width: `${Math.min((consumedFats / fatsGoal) * 100, 100)}%` }}
              />
            </div>
            <p className="text-[10px] font-bold text-yellow-600 dark:text-yellow-400 mt-2">
              {Math.round((consumedFats / fatsGoal) * 100)}% of daily goal
            </p>
          </div>
        </div>

        {/* Water Card */}
        <div className="glass-card p-5 rounded-2xl flex flex-col justify-between">
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="text-xs font-semibold text-dark-500 dark:text-dark-400 uppercase tracking-wider">Water</p>
              <h3 className="text-2xl font-black text-dark-900 dark:text-white mt-1">
                {formatWater(waterSummary?.total || 0)}L
                <span className="text-xs font-medium text-dark-400 dark:text-dark-500"> / {formatWater(waterGoal)} L</span>
              </h3>
            </div>
            <div className="p-2.5 bg-sky-500/10 text-sky-500 rounded-xl">
              <Droplets size={18} />
            </div>
          </div>
          <div className="mt-4">
            <div className="h-1.5 w-full bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
              <div 
                className="h-full bg-sky-500 rounded-full transition-all duration-500" 
                style={{ width: `${Math.min(((waterSummary?.total || 0) / waterGoal) * 100, 100)}%` }}
              />
            </div>
            <p className="text-[10px] font-bold text-sky-600 dark:text-sky-400 mt-2">
              {Math.round(((waterSummary?.total || 0) / waterGoal) * 100)}% of daily goal
            </p>
          </div>
        </div>
      </div>

      {/* Main Content Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Column 1 (left): Calories Overview, Nutrient Balance */}
        <div className="lg:col-span-4 space-y-8">
          {/* Calories Overview */}
          <div className="glass-card p-6 rounded-3xl relative">
            <h3 className="text-lg font-bold text-dark-900 dark:text-white mb-6">Calories Overview</h3>
            <div className="relative h-64 w-full flex items-center justify-center">
              {mounted && (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={caloriesChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {caloriesChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value} kcal`} />
                  </PieChart>
                </ResponsiveContainer>
              )}
              {/* Central Text inside donut */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-extrabold text-dark-900 dark:text-white">
                  {consumedCalories.toLocaleString()}
                </span>
                <span className="text-[10px] font-bold text-dark-400 uppercase tracking-widest mt-0.5">
                  kcal Consumed
                </span>
              </div>
            </div>

            {/* Custom Legend */}
            <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-gray-100 dark:border-white/5 text-sm">
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full bg-green-500 shrink-0" />
                <div>
                  <p className="text-xs text-dark-500 dark:text-dark-400 font-medium">Food</p>
                  <p className="font-bold text-dark-900 dark:text-white">
                    {consumedCalories} kcal ({targetCalories > 0 ? Math.round((consumedCalories / targetCalories) * 100) : 0}%)
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full bg-gray-200 dark:bg-white/10 shrink-0" />
                <div>
                  <p className="text-xs text-dark-500 dark:text-dark-400 font-medium">Remaining</p>
                  <p className="font-bold text-dark-900 dark:text-white">
                    {Math.max(0, targetCalories - consumedCalories)} kcal ({targetCalories > 0 ? Math.max(0, Math.round(((targetCalories - consumedCalories) / targetCalories) * 100)) : 0}%)
                  </p>
                </div>
              </div>
            </div>

            {/* Deficit Banner */}
            <div className="mt-6 p-4 rounded-2xl bg-green-50/60 dark:bg-green-500/5 border border-green-100 dark:border-green-500/10 flex items-center gap-3">
              <div className="p-2 bg-green-500/10 text-green-600 dark:text-green-400 rounded-lg">
                <Activity size={16} />
              </div>
              <p className="text-xs text-dark-700 dark:text-dark-300 font-medium leading-normal">
                {caloriesDeficit > 0 ? (
                  <>
                    You are in a <span className="font-bold text-green-600 dark:text-green-400">{caloriesDeficit} kcal</span> deficit today. Great job! Keep it up to reach your goal.
                  </>
                ) : (
                  <>
                    You are <span className="font-bold text-orange-500">{Math.abs(caloriesDeficit)} kcal</span> over your daily target. Stay mindful of your next logs!
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Nutrient Balance */}
          <div className="glass-card p-6 rounded-3xl">
            <h3 className="text-lg font-bold text-dark-900 dark:text-white mb-6">Nutrient Balance</h3>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="relative h-44 w-44 shrink-0">
                {mounted && (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={nutrientChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {nutrientChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `${value}%`} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Legend */}
              <div className="flex-1 space-y-3.5 w-full">
                {nutrientChartData.map((item, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.fill }} />
                      <span className="text-xs text-dark-600 dark:text-dark-300 font-semibold">{item.name}</span>
                    </div>
                    <span className="text-xs font-bold text-dark-900 dark:text-white">{item.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Column 2 (middle): Weight Progress, Top Logged Foods, Daily Progress */}
        <div className="lg:col-span-4 space-y-8">
          {/* Weight Progress */}
          <div className="glass-card p-6 rounded-3xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-dark-900 dark:text-white">Weight Progress</h3>
              </div>
              {/* Weight Selector */}
              <select
                value={weightRange}
                onChange={(e) => setWeightRange(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-dark-900 text-xs font-semibold text-dark-700 dark:text-dark-200 outline-none cursor-pointer"
              >
                <option value="7 Days">7 Days</option>
                <option value="30 Days">30 Days</option>
              </select>
            </div>

            {/* Weight Summary Head */}
            <div className="flex items-end justify-between mb-6">
              <div>
                <h4 className="text-3xl font-black text-dark-900 dark:text-white">
                  {currentWeightVal ? `${currentWeightVal.toFixed(1)} kg` : '-- kg'}
                </h4>
                <p className="text-xs text-dark-500 dark:text-dark-400 mt-1">Current Weight</p>
              </div>

              {weightChangeVsLast && (
                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold ${
                  weightChangeVsLast.isLoss 
                    ? 'bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400'
                    : 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400'
                }`}>
                  {weightChangeVsLast.isLoss ? <TrendingDown size={14} /> : <TrendingUp size={14} />}
                  <span>
                    {weightChangeVsLast.value} kg vs last log
                  </span>
                </div>
              )}
            </div>

            {/* Recharts LineChart */}
            <div className="h-44 w-full">
              {mounted && (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weightChartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border-dark)" opacity={0.15} />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                    <YAxis domain={['dataMin - 1', 'dataMax + 1']} axisLine={false} tickLine={false} width={24} tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                    <Line
                      type="monotone"
                      dataKey="weight"
                      stroke="#22c55e"
                      strokeWidth={3}
                      dot={{ r: 3, fill: '#ffffff', stroke: '#22c55e', strokeWidth: 2 }}
                      activeDot={{ r: 5, strokeWidth: 0, fill: '#22c55e' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Goal Trend Banner */}
            <div className="mt-6 p-4 rounded-2xl bg-green-50/60 dark:bg-green-500/5 border border-green-100 dark:border-green-500/10 flex items-center gap-3">
              <span className="text-base">💪</span>
              <p className="text-xs text-dark-700 dark:text-dark-300 font-medium">
                You're trending in the right direction! Keep going! 🚀
              </p>
            </div>
          </div>

          {/* Daily Progress */}
          <div className="glass-card p-6 rounded-3xl">
            <h3 className="text-lg font-bold text-dark-900 dark:text-white mb-6">Daily Progress</h3>
            <div className="space-y-5">
              {/* Calories progress */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-dark-600 dark:text-dark-300">Calories Goal</span>
                  <span className="text-dark-900 dark:text-white font-bold">{Math.round((consumedCalories / targetCalories) * 100)}%</span>
                </div>
                <div className="h-2 w-full bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-orange-500 rounded-full transition-all duration-500" 
                    style={{ width: `${Math.min((consumedCalories / targetCalories) * 100, 100)}%` }}
                  />
                </div>
              </div>

              {/* Protein progress */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-dark-600 dark:text-dark-300">Protein Goal</span>
                  <span className="text-dark-900 dark:text-white font-bold">{Math.round((consumedProtein / proteinGoal) * 100)}%</span>
                </div>
                <div className="h-2 w-full bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 rounded-full transition-all duration-500" 
                    style={{ width: `${Math.min((consumedProtein / proteinGoal) * 100, 100)}%` }}
                  />
                </div>
              </div>

              {/* Water progress */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-dark-600 dark:text-dark-300">Water Goal</span>
                  <span className="text-dark-900 dark:text-white font-bold">{Math.round((waterSummary?.total || 0) / waterGoal * 100)}%</span>
                </div>
                <div className="h-2 w-full bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-sky-500 rounded-full transition-all duration-500" 
                    style={{ width: `${Math.min(((waterSummary?.total || 0) / waterGoal) * 100, 100)}%` }}
                  />
                </div>
              </div>

              {/* Weight goal progress */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-dark-600 dark:text-dark-300">Weight Goal Completion</span>
                  <span className="text-dark-900 dark:text-white font-bold">{weightProgress}%</span>
                </div>
                <div className="h-2 w-full bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-purple-500 rounded-full transition-all duration-500" 
                    style={{ width: `${weightProgress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Top Logged Foods */}
          <div className="glass-card p-6 rounded-3xl">
            <h3 className="text-lg font-bold text-dark-900 dark:text-white mb-6">Top Logged Foods</h3>
            <div className="divide-y divide-gray-100 dark:divide-white/5 space-y-4">
              {finalTopFoods.map((food, i) => (
                <div key={i} className="flex items-center justify-between pt-4 first:pt-0">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-green-500/10 text-green-500 rounded-xl">
                      <Utensils size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-dark-900 dark:text-white">{food.name}</p>
                      <p className="text-[10px] font-semibold text-dark-500 dark:text-dark-400 mt-0.5">{food.count} times logged</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-green-600 dark:text-green-400">
                    +{food.calories} kcal
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Column 3 (right): Health Insights, Motivation, Streak */}
        <div className="lg:col-span-4 space-y-8">
          {/* Health Insights */}
          <div className="glass-card p-6 rounded-3xl">
            <h3 className="text-lg font-bold text-dark-900 dark:text-white mb-6">Health Insights</h3>
            <div className="divide-y divide-gray-100 dark:divide-white/5 text-sm">
              <div className="flex justify-between py-3.5 first:pt-0">
                <span className="text-dark-500 dark:text-dark-400 font-medium flex items-center gap-2">
                  <Activity size={14} className="text-primary-500" />
                  BMI
                </span>
                {bmi ? (
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-dark-900 dark:text-white">{bmi.value}</span>
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full text-white" style={{ backgroundColor: bmi.color }}>
                      {bmi.category}
                    </span>
                  </div>
                ) : (
                  <span className="text-dark-400">—</span>
                )}
              </div>

              <div className="flex justify-between py-3.5">
                <span className="text-dark-500 dark:text-dark-400 font-medium flex items-center gap-2">
                  <Flame size={14} className="text-orange-500" />
                  BMR
                </span>
                <span className="font-bold text-dark-900 dark:text-white">
                  {healthInsights.bmr.toLocaleString()} kcal/day
                </span>
              </div>

              <div className="flex justify-between py-3.5">
                <span className="text-dark-500 dark:text-dark-400 font-medium flex items-center gap-2">
                  <Sparkles size={14} className="text-yellow-500" />
                  Maintenance (TDEE)
                </span>
                <span className="font-bold text-dark-900 dark:text-white">
                  {healthInsights.tdee.toLocaleString()} kcal/day
                </span>
              </div>

              <div className="flex justify-between py-3.5">
                <span className="text-dark-500 dark:text-dark-400 font-medium flex items-center gap-2">
                  <TrendingDown size={14} className="text-blue-500" />
                  Calories for Weight Loss
                </span>
                <span className="font-bold text-blue-600 dark:text-blue-400">
                  {healthInsights.caloriesLoss.toLocaleString()} kcal/day
                </span>
              </div>

              <div className="flex justify-between py-3.5">
                <span className="text-dark-500 dark:text-dark-400 font-medium flex items-center gap-2">
                  <TrendingUp size={14} className="text-amber-500" />
                  Calories for Weight Gain
                </span>
                <span className="font-bold text-amber-600 dark:text-amber-400">
                  {healthInsights.caloriesGain.toLocaleString()} kcal/day
                </span>
              </div>

              <div className="flex justify-between py-3.5">
                <span className="text-dark-500 dark:text-dark-400 font-medium flex items-center gap-2">
                  <Dumbbell size={14} className="text-indigo-500" />
                  Protein Target
                </span>
                <span className="font-bold text-dark-900 dark:text-white">
                  {healthInsights.proteinTarget} g/day
                </span>
              </div>

              <div className="flex justify-between py-3.5">
                <span className="text-dark-500 dark:text-dark-400 font-medium flex items-center gap-2">
                  <Droplets size={14} className="text-sky-500" />
                  Water Goal
                </span>
                <span className="font-bold text-dark-900 dark:text-white">
                  {(healthInsights.waterGoal / 1000).toFixed(1)} L/day
                </span>
              </div>

              <div className="flex justify-between py-3.5">
                <span className="text-dark-500 dark:text-dark-400 font-medium flex items-center gap-2">
                  <Activity size={14} className="text-purple-500" />
                  Goal
                </span>
                <span className="font-bold text-dark-900 dark:text-white capitalize">
                  {healthInsights.goalType}
                </span>
              </div>

              <div className="flex justify-between py-3.5">
                <span className="text-dark-500 dark:text-dark-400 font-medium flex items-center gap-2">
                  <Scale size={14} className="text-green-500" />
                  Goal Weight
                </span>
                <span className="font-bold text-dark-900 dark:text-white">
                  {user?.goalWeight ? `${user.goalWeight} kg` : '—'}
                </span>
              </div>

              <div className="flex justify-between py-3.5 last:pb-0">
                <span className="text-dark-500 dark:text-dark-400 font-medium flex items-center gap-2">
                  <Calendar size={14} className="text-rose-500" />
                  Est. Time to Goal
                </span>
                <span className="font-bold text-dark-900 dark:text-white">
                  {healthInsights.estimatedWeeks ? `~ ${healthInsights.estimatedWeeks} weeks` : 'At goal'}
                </span>
              </div>
            </div>
          </div>

          {/* Today's Motivation */}
          <div className="glass-card p-6 rounded-3xl">
            <h3 className="text-lg font-bold text-dark-900 dark:text-white mb-6">Today's Motivation</h3>
            <div className="space-y-4">
              {motivationMessages.map((msg, i) => (
                <div key={i} className="flex items-start gap-3 text-sm leading-normal text-dark-600 dark:text-dark-300">
                  <div className="mt-0.5 shrink-0">
                    {msg.type === 'water' && <Droplets size={16} className="text-sky-500" />}
                    {msg.type === 'protein' && <Dumbbell size={16} className="text-blue-500" />}
                    {msg.type === 'calorie' && <Flame size={16} className="text-orange-500" />}
                    {msg.type === 'eta' && <Calendar size={16} className="text-purple-500" />}
                    {msg.type === 'streak' && <Trophy size={16} className="text-yellow-500" />}
                  </div>
                  <p className="text-xs font-semibold">{msg.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Streak & Consistency */}
          <div className="glass-card p-6 rounded-3xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-yellow-500/10 text-yellow-500 rounded-xl">
                <Trophy size={20} />
              </div>
              <h3 className="text-lg font-bold text-dark-900 dark:text-white">Streak & Consistency</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-2xl text-center">
                <Flame size={24} className="text-orange-500 mx-auto mb-2 animate-bounce" />
                <p className="text-[10px] font-bold text-dark-500 dark:text-dark-400 uppercase">Current Streak</p>
                <p className="text-3xl font-black text-dark-900 dark:text-white mt-1">
                  {loggingStreak.currentStreak}
                </p>
                <p className="text-[9px] text-dark-400 dark:text-dark-500 font-semibold mt-1">consecutive days</p>
              </div>

              <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-2xl text-center">
                <Award size={24} className="text-yellow-500 mx-auto mb-2" />
                <p className="text-[10px] font-bold text-dark-500 dark:text-dark-400 uppercase">Longest Streak</p>
                <p className="text-3xl font-black text-dark-900 dark:text-white mt-1">
                  {loggingStreak.longestStreak}
                </p>
                <p className="text-[9px] text-dark-400 dark:text-dark-500 font-semibold mt-1">days record</p>
              </div>
            </div>

            {/* Consistency statement */}
            <p className="text-[10px] text-center text-dark-500 dark:text-dark-400 font-semibold mt-4">
              Log daily to keep your streak going strong! 🎯
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
