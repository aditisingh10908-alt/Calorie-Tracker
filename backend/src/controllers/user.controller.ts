import { Response, NextFunction } from 'express';
import { UserService } from '../services/user.service';
import { AuthenticatedRequest } from '../types';
import { successResponse } from '../utils/response.utils';

export class UserController {
  static async getProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
    try {
      const userId = req.user?.userId;
      if (!userId) throw { statusCode: 401, message: 'Unauthorized' };

      const profile = await UserService.getProfile(userId);
      return res.status(200).json(successResponse('Profile retrieved successfully', profile));
    } catch (error) {
      return next(error);
    }
  }

  static async updateProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
    try {
      const userId = req.user?.userId;
      if (!userId) throw { statusCode: 401, message: 'Unauthorized' };

      const profile = await UserService.updateProfile(userId, req.body);
      return res.status(200).json(successResponse('Profile updated successfully', profile));
    } catch (error) {
      return next(error);
    }
  }

  static async deleteAccount(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
    try {
      const userId = req.user?.userId;
      if (!userId) throw { statusCode: 401, message: 'Unauthorized' };

      await UserService.deleteAccount(userId);
      return res.status(200).json(successResponse('Account deleted successfully'));
    } catch (error) {
      return next(error);
    }
  }
}
