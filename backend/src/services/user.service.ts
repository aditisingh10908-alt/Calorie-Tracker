import { prisma } from '../utils/prisma';

export class UserService {
  static async getProfile(userId: string): Promise<any> {
    const user = await prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
    });

    if (!user) {
      throw { statusCode: 404, message: 'User not found' };
    }

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  static async updateProfile(userId: string, data: any): Promise<any> {
    const user = await prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
    });

    if (!user) {
      throw { statusCode: 404, message: 'User not found' };
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data,
    });

    // If weight goals or details change, let's sync the Goal model as well
    if (data.goalWeight || data.currentWeight) {
      const activeWeightGoal = await prisma.goal.findFirst({
        where: { userId, goalType: 'WEIGHT_LOSS', status: 'ACTIVE' },
      });

      if (activeWeightGoal) {
        await prisma.goal.update({
          where: { id: activeWeightGoal.id },
          data: {
            targetValue: data.goalWeight ?? activeWeightGoal.targetValue,
            currentValue: data.currentWeight ?? activeWeightGoal.currentValue,
          },
        });
      }
    }

    const { password, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  }

  static async deleteAccount(userId: string): Promise<void> {
    const user = await prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
    });

    if (!user) {
      throw { statusCode: 404, message: 'User not found' };
    }

    // Soft delete
    await prisma.user.update({
      where: { id: userId },
      data: { deletedAt: new Date() },
    });
  }
}
