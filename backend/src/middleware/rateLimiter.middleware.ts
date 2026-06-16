import rateLimit from 'express-rate-limit';
import { config } from '../config';
import { errorResponse } from '../utils/response.utils';

export const generalLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  message: errorResponse('Too many requests from this IP, please try again after 15 minutes'),
});

export const authLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.authMaxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  message: errorResponse('Too many authentication attempts, please try again after 15 minutes'),
});
