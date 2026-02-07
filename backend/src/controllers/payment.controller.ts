import { Request, Response } from 'express';
import { paymentService } from '../services/payment.service';
import { blockchainService } from '../services/blockchain.service';
import { logger } from '../config/logger';
import { IExchangeRate } from '../types';
import { SendPaymentInput, PaginationInput } from '../validation/schemas';
import { sendSuccess, SuccessMessages, UnauthorizedError, BadRequestError, NotFoundError, ErrorMessages } from '../shared';

/**
 * @swagger
 * /api/payment/send:
 *   post:
 *     summary: Send payment to another user
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - recipientEmail
 *               - amountGBP
 *             properties:
 *               recipientEmail:
 *                 type: string
 *                 format: email
 *               amountGBP:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 10000
 *     responses:
 *       200:
 *         description: Payment sent successfully
 *       400:
 *         description: Invalid request or insufficient balance
 */
export const sendPayment = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.userId;
  const userEmail = req.user?.email;
  const input = req.body as SendPaymentInput;

  if (!userId || !userEmail) {
    throw new UnauthorizedError(ErrorMessages.AUTH.INVALID_TOKEN);
  }

  const result = await paymentService.sendPayment({
    senderId: userId,
    senderEmail: userEmail,
    recipientEmail: input.recipientEmail,
    amountGBP: input.amountGBP
  });

  if (!result.success) {
    throw new BadRequestError(result.error ?? ErrorMessages.PAYMENT.TRANSFER_FAILED);
  }

  logger.info('Payment sent', {
    userId,
    recipientEmail: input.recipientEmail,
    amount: input.amountGBP
  });

  sendSuccess(res, SuccessMessages.PAYMENT.SENT_SUCCESS, { transaction: result.transaction });
};

/**
 * @swagger
 * /api/payment/history:
 *   get:
 *     summary: Get transaction history
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           maximum: 100
 *     responses:
 *       200:
 *         description: Transaction history retrieved
 */
export const getHistory = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.userId;
  const query = req.query as unknown as PaginationInput;

  if (!userId) {
    throw new UnauthorizedError(ErrorMessages.AUTH.INVALID_TOKEN);
  }

  const page = typeof query.page === 'number' ? query.page : 1;
  const limit = typeof query.limit === 'number' ? query.limit : 10;

  const result = await paymentService.getTransactionHistory(userId, page, limit);

  res.status(200).json({
    success: true,
    message: SuccessMessages.PAYMENT.HISTORY_RETRIEVED.message,
    data: result.transactions,
    pagination: {
      page: result.page,
      limit,
      total: result.total,
      totalPages: result.totalPages
    }
  });
};

/**
 * @swagger
 * /api/payment/{id}:
 *   get:
 *     summary: Get transaction details
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Transaction details retrieved
 *       404:
 *         description: Transaction not found
 */
export const getTransaction = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.userId;
  const transactionId = req.params.id;

  if (!userId) {
    throw new UnauthorizedError(ErrorMessages.AUTH.INVALID_TOKEN);
  }

  if (!transactionId) {
    throw new BadRequestError('Transaction ID required');
  }

  const transaction = await paymentService.getTransactionById(transactionId, userId);

  if (!transaction) {
    throw new NotFoundError('Transaction not found');
  }

  sendSuccess(res, SuccessMessages.PAYMENT.TRANSACTION_RETRIEVED, { transaction });
};

/**
 * @swagger
 * /api/payment/preview:
 *   post:
 *     summary: Preview payment conversion
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amountGBP
 *             properties:
 *               amountGBP:
 *                 type: number
 *     responses:
 *       200:
 *         description: Conversion preview
 */
export const previewPayment = async (req: Request, res: Response): Promise<void> => {
  const { amountGBP } = req.body as { amountGBP: number };

  if (typeof amountGBP !== 'number' || amountGBP <= 0) {
    throw new BadRequestError(ErrorMessages.VALIDATION.INVALID_AMOUNT);
  }

  const conversion = blockchainService.convertGBPToUSDC(amountGBP);

  sendSuccess(res, SuccessMessages.PAYMENT.PREVIEW_SUCCESS, {
    amountGBP,
    amountUSDC: conversion.amountUSDC,
    exchangeRate: conversion.exchangeRate,
    fee: conversion.fee,
    totalDeducted: amountGBP
  });
};

/**
 * @swagger
 * /api/rates:
 *   get:
 *     summary: Get current exchange rate
 *     tags: [Rates]
 *     responses:
 *       200:
 *         description: Exchange rate retrieved
 */
export const getExchangeRate = async (_req: Request, res: Response): Promise<void> => {
  const rate = blockchainService.getExchangeRate('GBP', 'USDC');

  const exchangeRate: IExchangeRate = {
    from: 'GBP',
    to: 'USDC',
    rate,
    timestamp: new Date()
  };

  sendSuccess(res, SuccessMessages.RATES.RETRIEVED, exchangeRate);
};
