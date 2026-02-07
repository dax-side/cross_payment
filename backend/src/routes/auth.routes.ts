import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';
import { asyncHandler, validate } from '../middleware/errorHandler';
import { registerSchema, loginSchema } from '../validation/schemas';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication endpoints
 */

router.post(
  '/register',
  validate(registerSchema),
  asyncHandler(authController.register)
);

router.post(
  '/login',
  validate(loginSchema),
  asyncHandler(authController.login)
);

router.post(
  '/logout',
  authenticate,
  asyncHandler(authController.logout)
);

router.post(
  '/refresh',
  asyncHandler(authController.refresh)
);

router.get(
  '/me',
  authenticate,
  asyncHandler(authController.me)
);

export default router;
