import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  databaseUrl: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/calorie_tracker?schema=public',
  jwt: {
    secret: process.env.JWT_SECRET || 'default-jwt-secret-change-in-production',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'default-refresh-secret-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshExpiresIn: '30d',
  },
  mlServiceUrl: process.env.ML_SERVICE_URL || 'http://localhost:8000',
  bcryptSaltRounds: 12,
  rateLimit: {
    windowMs: 15 * 60 * 1000,
    maxRequests: 100000,
    authMaxRequests: 10000,
  },
  pagination: {
    defaultPage: 1,
    defaultLimit: 20,
    maxLimit: 100,
  },
};
