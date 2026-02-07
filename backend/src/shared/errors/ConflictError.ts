import { AppError } from './AppError';

/**
 * Conflict Error (409)
 * Thrown when there's a conflict with current state (e.g., duplicate resource)
 */
export class ConflictError extends AppError {
  constructor(message: string = 'Resource conflict', details?: any) {
    super(message, 409, true, details);
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}
