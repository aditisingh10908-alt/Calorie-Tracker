import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config';
import apiRoutes from './routes';
import { errorHandler } from './middleware/errorHandler.middleware';
import { generalLimiter } from './middleware/rateLimiter.middleware';

const app = express();

app.set('trust proxy', 1);

// Security Middlewares
app.use(helmet());

app.use(cors({
  origin: '*', // change to your frontend URL in production
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Logging + body parsing
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check (DO NOT rate limit this)
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development',
  });
});

// Rate limiter ONLY for API routes
app.use('/api', generalLimiter);

// API routes
app.use('/api', apiRoutes);

// Global error handler (must be last middleware)
app.use(errorHandler);

// Start server (Railway-safe)
if (process.env.NODE_ENV !== 'test') {
  const PORT = Number(config.port || process.env.PORT || 5000);

  app.listen(PORT, '0.0.0.0', () => {
    console.log(
      `[Server] Running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`
    );
  });
}

export default app;