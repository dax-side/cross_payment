import { Request, Response } from 'express';
import { User } from '../models/User.model';
import { blockchainService } from '../services/blockchain.service';
import { logger } from '../config/logger';
import { ITreasuryBalance, IWalletBalance } from '../types';
import { DepositInput, WithdrawInput } from '../validation/schemas';
import { sendSuccess, SuccessMessages, UnauthorizedError, NotFoundError, BadRequestError, ErrorMessages } from '../shared';

/**
 * @swagger
 * /api/wallet/balance:
 *   get:
 *     summary: Get wallet balance (fiat + USDC)
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Balance retrieved successfully
 *       401:
 *         description: Not authenticated
 */
export const getBalance = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.userId;

  if (!userId) {
    throw new UnauthorizedError(ErrorMessages.AUTH.INVALID_TOKEN);
  }

  const user = await User.findById(userId);

  if (!user) {
    throw new NotFoundError(ErrorMessages.USER.NOT_FOUND);
  }

  let usdcBalance = '0';
  try {
    usdcBalance = await blockchainService.getUSDCBalance(user.walletAddress);
  } catch (error) {
    logger.warn('Failed to get on-chain balance', { error, userId });
  }

  const balance: IWalletBalance = {
    fiatBalance: user.fiatBalance,
    usdcBalance,
    walletAddress: user.walletAddress
  };

  sendSuccess(res, SuccessMessages.WALLET.BALANCE_RETRIEVED, balance);
};

/**
 * @swagger
 * /api/wallet/treasury:
 *   get:
 *     summary: Get treasury wallet balance (USDC + POL)
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Treasury balance retrieved successfully
 *       401:
 *         description: Not authenticated
 */
export const getTreasuryBalance = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.userId;

  if (!userId) {
    throw new UnauthorizedError(ErrorMessages.AUTH.INVALID_TOKEN);
  }

  const masterWallet = blockchainService.getMasterWallet();
  const { maticBalance, usdcBalance } = await blockchainService.getMasterWalletBalance();

  const balance: ITreasuryBalance = {
    maticBalance,
    usdcBalance,
    walletAddress: masterWallet.address
  };

  sendSuccess(res, SuccessMessages.WALLET.BALANCE_RETRIEVED, balance);
};

/**
 * @swagger
 * /api/wallet/deposit:
 *   post:
 *     summary: Mock fiat deposit
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *             properties:
 *               amount:
 *                 type: number
 *                 minimum: 10
 *                 maximum: 10000
 *     responses:
 *       200:
 *         description: Deposit successful
 *       400:
 *         description: Invalid amount
 */
export const deposit = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.userId;
  const { amount } = req.body as DepositInput;

  if (!userId) {
    throw new UnauthorizedError(ErrorMessages.AUTH.INVALID_TOKEN);
  }

  const user = await User.findById(userId);

  if (!user) {
    throw new NotFoundError(ErrorMessages.USER.NOT_FOUND);
  }

  user.fiatBalance += amount;
  await user.save();

  logger.info('Deposit successful', {
    userId,
    amount,
    newBalance: user.fiatBalance
  });

  sendSuccess(res, SuccessMessages.WALLET.DEPOSIT_SUCCESS, {
    fiatBalance: user.fiatBalance,
    deposited: amount
  });
};

/**
 * @swagger
 * /api/wallet/withdraw:
 *   post:
 *     summary: Mock fiat withdrawal
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *             properties:
 *               amount:
 *                 type: number
 *                 minimum: 10
 *     responses:
 *       200:
 *         description: Withdrawal successful
 *       400:
 *         description: Insufficient balance or invalid amount
 */
export const withdraw = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.userId;
  const { amount } = req.body as WithdrawInput;

  if (!userId) {
    throw new UnauthorizedError(ErrorMessages.AUTH.INVALID_TOKEN);
  }

  const user = await User.findById(userId);

  if (!user) {
    throw new NotFoundError(ErrorMessages.USER.NOT_FOUND);
  }

  if (user.fiatBalance < amount) {
    throw new BadRequestError(ErrorMessages.WALLET.INSUFFICIENT_BALANCE);
  }

  user.fiatBalance -= amount;
  await user.save();

  logger.info('Withdrawal successful', {
    userId,
    amount,
    newBalance: user.fiatBalance
  });

  sendSuccess(res, SuccessMessages.WALLET.WITHDRAWAL_SUCCESS, {
    fiatBalance: user.fiatBalance,
    withdrawn: amount
  });
};

/**
 * @swagger
 * /api/wallet/address:
 *   get:
 *     summary: Get wallet address
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Wallet address retrieved
 */
export const getAddress = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.userId;

  if (!userId) {
    throw new UnauthorizedError(ErrorMessages.AUTH.INVALID_TOKEN);
  }

  const user = await User.findById(userId);

  if (!user) {
    throw new NotFoundError(ErrorMessages.USER.NOT_FOUND);
  }

  sendSuccess(res, SuccessMessages.WALLET.ADDRESS_RETRIEVED, {
    walletAddress: user.walletAddress
  });
};