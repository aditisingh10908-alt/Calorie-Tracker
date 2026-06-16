import { Response, NextFunction } from 'express';
import { MealService } from '../services/meal.service';
import { AuthenticatedRequest } from '../types';
import { successResponse } from '../utils/response.utils';

export class MealController {
  static async createMeal(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
    try {
      const userId = req.user?.userId;
      if (!userId) throw { statusCode: 401, message: 'Unauthorized' };

      const meal = await MealService.createMeal(userId, req.body);
      return res.status(201).json(successResponse('Meal logged successfully', meal));
    } catch (error) {
      return next(error);
    }
  }

  static async getMealsByDate(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
    try {
      const userId = req.user?.userId;
      if (!userId) throw { statusCode: 401, message: 'Unauthorized' };

      const dateStr = req.query.date as string || new Date().toISOString().split('T')[0];
      const summary = await MealService.getDailyMealSummary(userId, dateStr);

      return res.status(200).json(successResponse('Meals for date retrieved successfully', summary));
    } catch (error) {
      return next(error);
    }
  }

  static async getMealById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
    try {
      const userId = req.user?.userId;
      if (!userId) throw { statusCode: 401, message: 'Unauthorized' };

      const meal = await MealService.getMealById(userId, req.params.id as string);
      return res.status(200).json(successResponse('Meal retrieved successfully', meal));
    } catch (error) {
      return next(error);
    }
  }

  static async updateMeal(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
    try {
      const userId = req.user?.userId;
      if (!userId) throw { statusCode: 401, message: 'Unauthorized' };

      const meal = await MealService.updateMeal(userId, req.params.id as string, req.body);
      return res.status(200).json(successResponse('Meal updated successfully', meal));
    } catch (error) {
      return next(error);
    }
  }

  static async deleteMeal(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
    try {
      const userId = req.user?.userId;
      if (!userId) throw { statusCode: 401, message: 'Unauthorized' };

      await MealService.deleteMeal(userId, req.params.id as string);
      return res.status(200).json(successResponse('Meal deleted successfully'));
    } catch (error) {
      return next(error);
    }
  }
}
