import { Request, Response, NextFunction } from 'express';
import { ZodError, ZodSchema } from 'zod';
import { logger } from '../config/logger';
import { IAPIResponse } from '../types';
import { AppError, ValidationError } from '../shared';

type AsyncHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void>;

export const asyncHandler = (fn: AsyncHandler): AsyncHandler => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await fn(req, res, next);
    } catch (error) {
      next(error);
    }
  };
};

export const validate = <T>(schema: ZodSchema<T>) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message
        }));
        
        next(new ValidationError('Validation failed', errors));
        return;
      }
      next(error);
    }
  };
};

export const validateQuery = (schema: ZodSchema<any>) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const result = schema.parse(req.query);
      req.query = result;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message
        }));
        
        next(new ValidationError('Invalid query parameters', errors));
        return;
      }
      next(error);
    }
  };
};

export const errorHandler = (
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (error instanceof AppError) {
    logger.error('Application error', { 
      name: error.name,
      message: error.message,
      statusCode: error.statusCode,
      details: error.details,
      stack: error.isOperational ? undefined : error.stack
    });

    res.status(error.statusCode).json(error.toJSON());
    return;
  }

  logger.error('Unhandled error', { 
    error: error.message, 
    stack: error.stack 
  });

  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : error.message
  } as IAPIResponse<null>);
};

export const notFoundHandler = (
  req: Request,
  res: Response
): void => {
  logger.warn('Route not found', { 
    method: req.method, 
    path: req.path 
  });

  res.status(404).json({
    success: false,
    error: 'Route not found'
  } as IAPIResponse<null>);
};
