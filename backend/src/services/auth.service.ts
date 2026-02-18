import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { User, IUserDocument } from '../models/User.model';
import { walletService } from './wallet.service';
import { logger } from '../config/logger';
import { sendPasswordResetEmail } from '../config/email';
import { IUserResponse, ITokenPair, IJWTPayloadData } from '../types';
import { RegisterInput, LoginInput } from '../validation/schemas';
import { jwt } from '../config/jwt';
import { ConflictError, UnauthorizedError, BadRequestError, ErrorMessages } from '../shared';

const SALT_ROUNDS = 12;

interface AuthResult {
  user: IUserResponse;
  tokens: ITokenPair;
}

const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

const validatePassword = async (
  password: string,
  passwordHash: string
): Promise<boolean> => {
  return bcrypt.compare(password, passwordHash);
};

const generateTokens = (payload: IJWTPayloadData): ITokenPair => {
  const tokens = jwt.create(payload);
  return {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken
  };
};

const register = async (input: RegisterInput): Promise<AuthResult> => {
  const existingUser = await User.findByEmail(input.email);
  if (existingUser) {
    logger.warn('Registration failed: Email already exists', { email: input.email });
    throw new ConflictError(ErrorMessages.AUTH.EMAIL_ALREADY_REGISTERED);
  }

  const wallet = await walletService.generateWallet();

  const passwordHash = await hashPassword(input.password);

  const user = new User({
    email: input.email.toLowerCase(),
    passwordHash,
    walletAddress: wallet.address,
    encryptedPrivateKey: wallet.encryptedPrivateKey,
    fiatBalance: 0
  });

  const savedUser = await user.save();

  logger.info('User registered successfully', { 
    userId: savedUser._id.toString(),
    email: savedUser.email 
  });

  const tokens = generateTokens({
    userId: savedUser._id.toString(),
    email: savedUser.email
  });

  return {
    user: savedUser.toSafeObject(),
    tokens
  };
};

const login = async (input: LoginInput): Promise<AuthResult> => {
  const user = await User.findByEmail(input.email.toLowerCase());
  if (!user) {
    logger.warn('Login failed: User not found', { email: input.email });
    throw new UnauthorizedError(ErrorMessages.AUTH.INVALID_CREDENTIALS);
  }

  const isValidPassword = await validatePassword(input.password, user.passwordHash);
  if (!isValidPassword) {
    logger.warn('Login failed: Invalid password', { email: input.email });
    throw new UnauthorizedError(ErrorMessages.AUTH.INVALID_CREDENTIALS);
  }

  logger.info('User logged in successfully', { 
    userId: user._id.toString(),
    email: user.email 
  });

  const tokens = generateTokens({
    userId: user._id.toString(),
    email: user.email
  });

  return {
    user: user.toSafeObject(),
    tokens
  };
};

const getUserById = async (userId: string): Promise<IUserDocument | null> => {
  try {
    return await User.findById(userId);
  } catch (error) {
    logger.error('Get user by ID error', { error, userId });
    return null;
  }
};

const refreshTokens = async (refreshToken: string): Promise<{ tokens: ITokenPair }> => {
  try {
    const newTokens = await jwt.refresh(refreshToken);
    return {
      tokens: {
        accessToken: newTokens.accessToken,
        refreshToken: newTokens.refreshToken
      }
    };
  } catch (error) {
    logger.warn('Token refresh failed', { error });
    throw new UnauthorizedError(ErrorMessages.AUTH.REFRESH_TOKEN_EXPIRED);
  }
};

const requestPasswordReset = async (email: string): Promise<void> => {
  // Always respond the same way regardless — don't reveal if email exists
  const user = await User.findByEmail(email.toLowerCase());
  if (!user) return;

  const rawToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

  user.passwordResetToken = hashedToken;
  user.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  await user.save();

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const resetLink = `${frontendUrl}/reset-password?token=${rawToken}&email=${encodeURIComponent(email)}`;

  await sendPasswordResetEmail(email, resetLink);
  logger.info('Password reset requested', { email });
};

const resetPassword = async (email: string, token: string, newPassword: string): Promise<void> => {
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  // Re-query including the protected fields
  const user = await User
    .findOne({ email: email.toLowerCase() })
    .select('+passwordResetToken +passwordResetExpires');

  if (
    !user ||
    user.passwordResetToken !== hashedToken ||
    !user.passwordResetExpires ||
    user.passwordResetExpires < new Date()
  ) {
    throw new BadRequestError('Reset link is invalid or has expired.');
  }

  user.passwordHash = await hashPassword(newPassword);
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  logger.info('Password reset completed', { email });
};

export const authService = {
  register,
  login,
  getUserById,
  validatePassword,
  hashPassword,
  generateTokens,
  refreshTokens,
  requestPasswordReset,
  resetPassword
};
