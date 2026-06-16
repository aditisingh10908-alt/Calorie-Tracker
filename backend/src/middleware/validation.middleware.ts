import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { errorResponse } from '../utils/response.utils';

export const validateRequest = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
      // Validate req.body, req.query, and req.params if defined in the Zod schema.
      // Usually we validate req.body, but we can structure the schema to check body, query, or params.
      // Here we will validate req.body by default.
      const validated = await schema.parseAsync(req.body);
      req.body = validated;
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.errors.map((err) => `${err.path.join('.')}: ${err.message}`).join(', ');
        return res.status(400).json(errorResponse(`Validation Error: ${errorMessages}`, error.errors));
      }
      return res.status(400).json(errorResponse('Validation failed', error));
    }
  };
};

export const validateQuery = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
      const validated = await schema.parseAsync(req.query);
      req.query = validated;
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.errors.map((err) => `${err.path.join('.')}: ${err.message}`).join(', ');
        return res.status(400).json(errorResponse(`Validation Error: ${errorMessages}`, error.errors));
      }
      return res.status(400).json(errorResponse('Validation failed', error));
    }
  };
};
