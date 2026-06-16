import { prisma } from '../utils/prisma';
import { calculateBMR, calculateTDEE, calculateDeficit, calculateDailyCalorieTarget } from '../utils/calculations.utils';
import { ActivityLevel } from '../types';

export class CalorieService {
  static async calculateBMRForUser(userId: string): Promise<any> {
    const user = await prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
    });

    if (!user || !user.currentWeight || !user.height || !user.age || !user.gender) {
      return null;
    }

    const bmr = calculateBMR(user.currentWeight, user.height, user.age, user.gender);
    const tdee = calculateTDEE(bmr, user.activityLevel as ActivityLevel || 'SEDENTARY');
    const deficit = calculateDeficit(user.currentWeight, user.goalWeight || user.currentWeight, tdee);
    const targetCalories = calculateDailyCalorieTarget(tdee, deficit);

    return {
      bmr: Math.round(bmr),
      tdee: Math.round(tdee),
      deficit: Math.round(deficit),
      targetCalories: Math.round(targetCalories),
    };
  }

  static async getDailyCalorieSummary(userId: string, dateStr: string): Promise<any> {
    const startOfDay = new Date(dateStr);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(dateStr);
    endOfDay.setHours(23, 59, 59, 999);

    // Get TDEE & target info
    const targets = await this.calculateBMRForUser(userId);
    const targetCalories = targets?.targetCalories || 2000;
    const tdee = targets?.tdee || 2500;
    const bmr = targets?.bmr || 1600;

    // Get actual calories consumed today
    const meals = await prisma.meal.findMany({
      where: {
        userId,
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
        deletedAt: null,
      },
      include: {
        items: true,
      },
    });

    let consumed = 0;
    const breakdown = {
      breakfast: 0,
      lunch: 0,
      dinner: 0,
      snack: 0,
    };

    meals.forEach((meal) => {
      let mealCal = 0;
      meal.items.forEach((item) => {
        mealCal += item.calories;
      });
      consumed += mealCal;

      const type = meal.mealType.toLowerCase();
      if (type === 'breakfast') breakdown.breakfast += mealCal;
      else if (type === 'lunch') breakdown.lunch += mealCal;
      else if (type === 'dinner') breakdown.dinner += mealCal;
      else if (type === 'snack') breakdown.snack += mealCal;
    });

    consumed = Math.round(consumed);
    const remaining = Math.max(0, targetCalories - consumed);
    const dailyDeficit = Math.round(tdee - consumed);

    return {
      date: dateStr,
      consumed,
      target: targetCalories,
      remaining,
      deficit: dailyDeficit,
      tdee,
      bmr,
      breakdown: {
        breakfast: Math.round(breakdown.breakfast),
        lunch: Math.round(breakdown.lunch),
        dinner: Math.round(breakdown.dinner),
        snack: Math.round(breakdown.snack),
      },
    };
  }

  /**
   * Syncs the CalorieLog table record for the specified date and user.
   */
  static async syncCalorieLog(userId: string, date: Date): Promise<void> {
    const dateStr = date.toISOString().split('T')[0];
    const summary = await this.getDailyCalorieSummary(userId, dateStr);

    const startOfDay = new Date(dateStr);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(dateStr);
    endOfDay.setHours(23, 59, 59, 999);

    const existingLog = await prisma.calorieLog.findFirst({
      where: {
        userId,
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    if (existingLog) {
      await prisma.calorieLog.update({
        where: { id: existingLog.id },
        data: {
          totalCalories: summary.consumed,
          targetCalories: summary.target,
          deficit: summary.deficit,
        },
      });
    } else {
      await prisma.calorieLog.create({
        data: {
          userId,
          date: startOfDay,
          totalCalories: summary.consumed,
          targetCalories: summary.target,
          deficit: summary.deficit,
        },
      });
    }
  }
}
