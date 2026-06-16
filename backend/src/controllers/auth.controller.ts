import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { successResponse, errorResponse } from '../utils/response.utils';

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const result = await AuthService.register(req.body);
      return res.status(201).json(successResponse('User registered successfully', result));
    } catch (error) {
      return next(error);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const result = await AuthService.login(req.body);
      return res.status(200).json(successResponse('Login successful', result));
    } catch (error) {
      return next(error);
    }
  }

  static async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      const message = await AuthService.forgotPassword(req.body.email);
      return res.status(200).json(successResponse(message));
    } catch (error) {
      return next(error);
    }
  }

  static async resetPassword(req: Request, res: Response, next: NextFunction): Promise<any> {
    try {
      await AuthService.resetPassword(req.body);
      return res.status(200).json(successResponse('Password reset successful'));
    } catch (error) {
      return next(error);
    }
  }
}
