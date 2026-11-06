import express, { Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'path';
import fs from 'fs';
import apiRoutes from './routes';
import { setupSwagger } from './config/swagger';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware';
import { prisma } from './utils/prisma';
import { env } from './config/env';

export function createApp(): Express {
  const app = express();

  // Trust proxy for load balancers (Railway, Render, AWS, Nginx)
  app.set('trust proxy', 1);

  // Security headers with helmet
  app.use(
    helmet({
      contentSecurityPolicy: false, // Allows Swagger UI to render assets cleanly
    })
  );

  // CORS configuration
  const corsOptions: cors.CorsOptions = {
    origin: env.CORS_ORIGIN
      ? env.CORS_ORIGIN.split(',').map((s) => s.trim())
      : true,
    credentials: true,
  };
  app.use(cors(corsOptions));

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

  // Comprehensive Health check endpoint (checks database connectivity)
  app.get('/health', async (_req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.status(200).json({
        status: 'UP',
        database: 'CONNECTED',
        timestamp: new Date().toISOString(),
        service: 'Retailer Onboarding & Sales Tracking API',
      });
    } catch (err: any) {
      res.status(503).json({
        status: 'DOWN',
        database: 'DISCONNECTED',
        error: err.message,
        timestamp: new Date().toISOString(),
      });
    }
  });

  // Swagger Documentation
  setupSwagger(app);

  // Mount API v1 Routes
  app.use('/api/v1', apiRoutes);

  // Optional: Serve exported Expo Web app statically from backend
  if (env.SERVE_STATIC_WEB) {
    const webDistPath = path.join(__dirname, '../../public');
    const altDistPath = path.join(__dirname, '../../../dist');
    const staticDir = fs.existsSync(webDistPath)
      ? webDistPath
      : fs.existsSync(altDistPath)
      ? altDistPath
      : null;

    if (staticDir) {
      app.use(express.static(staticDir));
      app.get('*', (req, res, next) => {
        if (req.path.startsWith('/api') || req.path.startsWith('/health')) {
          return next();
        }
        res.sendFile(path.join(staticDir, 'index.html'));
      });
    }
  }

  // 404 handler
  app.use(notFoundHandler);

  // Central Error Handler
  app.use(errorHandler);

  return app;
}

export default createApp;
