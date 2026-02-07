import { AppError } from './AppError';

/**
 * Unauthorized Error (401)
 * Thrown when authentication is required but missing or invalid
 */
export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized', details?: any) {
    super(message, 401, true, details);
    Object.setPrototypeOf(this, UnauthorizedError.prototype);
  }
}
