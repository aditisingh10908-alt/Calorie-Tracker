import { prisma } from '../utils/prisma';
import { StreakService } from './streak.service';

export class WaterService {
  static async logWater(userId: string, data: any): Promise<any> {
    const { amount, date, time } = data;
    const logDate = new Date(date);

    const log = await prisma.waterLog.create({
      data: {
        userId,
        amount,
        date: logDate,
        time,
      },
    });

    // Fire-and-forget streak update
    try {
      await StreakService.updateStreak(userId, 'LOGGING', logDate);
    } catch (err) {
      console.error(err);
    }

    return log;
  }

  static async getDailyWater(userId: string, dateStr: string): Promise<any> {
    const startOfDay = new Date(dateStr);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(dateStr);
    endOfDay.setHours(23, 59, 59, 999);

    const logs = await prisma.waterLog.findMany({
      where: {
        userId,
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    const total = logs.reduce((sum, log) => sum + log.amount, 0);

    return {
      total,
      logs,
    };
  }

  static async getWaterHistory(userId: string, limit = 30): Promise<any[]> {
    // Group water intake by date for the last X entries/days
    const logs = await prisma.waterLog.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: 200, // retrieve enough raw entries to aggregate
    });

    // Group by date string (YYYY-MM-DD)
    const grouped = new Map<string, number>();
    logs.forEach((log) => {
      const day = log.date.toISOString().split('T')[0];
      grouped.set(day, (grouped.get(day) || 0) + log.amount);
    });

    const result = Array.from(grouped.entries()).map(([date, amount]) => ({
      date,
      amount,
    }));

    return result.slice(0, limit);
  }

  static async deleteWaterLog(userId: string, id: string): Promise<void> {
    const log = await prisma.waterLog.findFirst({
      where: { id, userId },
    });

    if (!log) {
      throw { statusCode: 404, message: 'Water log not found' };
    }

    await prisma.waterLog.delete({
      where: { id },
    });
  }
}
