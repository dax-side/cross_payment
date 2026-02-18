/**
 * Centralized success responses for consistent API responses
 * Single source of truth - includes status codes and messages
 */

export interface SuccessResponse {
  statusCode: number;
  message: string;
}

export class SuccessMessages {
  static readonly AUTH = {
    REGISTER_SUCCESS: { statusCode: 201, message: 'User registered successfully' },
    LOGIN_SUCCESS: { statusCode: 200, message: 'Login successful' },
    LOGOUT_SUCCESS: { statusCode: 200, message: 'Logout successful' },
    TOKEN_REFRESHED: { statusCode: 200, message: 'Token refreshed successfully' },
    PASSWORD_RESET_REQUESTED: { statusCode: 200, message: 'If that email exists, we just fired a reset link at it.' },
    PASSWORD_RESET_SUCCESS: { statusCode: 200, message: 'Password destroyed. New password accepted. You may enter.' },
  };

  static readonly USER = {
    RETRIEVED: { statusCode: 200, message: 'User retrieved successfully' },
    UPDATED: { statusCode: 200, message: 'User updated successfully' },
    PROFILE_RETRIEVED: { statusCode: 200, message: 'User profile retrieved successfully' },
  };

  static readonly WALLET = {
    BALANCE_RETRIEVED: { statusCode: 200, message: 'Wallet balance retrieved successfully' },
    ADDRESS_RETRIEVED: { statusCode: 200, message: 'Wallet address retrieved successfully' },
    DEPOSIT_SUCCESS: { statusCode: 200, message: 'Deposit successful' },
    WITHDRAWAL_SUCCESS: { statusCode: 200, message: 'Withdrawal successful' },
  };

  static readonly PAYMENT = {
    SENT_SUCCESS: { statusCode: 200, message: 'Payment sent successfully' },
    HISTORY_RETRIEVED: { statusCode: 200, message: 'Payment history retrieved successfully' },
    TRANSACTION_RETRIEVED: { statusCode: 200, message: 'Transaction retrieved successfully' },
    PREVIEW_SUCCESS: { statusCode: 200, message: 'Payment preview generated successfully' },
    TOPUP_INTENT_CREATED: { statusCode: 200, message: 'Payment intent created' },
    TOPUP_SUCCESS: { statusCode: 200, message: 'Top-up successful' },
  };

  static readonly RATES = {
    RETRIEVED: { statusCode: 200, message: 'Exchange rates retrieved successfully' },
  };

  static readonly GENERIC = {
    SUCCESS: { statusCode: 200, message: 'Operation completed successfully' },
    CREATED: { statusCode: 201, message: 'Resource created successfully' },
    UPDATED: { statusCode: 200, message: 'Resource updated successfully' },
    DELETED: { statusCode: 200, message: 'Resource deleted successfully' },
  };
}
