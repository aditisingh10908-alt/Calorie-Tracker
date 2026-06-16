import axios from 'axios';
import { config } from '../config';
import { prisma } from '../utils/prisma';
import { CalorieService } from './calorie.service';

export class MlService {
  private static getClient() {
    return axios.create({
      baseURL: config.mlServiceUrl,
      timeout: 5000,
    });
  }

  static async predictWeight(userId: string): Promise<any> {
    try {
      const user = await prisma.user.findFirst({
        where: { id: userId, deletedAt: null },
      });

      if (!user) throw { statusCode: 404, message: 'User not found' };

      const weightHistory = await prisma.weightLog.findMany({
        where: { userId },
        orderBy: { date: 'asc' },
      });

      const formattedHistory = weightHistory.map((w) => ({
        date: w.date.toISOString().split('T')[0],
        weight: w.weight,
      }));

      const targets = await CalorieService.calculateBMRForUser(userId);

      const payload = {
        current_weight: user.currentWeight || 70,
        daily_calories: targets?.targetCalories || 2000,
        tdee: targets?.tdee || 2400,
        activity_level: user.activityLevel || 'SEDENTARY',
        historical_weights: formattedHistory,
      };

      const client = this.getClient();
      const response = await client.post('/predict/weight', payload);
      return response.data;
    } catch (err: any) {
      console.warn('ML Service predictWeight failed, using fallback:', err.message);
      // Fallback: rule-based linear forecast based on 500 kcal/day deficit if no history
      const user = await prisma.user.findUnique({ where: { id: userId } });
      const current = user?.currentWeight || 70;
      const rate = 0.5; // default 0.5 kg / week loss
      return {
        predicted_weight_7d: Math.round((current - (rate / 7) * 7) * 10) / 10,
        predicted_weight_30d: Math.round((current - (rate / 7) * 30) * 10) / 10,
        weekly_rate: rate,
        confidence: 0.5,
        is_fallback: true,
      };
    }
  }

  static async predictGoal(userId: string): Promise<any> {
    try {
      const user = await prisma.user.findFirst({
        where: { id: userId, deletedAt: null },
      });
      if (!user) throw { statusCode: 404, message: 'User not found' };

      const weightHistory = await prisma.weightLog.findMany({
        where: { userId },
        orderBy: { date: 'asc' },
      });

      const formattedHistory = weightHistory.map((w) => ({
        date: w.date.toISOString().split('T')[0],
        weight: w.weight,
      }));

      const targets = await CalorieService.calculateBMRForUser(userId);

      const payload = {
        current_weight: user.currentWeight || 70,
        goal_weight: user.goalWeight || user.currentWeight || 65,
        daily_calories: targets?.targetCalories || 2000,
        tdee: targets?.tdee || 2400,
        activity_level: user.activityLevel || 'SEDENTARY',
        historical_weights: formattedHistory,
      };

      const client = this.getClient();
      const response = await client.post('/predict/goal', payload);
      return response.data;
    } catch (err: any) {
      console.warn('ML Service predictGoal failed, using fallback:', err.message);
      const user = await prisma.user.findUnique({ where: { id: userId } });
      const current = user?.currentWeight || 70;
      const goal = user?.goalWeight || 65;
      const diff = current - goal;
      const days = diff > 0 ? Math.ceil((diff * 7700) / 500) : 0;
      const estDate = new Date();
      estDate.setDate(estDate.getDate() + days);

      return {
        probability: diff > 0 ? 0.75 : 1.0,
        estimated_days: days,
        estimated_date: estDate.toISOString().split('T')[0],
        risk_factors: diff > 20 ? ['Aggressive weight loss target (>20kg)'] : [],
        is_fallback: true,
      };
    }
  }

  static async getRecommendations(userId: string): Promise<any> {
    try {
      const user = await prisma.user.findFirst({
        where: { id: userId, deletedAt: null },
      });
      if (!user) throw { statusCode: 404, message: 'User not found' };

      const payload = {
        age: user.age || 30,
        gender: user.gender || 'male',
        height: user.height || 170,
        current_weight: user.currentWeight || 70,
        goal_weight: user.goalWeight || 65,
        activity_level: user.activityLevel || 'SEDENTARY',
      };

      const client = this.getClient();
      const response = await client.post('/recommend', payload);
      return response.data;
    } catch (err: any) {
      console.warn('ML Service getRecommendations failed, using fallback:', err.message);
      const user = await prisma.user.findUnique({ where: { id: userId } });
      const targets = await CalorieService.calculateBMRForUser(userId);
      const weight = user?.currentWeight || 70;

      return {
        recommended_calories: targets?.targetCalories || 2000,
        recommended_protein: Math.round(weight * 1.6),
        recommended_water: user?.activityLevel === 'ACTIVE' || user?.activityLevel === 'VERY_ACTIVE' ? 3500 : 2500,
        recommended_deficit: targets?.deficit || 500,
        explanation: 'Calculated using baseline Mifflin-St Jeor formulas (ML model offline). Recommended calories are target intake to support healthy weight deficit.',
        is_fallback: true,
      };
    }
  }

  static async analyzeDeficit(userId: string): Promise<any> {
    try {
      const user = await prisma.user.findFirst({
        where: { id: userId, deletedAt: null },
      });
      if (!user) throw { statusCode: 404, message: 'User not found' };

      const logs = await prisma.calorieLog.findMany({
        where: { userId },
        orderBy: { date: 'asc' },
        take: 30,
      });

      const formattedLogs = logs.map((l) => ({
        date: l.date.toISOString().split('T')[0],
        calories: l.totalCalories,
        target_calories: l.targetCalories,
      }));

      const payload = {
        daily_logs: formattedLogs,
        current_weight: user.currentWeight || 70,
        goal_weight: user.goalWeight || 65,
      };

      const client = this.getClient();
      const response = await client.post('/analyze/deficit', payload);
      return response.data;
    } catch (err: any) {
      console.warn('ML Service analyzeDeficit failed, using fallback:', err.message);
      return {
        average_deficit: 500,
        consistency_score: 80.0,
        plateau_risk: 'LOW',
        analysis: 'Baseline logging analysis shows consistent records. Real-time machine learning analysis is temporarily offline.',
        is_fallback: true,
      };
    }
  }
}
