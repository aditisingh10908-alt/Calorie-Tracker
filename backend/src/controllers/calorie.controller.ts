import { Response, NextFunction } from 'express';
import { CalorieService } from '../services/calorie.service';
import { AuthenticatedRequest } from '../types';
import { successResponse } from '../utils/response.utils';

export class CalorieController {
  static async getDailySummary(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
    try {
      const userId = req.user?.userId;
      if (!userId) throw { statusCode: 401, message: 'Unauthorized' };

      const dateStr = req.query.date as string || new Date().toISOString().split('T')[0];
      const summary = await CalorieService.getDailyCalorieSummary(userId, dateStr);

      return res.status(200).json(successResponse('Daily calorie summary retrieved successfully', summary));
    } catch (error) {
      return next(error);
    }
  }

  static async calculateTDEE(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
    try {
      const userId = req.user?.userId;
      if (!userId) throw { statusCode: 401, message: 'Unauthorized' };

      const calculations = await CalorieService.calculateBMRForUser(userId);
      return res.status(200).json(successResponse('TDEE and BMR calculated successfully', calculations));
    } catch (error) {
      return next(error);
    }
  }
}
