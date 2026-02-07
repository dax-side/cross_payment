/**
 * Centralized error messages for consistent API responses
 * Single source of truth - domain-specific error messages
 */
export class ErrorMessages {
  static readonly AUTH = {
    INVALID_CREDENTIALS: 'Invalid email or password',
    EMAIL_ALREADY_REGISTERED: 'Email already registered',
    TOKEN_EXPIRED: 'Your token has expired. Please log in again',
    INVALID_TOKEN: 'Invalid token. Please log in again',
    REFRESH_TOKEN_EXPIRED: 'Refresh token expired',
  };

  static readonly USER = {
    NOT_FOUND: 'User not found',
    ALREADY_EXISTS: 'User already exists',
  };

  static readonly WALLET = {
    NOT_FOUND: 'Wallet not found',
    INSUFFICIENT_BALANCE: 'Insufficient wallet balance',
    GENERATION_FAILED: 'Failed to generate wallet',
  };

  static readonly PAYMENT = {
    INVALID_AMOUNT: 'Invalid payment amount',
    INVALID_RECIPIENT: 'Invalid recipient address',
    TRANSFER_FAILED: 'Payment transfer failed',
    INSUFFICIENT_BALANCE: 'Insufficient balance for payment',
  };

  static readonly BLOCKCHAIN = {
    TRANSFER_FAILED: 'Blockchain transfer failed',
    BALANCE_CHECK_FAILED: 'Failed to check balance',
    INVALID_ADDRESS: 'Invalid wallet address',
  };

  static readonly VALIDATION = {
    REQUIRED_FIELD_MISSING: 'Required field is missing',
    INVALID_EMAIL: 'Invalid email format',
    INVALID_AMOUNT: 'Invalid amount',
    AMOUNT_TOO_LOW: 'Amount is too low',
    AMOUNT_TOO_HIGH: 'Amount is too high',
  };
}
