import { Response, NextFunction } from 'express';
import { WeightService } from '../services/weight.service';
import { AuthenticatedRequest } from '../types';
import { successResponse } from '../utils/response.utils';

export class WeightController {
  static async logWeight(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
    try {
      const userId = req.user?.userId;
      if (!userId) throw { statusCode: 401, message: 'Unauthorized' };

      const log = await WeightService.logWeight(userId, req.body);
      return res.status(201).json(successResponse('Weight logged successfully', log));
    } catch (error) {
      return next(error);
    }
  }

  static async getWeightHistory(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
    try {
      const userId = req.user?.userId;
      if (!userId) throw { statusCode: 401, message: 'Unauthorized' };

      const limit = parseInt(req.query.limit as string || '30', 10);
      const history = await WeightService.getWeightHistory(userId, limit);

      return res.status(200).json(successResponse('Weight history retrieved successfully', history));
    } catch (error) {
      return next(error);
    }
  }

  static async getLatestWeight(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
    try {
      const userId = req.user?.userId;
      if (!userId) throw { statusCode: 401, message: 'Unauthorized' };

      const latest = await WeightService.getLatestWeight(userId);
      return res.status(200).json(successResponse('Latest weight retrieved successfully', latest));
    } catch (error) {
      return next(error);
    }
  }

  static async deleteWeightLog(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
    try {
      const userId = req.user?.userId;
      if (!userId) throw { statusCode: 401, message: 'Unauthorized' };

      await WeightService.deleteWeightLog(userId, req.params.id as string);
      return res.status(200).json(successResponse('Weight log entry deleted successfully'));
    } catch (error) {
      return next(error);
    }
  }
}
