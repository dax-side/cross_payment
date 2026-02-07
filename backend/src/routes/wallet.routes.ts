import { Router } from 'express';
import * as walletController from '../controllers/wallet.controller';
import { authenticate } from '../middleware/auth';
import { asyncHandler, validate } from '../middleware/errorHandler';
import { depositSchema, withdrawSchema } from '../validation/schemas';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Wallet
 *   description: Wallet management endpoints
 */

router.get(
  '/balance',
  authenticate,
  asyncHandler(walletController.getBalance)
);

router.get(
  '/treasury',
  authenticate,
  asyncHandler(walletController.getTreasuryBalance)
);

router.get(
  '/address',
  authenticate,
  asyncHandler(walletController.getAddress)
);

router.post(
  '/deposit',
  authenticate,
  validate(depositSchema),
  asyncHandler(walletController.deposit)
);

router.post(
  '/withdraw',
  authenticate,
  validate(withdrawSchema),
  asyncHandler(walletController.withdraw)
);

export default router;
