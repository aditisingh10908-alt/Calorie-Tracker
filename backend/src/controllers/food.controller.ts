import { Response, NextFunction } from 'express';
import { FoodService } from '../services/food.service';
import { AuthenticatedRequest } from '../types';
import { successResponse } from '../utils/response.utils';

export class FoodController {
  static async createFood(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
    try {
      const userId = req.user?.userId;
      if (!userId) throw { statusCode: 401, message: 'Unauthorized' };

      const food = await FoodService.createFood(userId, req.body);
      return res.status(201).json(successResponse('Custom food created successfully', food));
    } catch (error) {
      return next(error);
    }
  }

  static async getFoods(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
    try {
      const userId = req.user?.userId;
      if (!userId) throw { statusCode: 401, message: 'Unauthorized' };

      const page = parseInt(req.query.page as string || '1', 10);
      const limit = parseInt(req.query.limit as string || '20', 10);

      const foods = await FoodService.getAllFoods(userId, page, limit);
      return res.status(200).json(successResponse('Foods retrieved successfully', foods));
    } catch (error) {
      return next(error);
    }
  }

  static async searchFoods(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
    try {
      const userId = req.user?.userId;
      if (!userId) throw { statusCode: 401, message: 'Unauthorized' };

      const query = req.query.q as string || '';
      const foods = await FoodService.searchFoods(userId, query);
      return res.status(200).json(successResponse('Foods searched successfully', foods));
    } catch (error) {
      return next(error);
    }
  }

  static async getRecommendations(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
    try {
      const userId = req.user?.userId;
      if (!userId) throw { statusCode: 401, message: 'Unauthorized' };

      const mealType = req.query.mealType as string || undefined;
      const foods = await FoodService.getRecommendedFoods(userId, mealType);
      return res.status(200).json(successResponse('Personalized food recommendations retrieved successfully', foods));
    } catch (error) {
      return next(error);
    }
  }

  static async getFoodById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
    try {
      const userId = req.user?.userId;
      if (!userId) throw { statusCode: 401, message: 'Unauthorized' };

      const food = await FoodService.getFoodById(userId, req.params.id as string);
      return res.status(200).json(successResponse('Food item retrieved successfully', food));
    } catch (error) {
      return next(error);
    }
  }

  static async updateFood(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
    try {
      const userId = req.user?.userId;
      if (!userId) throw { statusCode: 401, message: 'Unauthorized' };

      const food = await FoodService.updateFood(userId, req.params.id as string, req.body);
      return res.status(200).json(successResponse('Food item updated successfully', food));
    } catch (error) {
      return next(error);
    }
  }

  static async deleteFood(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
    try {
      const userId = req.user?.userId;
      if (!userId) throw { statusCode: 401, message: 'Unauthorized' };

      await FoodService.deleteFood(userId, req.params.id as string);
      return res.status(200).json(successResponse('Food item deleted successfully'));
    } catch (error) {
      return next(error);
    }
  }

  static async toggleFavorite(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
    try {
      const userId = req.user?.userId;
      if (!userId) throw { statusCode: 401, message: 'Unauthorized' };

      const result = await FoodService.toggleFavorite(userId, req.params.id as string);
      const msg = result.isFavorite ? 'Food added to favorites' : 'Food removed from favorites';
      return res.status(200).json(successResponse(msg, result));
    } catch (error) {
      return next(error);
    }
  }

  static async getFavorites(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<any> {
    try {
      const userId = req.user?.userId;
      if (!userId) throw { statusCode: 401, message: 'Unauthorized' };

      const foods = await FoodService.getFavorites(userId);
      return res.status(200).json(successResponse('Favorite foods retrieved successfully', foods));
    } catch (error) {
      return next(error);
    }
  }
}
