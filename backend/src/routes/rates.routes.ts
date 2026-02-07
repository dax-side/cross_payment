import { Router } from 'express';
import * as paymentController from '../controllers/payment.controller';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Rates
 *   description: Exchange rate endpoints
 */

router.get(
  '/',
  asyncHandler(paymentController.getExchangeRate)
);

export default router;
