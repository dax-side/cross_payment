import { AppError } from './AppError';

/**
 * Validation Error (422)
 * Thrown when request data fails validation
 */
export class ValidationError extends AppError {
  constructor(message: string = 'Validation failed', details?: any) {
    super(message, 422, true, details);
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}
