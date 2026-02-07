import { AppError } from './AppError';

/**
 * Internal Server Error (500)
 * Thrown when an unexpected error occurs
 */
export class InternalServerError extends AppError {
  constructor(message: string = 'Internal server error', details?: any) {
    super(message, 500, false, details);
    Object.setPrototypeOf(this, InternalServerError.prototype);
  }
}
