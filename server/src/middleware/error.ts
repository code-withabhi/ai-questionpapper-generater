import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../utils/logger.js';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void => {
  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      message: error.message,
    });
    return;
  }

  if (error instanceof ZodError) {
    const errors: Record<string, string[]> = {};
    error.errors.forEach((err) => {
      const path = err.path.join('.');
      if (!errors[path]) {
        errors[path] = [];
      }
      errors[path]!.push(err.message);
    });

    res.status(400).json({
      message: 'Validation error',
      errors,
    });
    return;
  }

  // Log unexpected errors
  logger.error({ err: error, path: req.path }, 'Unexpected error');

  res.status(500).json({
    message: 'Internal server error',
  });
};

export const notFound = (req: Request, res: Response): void => {
  res.status(404).json({
    message: `Route not found: ${req.method} ${req.path}`,
  });
};
