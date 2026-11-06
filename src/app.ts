import express, { Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import apiRoutes from './routes';
import { setupSwagger } from './config/swagger';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware';

export function createApp(): Express {
  const app = express();

  // Security headers with helmet
  app.use(
    helmet({
      contentSecurityPolicy: false, // Allows Swagger UI to render assets cleanly
    })
  );

  // CORS configuration
  app.use(cors());

  // Rate limiting (100 requests per minute per IP)
  const limiter = rateLimit({
    windowMs: 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message: 'Too many requests from this IP, please try again after a minute',
    },
  });
  app.use('/api', limiter);

  // Request logging
  if (process.env.NODE_ENV !== 'test') {
    app.use(morgan('dev'));
  }

  // Body parsing
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Health check endpoint
  app.get('/health', (_req, res) => {
    res.status(200).json({
      status: 'UP',
      timestamp: new Date().toISOString(),
      service: 'Retailer Onboarding & Sales Tracking API',
    });
  });

  // Swagger Documentation
  setupSwagger(app);

  // Mount API v1 Routes
  app.use('/api/v1', apiRoutes);

  // 404 handler
  app.use(notFoundHandler);

  // Central Error Handler
  app.use(errorHandler);

  return app;
}

export default createApp;
