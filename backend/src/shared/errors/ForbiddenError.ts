import { AppError } from './AppError';

/**
 * Forbidden Error (403)
 * Thrown when user is authenticated but doesn't have permission
 */
export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden', details?: any) {
    super(message, 403, true, details);
    Object.setPrototypeOf(this, ForbiddenError.prototype);
  }
}
