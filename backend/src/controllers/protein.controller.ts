import { Response, NextFunction } from 'express';
import { ProteinService } from '../services/protein.service';
import { AuthenticatedRequest } from '../types';
import { successResponse } from '../utils/response.utils';

export class ProteinController {
  static async getDailyProtein(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
    try {
      const userId = req.user?.userId;
      if (!userId) throw { statusCode: 401, message: 'Unauthorized' };

      const dateStr = req.query.date as string || new Date().toISOString().split('T')[0];
      const summary = await ProteinService.getDailyProtein(userId, dateStr);

      return res.status(200).json(successResponse('Daily protein summary retrieved successfully', summary));
    } catch (error) {
      return next(error);
    }
  }

  static async getProteinHistory(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
    try {
      const userId = req.user?.userId;
      if (!userId) throw { statusCode: 401, message: 'Unauthorized' };

      const limit = parseInt(req.query.limit as string || '30', 10);
      const history = await ProteinService.getProteinHistory(userId, limit);

      return res.status(200).json(successResponse('Protein history retrieved successfully', history));
    } catch (error) {
      return next(error);
    }
  }
}
