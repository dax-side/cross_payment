import { Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { logger } from '../config/logger';
import { RegisterInput, LoginInput, RefreshTokenInput } from '../validation/schemas';
import { sendSuccess, SuccessMessages, UnauthorizedError, NotFoundError, ErrorMessages } from '../shared';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/'
};

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Validation error or email already exists
 */
export const register = async (req: Request, res: Response): Promise<void> => {
  const input = req.body as RegisterInput;

  const result = await authService.register(input);

  res.cookie('accessToken', result.tokens.accessToken, {
    ...COOKIE_OPTIONS,
    maxAge: 15 * 60 * 1000 
  });

  res.cookie('refreshToken', result.tokens.refreshToken, {
    ...COOKIE_OPTIONS,
    maxAge: 7 * 24 * 60 * 60 * 1000 
  });

  logger.info('User registered', { userId: result.user.id });

  sendSuccess(res, SuccessMessages.AUTH.REGISTER_SUCCESS, {
    user: result.user,
    tokens: result.tokens
  });
};

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  const input = req.body as LoginInput;

  const result = await authService.login(input);

  res.cookie('accessToken', result.tokens.accessToken, {
    ...COOKIE_OPTIONS,
    maxAge: 15 * 60 * 1000
  });

  res.cookie('refreshToken', result.tokens.refreshToken, {
    ...COOKIE_OPTIONS,
    maxAge: 7 * 24 * 60 * 60 * 1000
  });

  logger.info('User logged in', { userId: result.user.id });

  sendSuccess(res, SuccessMessages.AUTH.LOGIN_SUCCESS, {
    user: result.user,
    tokens: result.tokens
  });
};

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 */
export const logout = async (_req: Request, res: Response): Promise<void> => {
  res.clearCookie('accessToken', COOKIE_OPTIONS);
  res.clearCookie('refreshToken', COOKIE_OPTIONS);

  sendSuccess(res, SuccessMessages.AUTH.LOGOUT_SUCCESS);
};

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *       401:
 *         description: Invalid refresh token
 */
export const refresh = async (req: Request, res: Response): Promise<void> => {
  const refreshToken = 
    (req.body as RefreshTokenInput).refreshToken ?? 
    req.cookies?.refreshToken as string | undefined;

  if (!refreshToken) {
    throw new UnauthorizedError(ErrorMessages.AUTH.REFRESH_TOKEN_EXPIRED);
  }

  const result = await authService.refreshTokens(refreshToken);

  res.cookie('accessToken', result.tokens.accessToken, {
    ...COOKIE_OPTIONS,
    maxAge: 15 * 60 * 1000
  });

  res.cookie('refreshToken', result.tokens.refreshToken, {
    ...COOKIE_OPTIONS,
    maxAge: 7 * 24 * 60 * 60 * 1000
  });

  sendSuccess(res, SuccessMessages.AUTH.TOKEN_REFRESHED, { tokens: result.tokens });
};

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user data
 *       401:
 *         description: Not authenticated
 */
export const me = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.userId;

  if (!userId) {
    throw new UnauthorizedError(ErrorMessages.AUTH.INVALID_TOKEN);
  }

  const user = await authService.getUserById(userId);

  if (!user) {
    throw new NotFoundError(ErrorMessages.USER.NOT_FOUND);
  }

  sendSuccess(res, SuccessMessages.USER.PROFILE_RETRIEVED, { user: user.toSafeObject() });
};
