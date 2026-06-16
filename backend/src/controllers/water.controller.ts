import { Response, NextFunction } from 'express';
import { WaterService } from '../services/water.service';
import { AuthenticatedRequest } from '../types';
import { successResponse } from '../utils/response.utils';

export class WaterController {
  static async logWater(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
    try {
      const userId = req.user?.userId;
      if (!userId) throw { statusCode: 401, message: 'Unauthorized' };

      const log = await WaterService.logWater(userId, req.body);
      return res.status(201).json(successResponse('Water intake logged successfully', log));
    } catch (error) {
      return next(error);
    }
  }

  static async getDailyWater(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
    try {
      const userId = req.user?.userId;
      if (!userId) throw { statusCode: 401, message: 'Unauthorized' };

      const dateStr = req.query.date as string || new Date().toISOString().split('T')[0];
      const summary = await WaterService.getDailyWater(userId, dateStr);

      return res.status(200).json(successResponse('Daily water intake retrieved successfully', summary));
    } catch (error) {
      return next(error);
    }
  }

  static async getWaterHistory(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
    try {
      const userId = req.user?.userId;
      if (!userId) throw { statusCode: 401, message: 'Unauthorized' };

      const limit = parseInt(req.query.limit as string || '30', 10);
      const history = await WaterService.getWaterHistory(userId, limit);

      return res.status(200).json(successResponse('Water intake history retrieved successfully', history));
    } catch (error) {
      return next(error);
    }
  }

  static async deleteWaterLog(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
    try {
      const userId = req.user?.userId;
      if (!userId) throw { statusCode: 401, message: 'Unauthorized' };

      await WaterService.deleteWaterLog(userId, req.params.id as string);
      return res.status(200).json(successResponse('Water log entry deleted successfully'));
    } catch (error) {
      return next(error);
    }
  }
}
