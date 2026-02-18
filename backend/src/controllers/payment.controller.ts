import { Request, Response } from 'express';
import { paymentService } from '../services/payment.service';
import { blockchainService } from '../services/blockchain.service';
import { logger } from '../config/logger';
import { stripe } from '../config/stripe';
import { User } from '../models/User.model';
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

  const conversion = await blockchainService.convertGBPToUSDC(amountGBP);

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
  const { rate, source, timestamp } = await blockchainService.getExchangeRateWithMeta();

  const exchangeRate: IExchangeRate = {
    from: 'GBP',
    to: 'USDC',
    rate,
    timestamp: new Date(timestamp)
  };

  sendSuccess(res, SuccessMessages.RATES.RETRIEVED, { ...exchangeRate, source });
};

/**
 * @swagger
 * /api/payment/topup/intent:
 *   post:
 *     summary: Create Stripe PaymentIntent for GBP top-up
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amountGBP]
 *             properties:
 *               amountGBP:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 10000
 *                 description: Top-up amount in GBP
 *     responses:
 *       200:
 *         description: Returns clientSecret for Stripe Elements
 */
export const createTopUpIntent = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.userId;
  if (!userId) throw new UnauthorizedError(ErrorMessages.AUTH.INVALID_TOKEN);

  const { amountGBP } = req.body as { amountGBP: number };
  if (typeof amountGBP !== 'number' || amountGBP < 1 || amountGBP > 10000) {
    throw new BadRequestError('Amount must be between £1 and £10,000');
  }

  const amountPence = Math.round(amountGBP * 100);

  const paymentIntent = await stripe.paymentIntents.create({
    amount: amountPence,
    currency: 'gbp',
    metadata: { userId, amountGBP: amountGBP.toString() },
    automatic_payment_methods: { enabled: true },
  });

  logger.info('Stripe PaymentIntent created', { userId, amountGBP, intentId: paymentIntent.id });

  sendSuccess(res, SuccessMessages.PAYMENT.TOPUP_INTENT_CREATED, {
    clientSecret: paymentIntent.client_secret,
    intentId: paymentIntent.id,
  });
};

/**
 * Stripe webhook receive raw (un-parsed) request body.
 * Called by Stripe on payment_intent.succeeded.
 * Credits user fiatBalance.
 */

export const handleStripeWebhook = async (req: Request, res: Response): Promise<void> => {
  const sig = req.headers['stripe-signature'] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    logger.error('STRIPE_WEBHOOK_SECRET not set');
    res.status(500).json({ error: 'Webhook secret not configured' });
    return;
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body as Buffer, sig, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Webhook signature verification failed';
    logger.warn('Stripe webhook signature failed', { message });
    res.status(400).json({ error: `Webhook error: ${message}` });
    return;
  }

  if (event.type === 'payment_intent.succeeded') {
    const intent = event.data.object;
    const userId = intent.metadata?.userId;
    const amountGBP = parseFloat(intent.metadata?.amountGBP ?? '0');

    if (!userId || !amountGBP) {
      logger.warn('Stripe webhook missing metadata', { intentId: intent.id });
      res.json({ received: true });
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      logger.warn('Stripe webhook: user not found', { userId, intentId: intent.id });
      res.json({ received: true });
      return;
    }

    user.fiatBalance = (user.fiatBalance || 0) + amountGBP;
    await user.save();

    logger.info('Stripe top-up credited', { userId, amountGBP, newBalance: user.fiatBalance });
  }

  res.json({ received: true });
};
