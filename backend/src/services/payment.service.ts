import mongoose from 'mongoose';
import { User } from '../models/User.model';
import { Transaction } from '../models/Transaction.model';
import { blockchainService } from './blockchain.service';
import { logger } from '../config/logger';
import { ITransactionResponse } from '../types';

interface SendPaymentInput {
  senderId: string;
  senderEmail: string;
  recipientEmail: string;
  amountGBP: number;
}

interface PaymentResult {
  success: boolean;
  transaction?: ITransactionResponse;
  error?: string;
}

interface TransactionHistoryResult {
  transactions: ITransactionResponse[];
  total: number;
  totalPages: number;
  page: number;
}

const sendPayment = async (input: SendPaymentInput): Promise<PaymentResult> => {
  const session = await mongoose.startSession();
  
  try {
    session.startTransaction();

    if (input.senderEmail.toLowerCase() === input.recipientEmail.toLowerCase()) {
      return { success: false, error: 'Cannot send to yourself' };
    }

    const sender = await User.findById(input.senderId).session(session);
    if (!sender) {
      await session.abortTransaction();
      return { success: false, error: 'Sender not found' };
    }

    const recipient = await User.findByEmail(input.recipientEmail);
    if (!recipient) {
      await session.abortTransaction();
      return { success: false, error: 'Recipient not found' };
    }

    if (sender.fiatBalance < input.amountGBP) {
      await session.abortTransaction();
      return { success: false, error: 'Insufficient balance' };
    }

    const conversion = blockchainService.convertGBPToUSDC(input.amountGBP);

    const transaction = new Transaction({
      senderId: sender._id,
      senderEmail: sender.email,
      recipientEmail: recipient.email,
      recipientWalletAddress: recipient.walletAddress,
      amountFiat: input.amountGBP,
      amountUSDC: conversion.amountUSDC,
      exchangeRate: conversion.exchangeRate,
      fee: conversion.fee,
      status: 'pending'
    });

    await transaction.save({ session });

    sender.fiatBalance -= input.amountGBP;
    await sender.save({ session });

    logger.info('Payment initiated', {
      transactionId: transaction._id.toString(),
      senderId: sender._id.toString(),
      recipientEmail: recipient.email,
      amountGBP: input.amountGBP,
      amountUSDC: conversion.amountUSDC
    });

    transaction.status = 'processing';
    await transaction.save({ session });

    const transferResult = await blockchainService.transferUSDC(
      recipient.walletAddress,
      conversion.amountUSDC.toFixed(6)
    );

    if (!transferResult.success) {
      transaction.status = 'failed';
      transaction.errorMessage = transferResult.error ?? 'Transfer failed';
      await transaction.save({ session });

      sender.fiatBalance += input.amountGBP;
      await sender.save({ session });

      await session.commitTransaction();

      logger.error('Payment failed', {
        transactionId: transaction._id.toString(),
        error: transferResult.error
      });

      return { success: false, error: transferResult.error };
    }

    transaction.status = 'completed';
    transaction.txHash = transferResult.txHash ?? null;
    await transaction.save({ session });

    await session.commitTransaction();

    logger.info('Payment completed', {
      transactionId: transaction._id.toString(),
      txHash: transferResult.txHash
    });

    return {
      success: true,
      transaction: transaction.toResponse()
    };
  } catch (error) {
    await session.abortTransaction();
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Payment error', { error, input });
    return { success: false, error: errorMessage };
  } finally {
    await session.endSession();
  }
};

const getTransactionHistory = async (
  userId: string,
  page: number,
  limit: number
): Promise<TransactionHistoryResult> => {
  try {
    const result = await Transaction.getHistory(userId, page, limit);
    
    return {
      transactions: result.transactions.map((tx) => tx.toResponse()),
      total: result.total,
      totalPages: result.totalPages,
      page
    };
  } catch (error) {
    logger.error('Failed to get transaction history', { error, userId });
    return {
      transactions: [],
      total: 0,
      totalPages: 0,
      page
    };
  }
};

const getTransactionById = async (
  transactionId: string,
  userId: string
): Promise<ITransactionResponse | null> => {
  try {
    const transaction = await Transaction.findById(transactionId);
    
    if (!transaction) {
      return null;
    }

    const user = await User.findById(userId);
    if (!user) {
      return null;
    }

    const isSender = transaction.senderId.toString() === userId;
    const isRecipient = transaction.recipientEmail === user.email;

    if (!isSender && !isRecipient) {
      logger.warn('Unauthorized transaction access attempt', {
        transactionId,
        userId
      });
      return null;
    }

    return transaction.toResponse();
  } catch (error) {
    logger.error('Failed to get transaction', { error, transactionId, userId });
    return null;
  }
};

export const paymentService = {
  sendPayment,
  getTransactionHistory,
  getTransactionById
};
