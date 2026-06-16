import { Response, NextFunction } from 'express';
import { AnalyticsService } from '../services/analytics.service';
import { AuthenticatedRequest } from '../types';
import { successResponse } from '../utils/response.utils';

export class AnalyticsController {
  static async getWeeklyReport(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
    try {
      const userId = req.user?.userId;
      if (!userId) throw { statusCode: 401, message: 'Unauthorized' };

      const report = await AnalyticsService.getWeeklyReport(userId);
      return res.status(200).json(successResponse('Weekly report retrieved successfully', report));
    } catch (error) {
      return next(error);
    }
  }

  static async getMonthlyReport(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
    try {
      const userId = req.user?.userId;
      if (!userId) throw { statusCode: 401, message: 'Unauthorized' };

      const report = await AnalyticsService.getMonthlyReport(userId);
      return res.status(200).json(successResponse('Monthly report retrieved successfully', report));
    } catch (error) {
      return next(error);
    }
  }

  static async getTrends(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
    try {
      const userId = req.user?.userId;
      if (!userId) throw { statusCode: 401, message: 'Unauthorized' };

      const trends = await AnalyticsService.getTrends(userId);
      return res.status(200).json(successResponse('Trends data retrieved successfully', trends));
    } catch (error) {
      return next(error);
    }
  }
}
