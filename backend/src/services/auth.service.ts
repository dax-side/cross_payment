import bcrypt from 'bcrypt';
import { User, IUserDocument } from '../models/User.model';
import { walletService } from './wallet.service';
import { logger } from '../config/logger';
import { IUserResponse, ITokenPair, IJWTPayloadData } from '../types';
import { RegisterInput, LoginInput } from '../validation/schemas';
import { jwt } from '../config/jwt';
import { ConflictError, UnauthorizedError, ErrorMessages } from '../shared';

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

export const authService = {
  register,
  login,
  getUserById,
  validatePassword,
  hashPassword,
  generateTokens,
  refreshTokens
};
