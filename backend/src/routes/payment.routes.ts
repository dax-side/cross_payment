import { Router } from 'express';
import * as paymentController from '../controllers/payment.controller';
import { authenticate } from '../middleware/auth';
import { asyncHandler, validate, validateQuery } from '../middleware/errorHandler';
import { sendPaymentSchema, paginationSchema } from '../validation/schemas';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Payment
 *   description: Payment endpoints
 */

router.post(
  '/send',
  authenticate,
  validate(sendPaymentSchema),
  asyncHandler(paymentController.sendPayment)
);

router.get(
  '/history',
  authenticate,
  validateQuery(paginationSchema),
  asyncHandler(paymentController.getHistory)
);

router.post(
  '/preview',
  authenticate,
  asyncHandler(paymentController.previewPayment)
);

router.post(
  '/topup/intent',
  authenticate,
  asyncHandler(paymentController.createTopUpIntent)
);

router.get(
  '/:id',
  authenticate,
  asyncHandler(paymentController.getTransaction)
);

export default router;
