import { prisma } from '../utils/prisma';

export class StreakService {
  /**
   * Updates a user streak within an active database transaction.
   */
  static async updateStreakInTransaction(
    tx: any,
    userId: string,
    streakType: string,
    logDate: Date
  ): Promise<any> {
    const logDateStr = logDate.toISOString().split('T')[0];
    const targetDate = new Date(logDateStr);

    let streak = await tx.streak.findFirst({
      where: { userId, streakType },
    });

    if (!streak) {
      streak = await tx.streak.create({
        data: {
          userId,
          streakType,
          currentStreak: 1,
          longestStreak: 1,
          lastLogDate: targetDate,
        },
      });
      return streak;
    }

    if (!streak.lastLogDate) {
      const updated = await tx.streak.update({
        where: { id: streak.id },
        data: {
          currentStreak: 1,
          longestStreak: Math.max(1, streak.longestStreak),
          lastLogDate: targetDate,
        },
      });
      return updated;
    }

    const lastLogDateStr = streak.lastLogDate.toISOString().split('T')[0];
    const lastLog = new Date(lastLogDateStr);

    const diffTime = targetDate.getTime() - lastLog.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      // Consecutive day! Increment
      const newCurrent = streak.currentStreak + 1;
      const newLongest = Math.max(newCurrent, streak.longestStreak);

      const updatedStreak = await tx.streak.update({
        where: { id: streak.id },
        data: {
          currentStreak: newCurrent,
          longestStreak: newLongest,
          lastLogDate: targetDate,
        },
      });

      const milestones = [3, 7, 14, 30, 50, 100];
      if (milestones.includes(newCurrent)) {
        await tx.notification.create({
          data: {
            userId,
            type: 'STREAK_MILESTONE',
            message: `Awesome! You've hit a ${newCurrent}-day ${streakType.toLowerCase()} streak! Keep it up 🔥`,
          }
        });
      }

      return updatedStreak;
    } else if (diffDays > 1) {
      // Streak broken. Reset to 1
      return await tx.streak.update({
        where: { id: streak.id },
        data: {
          currentStreak: 1,
          lastLogDate: targetDate,
        },
      });
    } else if (diffDays === 0) {
      // Already logged today. Keep current streak.
      return streak;
    }

    // Logging in past date, ignore streak changes
    return streak;
  }

  /**
   * Updates user streak outside of transactions.
   */
  static async updateStreak(userId: string, streakType: string, logDate: Date): Promise<any> {
    return await prisma.$transaction(async (tx) => {
      return await this.updateStreakInTransaction(tx, userId, streakType, logDate);
    });
  }

  static async getStreaks(userId: string): Promise<any[]> {
    return await prisma.streak.findMany({
      where: { userId },
    });
  }
}
