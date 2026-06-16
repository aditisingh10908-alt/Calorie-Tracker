import { prisma } from '../utils/prisma';
import { hashPassword, comparePassword } from '../utils/hash.utils';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt.utils';
import { TokenPair } from '../types';
import crypto from 'crypto';

// Simple temporary in-memory store for password reset tokens.
// In production, you would use a redis store or a database column.
// Since we have soft delete support and user profiles, let's keep it simple:
// We can use a Map keyed by token containing { email, expires }
const resetTokens = new Map<string, { email: string; expires: number }>();

export class AuthService {
  static async register(data: any): Promise<any> {
    const { email, password, name, age, gender, height, currentWeight, goalWeight, activityLevel } = data;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw { statusCode: 400, message: 'Email already registered' };
    }

    const hashedPassword = await hashPassword(password);

    // Create user in transaction to ensure streaks and goals are also created
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          age,
          gender,
          height,
          currentWeight,
          goalWeight,
          activityLevel,
        },
      });

      // Initialize streaks for LOGGING, GOAL, and WEIGHT
      await tx.streak.createMany({
        data: [
          { userId: newUser.id, streakType: 'LOGGING', currentStreak: 0, longestStreak: 0 },
          { userId: newUser.id, streakType: 'GOAL', currentStreak: 0, longestStreak: 0 },
          { userId: newUser.id, streakType: 'WEIGHT', currentStreak: 0, longestStreak: 0 },
        ],
      });

      // Initialize a default weight loss goal if weight parameters are provided
      if (currentWeight && goalWeight) {
        await tx.goal.create({
          data: {
            userId: newUser.id,
            goalType: 'WEIGHT_LOSS',
            targetValue: goalWeight,
            currentValue: currentWeight,
            startDate: new Date(),
            status: 'ACTIVE',
          },
        });
      }

      return newUser;
    });

    // Generate tokens
    const accessToken = generateAccessToken({ userId: user.id, email: user.email });
    const refreshToken = generateRefreshToken({ userId: user.id, email: user.email });

    // Exclude password from returned user object
    const { password: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      accessToken,
      refreshToken,
    };
  }

  static async login(data: any): Promise<any> {
    const { email, password } = data;

    const user = await prisma.user.findFirst({
      where: { email, deletedAt: null },
    });

    if (!user) {
      throw { statusCode: 401, message: 'Invalid email or password' };
    }

    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      throw { statusCode: 401, message: 'Invalid email or password' };
    }

    const accessToken = generateAccessToken({ userId: user.id, email: user.email });
    const refreshToken = generateRefreshToken({ userId: user.id, email: user.email });

    const { password: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      accessToken,
      refreshToken,
    };
  }

  static async forgotPassword(email: string): Promise<string> {
    const user = await prisma.user.findFirst({
      where: { email, deletedAt: null },
    });

    if (!user) {
      // Return success anyway for security reasons, so users cannot enumerate accounts
      return 'If that email exists in our system, we have sent a reset link to it.';
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expires = Date.now() + 3600000; // 1 hour expiry

    resetTokens.set(token, { email, expires });

    // In production, send email. For now, log to console:
    console.log(`\n========================================`);
    console.log(`PASSWORD RESET REQUEST`);
    console.log(`User: ${user.name} (${email})`);
    console.log(`Reset Link: http://localhost:3000/reset-password?token=${token}`);
    console.log(`========================================\n`);

    return 'If that email exists in our system, we have sent a reset link to it.';
  }

  static async resetPassword(data: any): Promise<void> {
    const { token, newPassword } = data;

    const resetInfo = resetTokens.get(token);
    if (!resetInfo || resetInfo.expires < Date.now()) {
      throw { statusCode: 400, message: 'Invalid or expired password reset token' };
    }

    const user = await prisma.user.findFirst({
      where: { email: resetInfo.email, deletedAt: null },
    });

    if (!user) {
      throw { statusCode: 404, message: 'User not found' };
    }

    const hashedPassword = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    resetTokens.delete(token);
  }
}
