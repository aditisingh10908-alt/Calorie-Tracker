import { Response, NextFunction } from 'express';
import { MlService } from '../services/ml.service';
import { AuthenticatedRequest } from '../types';
import { successResponse } from '../utils/response.utils';

export class MlController {
  static async predictWeight(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
    try {
      const userId = req.user?.userId;
      if (!userId) throw { statusCode: 401, message: 'Unauthorized' };

      const prediction = await MlService.predictWeight(userId);
      return res.status(200).json(successResponse('Weight prediction generated successfully', prediction));
    } catch (error) {
      return next(error);
    }
  }

  static async predictGoal(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
    try {
      const userId = req.user?.userId;
      if (!userId) throw { statusCode: 401, message: 'Unauthorized' };

      const prediction = await MlService.predictGoal(userId);
      return res.status(200).json(successResponse('Goal prediction generated successfully', prediction));
    } catch (error) {
      return next(error);
    }
  }

  static async getRecommendations(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
    try {
      const userId = req.user?.userId;
      if (!userId) throw { statusCode: 401, message: 'Unauthorized' };

      const recommendations = await MlService.getRecommendations(userId);
      return res.status(200).json(successResponse('Personalized recommendations generated successfully', recommendations));
    } catch (error) {
      return next(error);
    }
  }

  static async analyzeDeficit(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
    try {
      const userId = req.user?.userId;
      if (!userId) throw { statusCode: 401, message: 'Unauthorized' };

      const analysis = await MlService.analyzeDeficit(userId);
      return res.status(200).json(successResponse('Deficit analysis completed successfully', analysis));
    } catch (error) {
      return next(error);
    }
  }
}
