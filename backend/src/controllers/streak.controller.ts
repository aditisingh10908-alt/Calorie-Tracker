import { Response, NextFunction } from 'express';
import { StreakService } from '../services/streak.service';
import { AuthenticatedRequest } from '../types';
import { successResponse } from '../utils/response.utils';

export class StreakController {
  static async getStreaks(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
    try {
      const userId = req.user?.userId;
      if (!userId) throw { statusCode: 401, message: 'Unauthorized' };

      const streaks = await StreakService.getStreaks(userId);
      return res.status(200).json(successResponse('Streaks retrieved successfully', streaks));
    } catch (error) {
      return next(error);
    }
  }

  static async updateStreak(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
    try {
      const userId = req.user?.userId;
      if (!userId) throw { statusCode: 401, message: 'Unauthorized' };

      const { type } = req.params;
      const logDate = req.body.date ? new Date(req.body.date) : new Date();

      const streak = await StreakService.updateStreak(userId, (type as string).toUpperCase(), logDate);
      return res.status(200).json(successResponse('Streak updated successfully', streak));
    } catch (error) {
      return next(error);
    }
  }
}
