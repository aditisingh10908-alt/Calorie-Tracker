import { Request, Response, NextFunction } from 'express';
import { errorResponse } from '../utils/response.utils';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error(err);

  const status = err.statusCode || err.status || 500;
  const message = err.message || 'Internal Server Error';
  const errorDetails = process.env.NODE_ENV === 'development' ? err.stack : undefined;

  return res.status(status).json(
    errorResponse(message, errorDetails)
  );
};
