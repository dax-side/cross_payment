import { Request, Response, NextFunction } from 'express';
import { TokenExpiredError, InvalidTokenError } from '@dax-side/jwt-abstraction';
import { logger } from '../config/logger';
import { IAPIResponse, IJWTPayload } from '../types';
import { jwt } from '../config/jwt';

const extractToken = (req: Request): string | null => {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  const cookieToken = req.cookies?.accessToken as string | undefined;
  if (cookieToken) {
    return cookieToken;
  }

  return null;
};

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractToken(req);

    if (!token) {
      res.status(401).json({
        success: false,
        error: 'Authentication required'
      } as IAPIResponse<null>);
      return;
    }

    const payload = await jwt.verify(token) as IJWTPayload;
    req.user = payload;
    next();
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      logger.warn('Token expired');
      res.status(401).json({
        success: false,
        error: 'Token expired'
      } as IAPIResponse<null>);
      return;
    }

    if (error instanceof InvalidTokenError) {
      logger.warn('Invalid token');
      res.status(401).json({
        success: false,
        error: 'Invalid token'
      } as IAPIResponse<null>);
      return;
    }

    logger.error('Authentication error', { error });
    res.status(401).json({
      success: false,
      error: 'Authentication failed'
    } as IAPIResponse<null>);
  }
};

export const optionalAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractToken(req);

    if (token) {
      const payload = await jwt.verify(token) as IJWTPayload;
      req.user = payload;
    }
    next();
  } catch {
    next();
  }
};
