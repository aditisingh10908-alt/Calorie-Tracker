import { prisma } from '../utils/prisma';

export class AnalyticsService {
  static async getWeeklyReport(userId: string): Promise<any> {
    const today = new Date();
    const startDate = new Date();
    startDate.setDate(today.getDate() - 7);
    startDate.setHours(0, 0, 0, 0);

    return await this.getReportForPeriod(userId, startDate, today);
  }

  static async getMonthlyReport(userId: string): Promise<any> {
    const today = new Date();
    const startDate = new Date();
    startDate.setDate(today.getDate() - 30);
    startDate.setHours(0, 0, 0, 0);

    return await this.getReportForPeriod(userId, startDate, today);
  }

  private static async getReportForPeriod(userId: string, startDate: Date, endDate: Date): Promise<any> {
    const [calorieLogs, waterLogs, weightLogs, meals] = await Promise.all([
      prisma.calorieLog.findMany({
        where: {
          userId,
          date: { gte: startDate, lte: endDate },
        },
        orderBy: { date: 'asc' },
      }),
      prisma.waterLog.findMany({
        where: {
          userId,
          date: { gte: startDate, lte: endDate },
        },
      }),
      prisma.weightLog.findMany({
        where: {
          userId,
          date: { gte: startDate, lte: endDate },
        },
        orderBy: { date: 'asc' },
      }),
      prisma.meal.findMany({
        where: {
          userId,
          date: { gte: startDate, lte: endDate },
          deletedAt: null,
        },
        include: { items: true },
      }),
    ]);

    // Aggregate daily protein
    const proteinMap = new Map<string, number>();
    meals.forEach((meal) => {
      const dateStr = meal.date.toISOString().split('T')[0];
      let p = 0;
      meal.items.forEach((item) => { p += item.protein; });
      proteinMap.set(dateStr, (proteinMap.get(dateStr) || 0) + p);
    });

    // Aggregate daily water
    const waterMap = new Map<string, number>();
    waterLogs.forEach((w) => {
      const dateStr = w.date.toISOString().split('T')[0];
      waterMap.set(dateStr, (waterMap.get(dateStr) || 0) + w.amount);
    });

    // Calculate averages
    const totalDays = Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));

    const avgCalories = calorieLogs.length > 0
      ? Math.round(calorieLogs.reduce((sum, log) => sum + log.totalCalories, 0) / calorieLogs.length)
      : 0;

    const avgDeficit = calorieLogs.length > 0
      ? Math.round(calorieLogs.reduce((sum, log) => sum + log.deficit, 0) / calorieLogs.length)
      : 0;

    const proteinValues = Array.from(proteinMap.values());
    const avgProtein = proteinValues.length > 0
      ? Math.round(proteinValues.reduce((sum, v) => sum + v, 0) / proteinValues.length * 10) / 10
      : 0;

    const waterValues = Array.from(waterMap.values());
    const avgWater = waterValues.length > 0
      ? Math.round(waterValues.reduce((sum, v) => sum + v, 0) / waterValues.length)
      : 0;

    const avgWeight = weightLogs.length > 0
      ? Math.round(weightLogs.reduce((sum, log) => sum + log.weight, 0) / weightLogs.length * 10) / 10
      : null;

    // Generate daily timeseries for charting
    const chartData: any[] = [];
    const dateCursor = new Date(startDate);
    while (dateCursor <= endDate) {
      const dateStr = dateCursor.toISOString().split('T')[0];
      const calLog = calorieLogs.find((l) => l.date.toISOString().split('T')[0] === dateStr);
      const weightLog = weightLogs.find((l) => l.date.toISOString().split('T')[0] === dateStr);

      chartData.push({
        date: dateStr,
        calories: calLog ? Math.round(calLog.totalCalories) : 0,
        deficit: calLog ? Math.round(calLog.deficit) : 0,
        target: calLog ? Math.round(calLog.targetCalories) : 2000,
        protein: Math.round((proteinMap.get(dateStr) || 0) * 10) / 10,
        water: waterMap.get(dateStr) || 0,
        weight: weightLog ? weightLog.weight : null,
      });

      dateCursor.setDate(dateCursor.getDate() + 1);
    }

    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      daysLogged: calorieLogs.length,
      totalDays,
      averages: {
        calories: avgCalories,
        deficit: avgDeficit,
        protein: avgProtein,
        water: avgWater,
        weight: avgWeight,
      },
      chartData,
    };
  }

  static async getTrends(userId: string): Promise<any> {
    const today = new Date();
    const startDate = new Date();
    startDate.setDate(today.getDate() - 90); // last 90 days for trends

    const [weightLogs, calorieLogs] = await Promise.all([
      prisma.weightLog.findMany({
        where: { userId, date: { gte: startDate } },
        orderBy: { date: 'asc' },
      }),
      prisma.calorieLog.findMany({
        where: { userId, date: { gte: startDate } },
        orderBy: { date: 'asc' },
      }),
    ]);

    const weightTrend = weightLogs.map((log) => ({
      date: log.date.toISOString().split('T')[0],
      weight: log.weight,
    }));

    const calorieTrend = calorieLogs.map((log) => ({
      date: log.date.toISOString().split('T')[0],
      calories: log.totalCalories,
      deficit: log.deficit,
    }));

    return {
      weightTrend,
      calorieTrend,
    };
  }
}
