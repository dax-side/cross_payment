import { Request, Response } from 'express';
import { Transaction } from '../models/Transaction.model';
import { User } from '../models/User.model';
import { sendSuccess, SuccessMessages, UnauthorizedError, ErrorMessages } from '../shared';
import mongoose from 'mongoose';

export const getAnalytics = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.userId;
  if (!userId) throw new UnauthorizedError(ErrorMessages.AUTH.INVALID_TOKEN);

  const userObjectId = new mongoose.Types.ObjectId(userId);

  const [sentStats, receivedStats, statusBreakdown, volumeOverTime] = await Promise.all([
    Transaction.aggregate([
      { $match: { senderId: userObjectId } },
      {
        $group: {
          _id: null,
          totalFiat: { $sum: '$amountFiat' },
          totalUSDC: { $sum: '$amountUSDC' },
          totalFees: { $sum: '$fee' },
          count: { $sum: 1 }
        }
      }
    ]),

    (async () => {
      const user = await User.findById(userId).select('email');
      if (!user) return [];
      return Transaction.aggregate([
        { $match: { recipientEmail: user.email, status: 'completed' } },
        {
          $group: {
            _id: null,
            totalUSDC: { $sum: '$amountUSDC' },
            count: { $sum: 1 }
          }
        }
      ]);
    })(),

    Transaction.aggregate([
      { $match: { senderId: userObjectId } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]),

    Transaction.aggregate([
      {
        $match: {
          senderId: userObjectId,
          createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          totalFiat: { $sum: '$amountFiat' },
          totalUSDC: { $sum: '$amountUSDC' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ])
  ]);

  const sent = sentStats[0] ?? { totalFiat: 0, totalUSDC: 0, totalFees: 0, count: 0 };
  const received = receivedStats[0] ?? { totalUSDC: 0, count: 0 };
  const statuses = Object.fromEntries(statusBreakdown.map((s: { _id: string; count: number }) => [s._id, s.count]));

  sendSuccess(res, SuccessMessages.GENERIC.SUCCESS, {
    sent: {
      totalGBP: sent.totalFiat,
      totalUSDC: sent.totalUSDC,
      totalFees: sent.totalFees,
      count: sent.count,
      averageSize: sent.count > 0 ? sent.totalFiat / sent.count : 0
    },
    received: {
      totalUSDC: received.totalUSDC,
      count: received.count
    },
    statusBreakdown: statuses,
    volumeOverTime: volumeOverTime.map((v: { _id: string; totalFiat: number; totalUSDC: number; count: number }) => ({
      date: v._id,
      totalGBP: v.totalFiat,
      totalUSDC: v.totalUSDC,
      count: v.count
    }))
  });
};

export const exportTransactions = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.userId;
  if (!userId) throw new UnauthorizedError(ErrorMessages.AUTH.INVALID_TOKEN);

  const transactions = await Transaction.find({ senderId: userId })
    .sort({ createdAt: -1 })
    .lean();

  const header = 'Date,Recipient,Amount GBP,Amount USDC,Fee,Exchange Rate,Status,TX Hash\n';
  const rows = transactions.map((tx: any) => {
    const date = new Date(tx.createdAt).toISOString();
    const hash = tx.txHash ?? '';
    return `${date},${tx.recipientEmail},${tx.amountFiat},${tx.amountUSDC},${tx.fee},${tx.exchangeRate},${tx.status},${hash}`;
  }).join('\n');

  const csv = header + rows;

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=crosspay-transactions-${Date.now()}.csv`);
  res.send(csv);
};

export const lookupRecipient = async (req: Request, res: Response): Promise<void> => {
  const email = req.query.email as string;

  if (!email) {
    sendSuccess(res, SuccessMessages.GENERIC.SUCCESS, { exists: false });
    return;
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() }).select('_id');
  sendSuccess(res, SuccessMessages.GENERIC.SUCCESS, { exists: !!user });
};
