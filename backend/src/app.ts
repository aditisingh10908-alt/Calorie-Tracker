import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config';
import apiRoutes from './routes';
import { errorHandler } from './middleware/errorHandler.middleware';
import { generalLimiter } from './middleware/rateLimiter.middleware';

const app = express();

// Security Middlewares
app.use(helmet());
app.use(cors({
  origin: '*', // For dev mode, open to all. Change in production.
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate Limiting
app.use(generalLimiter);

// Logger & Parsers
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api', apiRoutes);

// Base Health Check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development',
  });
});

// Global Error Handler
app.use(errorHandler);

// Start Server if not imported by tests
if (process.env.NODE_ENV !== 'test') {
  const PORT = config.port;
  app.listen(PORT, () => {
    console.log(`[Server] Running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
}

export default app;
