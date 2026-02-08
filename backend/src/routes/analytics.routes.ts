import { Router } from 'express';
import * as analyticsController from '../controllers/analytics.controller';
import { authenticate } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

router.get(
  '/summary',
  authenticate,
  asyncHandler(analyticsController.getAnalytics)
);

router.get(
  '/export',
  authenticate,
  asyncHandler(analyticsController.exportTransactions)
);

router.get(
  '/lookup',
  authenticate,
  asyncHandler(analyticsController.lookupRecipient)
);

export default router;
