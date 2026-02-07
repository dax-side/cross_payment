import { AppError } from './AppError';

/**
 * Bad Request Error (400)
 * Thrown when the request is malformed or contains invalid data
 */
export class BadRequestError extends AppError {
  constructor(message: string = 'Bad request', details?: any) {
    super(message, 400, true, details);
    Object.setPrototypeOf(this, BadRequestError.prototype);
  }
}
