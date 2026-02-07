/**
 * Base Application Error
 * All custom errors should extend this class
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly details?: any;

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true,
    details?: any
  ) {
    super(message);
    
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
    
    Object.setPrototypeOf(this, AppError.prototype);
    
    this.name = this.constructor.name;
  }

  /**
   * Convert error to JSON for API response
   */
  toJSON(): { success: false; error: string; details?: any } {
    return {
      success: false,
      error: this.message,
      ...(this.details && { details: this.details }),
    };
  }
}
