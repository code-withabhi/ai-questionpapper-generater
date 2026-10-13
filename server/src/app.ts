import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import config from './config/index.js';
import { errorHandler, notFound } from './middleware/error.js';
import authRouter from './routes/auth.routes.js';
import subjectRouter from './routes/subject.routes.js';
import chapterRouter from './routes/chapter.routes.js';
import topicRouter from './routes/topic.routes.js';
import questionRouter from './routes/question.routes.js';
import dashboardRouter from './routes/dashboard.routes.js';
import aiRouter from './routes/ai.routes.js';
import paperRouter from './routes/paper.routes.js';
import { generalLimiter } from './middleware/rateLimiter.js';

export function createApp(): Application {
  const app = express();

  // Security middleware
  app.use(helmet());
  app.use(
    cors({
      origin: config.cors.allowedOrigins,
      credentials: true,
    })
  );

  // Body parsing middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser());

  // Apply general rate limiting
  app.use('/api/', generalLimiter);

  // Health check endpoint
  app.get('/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  // API routes
  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/subjects', subjectRouter);
  app.use('/api/v1/chapters', chapterRouter);
  app.use('/api/v1/topics', topicRouter);
  app.use('/api/v1/questions', questionRouter);
  app.use('/api/v1/dashboard', dashboardRouter);
  app.use('/api/v1/ai', aiRouter);
  app.use('/api/v1/papers', paperRouter);

  // 404 handler
  app.use(notFound);

  // Error handler (must be last)
  app.use(errorHandler);

  return app;
}
