import { prisma } from '../utils/prisma';

export class ProteinService {
  static async logProtein(userId: string, data: any): Promise<any> {
    const { amount, date, source } = data;
    const logDate = new Date(date);

    return await prisma.proteinLog.create({
      data: {
        userId,
        amount,
        date: logDate,
        source,
      },
    });
  }

  static async getDailyProtein(userId: string, dateStr: string): Promise<any> {
    const startOfDay = new Date(dateStr);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(dateStr);
    endOfDay.setHours(23, 59, 59, 999);

    // 1. Fetch from custom protein logs
    const customLogs = await prisma.proteinLog.findMany({
      where: {
        userId,
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    const customTotal = customLogs.reduce((sum, log) => sum + log.amount, 0);

    // 2. Fetch from meal items
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

    let mealsTotal = 0;
    meals.forEach((meal) => {
      meal.items.forEach((item) => {
        mealsTotal += item.protein;
      });
    });

    const total = mealsTotal + customTotal;

    // Get protein goal from user profile (default to 1.6g/kg or 80g if weight is not specified)
    const user = await prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
    });

    const weight = user?.currentWeight || 70; // fallback to 70kg
    const goal = Math.round(weight * 1.6); // default protein goal (1.6g/kg)

    return {
      goal,
      consumed: Math.round(total * 10) / 10,
      remaining: Math.max(0, Math.round((goal - total) * 10) / 10),
      percentage: Math.min(100, Math.round((total / goal) * 100)),
      fromMeals: Math.round(mealsTotal * 10) / 10,
      fromCustom: Math.round(customTotal * 10) / 10,
      customLogs,
    };
  }

  static async getProteinHistory(userId: string, limit = 30): Promise<any[]> {
    // Return aggregated daily protein consumption history
    // Get meals and custom logs for last 30 days
    const today = new Date();
    const startDate = new Date();
    startDate.setDate(today.getDate() - limit);

    const [meals, customLogs] = await Promise.all([
      prisma.meal.findMany({
        where: {
          userId,
          date: { gte: startDate },
          deletedAt: null,
        },
        include: { items: true },
      }),
      prisma.proteinLog.findMany({
        where: {
          userId,
          date: { gte: startDate },
        },
      }),
    ]);

    const dailyMap = new Map<string, number>();

    meals.forEach((meal) => {
      const dateStr = meal.date.toISOString().split('T')[0];
      let protein = 0;
      meal.items.forEach((item) => { protein += item.protein; });
      dailyMap.set(dateStr, (dailyMap.get(dateStr) || 0) + protein);
    });

    customLogs.forEach((log) => {
      const dateStr = log.date.toISOString().split('T')[0];
      dailyMap.set(dateStr, (dailyMap.get(dateStr) || 0) + log.amount);
    });

    return Array.from(dailyMap.entries())
      .map(([date, amount]) => ({
        date,
        amount: Math.round(amount * 10) / 10,
      }))
      .sort((a, b) => b.date.localeCompare(a.date));
  }
}
