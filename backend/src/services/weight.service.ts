import { prisma } from '../utils/prisma';
import { StreakService } from './streak.service';

export class WeightService {
  static async logWeight(userId: string, data: any): Promise<any> {
    const { weight, date, note } = data;
    const logDate = new Date(date);

    return await prisma.$transaction(async (tx) => {
      // 1. Create weight log
      const log = await tx.weightLog.create({
        data: {
          userId,
          weight,
          date: logDate,
          note,
        },
      });

      // 2. Update user current weight
      await tx.user.update({
        where: { id: userId },
        data: { currentWeight: weight },
      });

      // 3. Update the active goal currentValue if applicable
      const activeGoal = await tx.goal.findFirst({
        where: { userId, goalType: 'WEIGHT_LOSS', status: 'ACTIVE' },
      });

      if (activeGoal) {
        await tx.goal.update({
          where: { id: activeGoal.id },
          data: { currentValue: weight },
        });
      }

      // 4. Update the weight logging streak
      try {
        await StreakService.updateStreakInTransaction(tx, userId, 'WEIGHT', logDate);
        await StreakService.updateStreakInTransaction(tx, userId, 'LOGGING', logDate);
      } catch (err) {
        console.error('Streak update failed inside weight transaction:', err);
      }

      return log;
    });
  }

  static async getWeightHistory(userId: string, limit = 30): Promise<any[]> {
    return await prisma.weightLog.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: limit,
    });
  }

  static async getLatestWeight(userId: string): Promise<any> {
    const log = await prisma.weightLog.findFirst({
      where: { userId },
      orderBy: { date: 'desc' },
    });

    if (!log) {
      // Return user profile's weight if no weight log exists
      const user = await prisma.user.findFirst({
        where: { id: userId, deletedAt: null },
      });
      return user?.currentWeight ? { weight: user.currentWeight, date: user.createdAt } : null;
    }

    return log;
  }

  static async deleteWeightLog(userId: string, id: string): Promise<void> {
    const log = await prisma.weightLog.findFirst({
      where: { id, userId },
    });

    if (!log) {
      throw { statusCode: 404, message: 'Weight log not found' };
    }

    await prisma.$transaction(async (tx) => {
      await tx.weightLog.delete({
        where: { id },
      });

      // Revert the user profile weight to the previous log
      const previousLog = await tx.weightLog.findFirst({
        where: { userId },
        orderBy: { date: 'desc' },
      });

      if (previousLog) {
        await tx.user.update({
          where: { id: userId },
          data: { currentWeight: previousLog.weight },
        });
      }
    });
  }
}
