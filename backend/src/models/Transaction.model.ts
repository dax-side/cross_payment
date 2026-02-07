import mongoose, { Document, Model, Schema } from 'mongoose';
import { ITransactionResponse, TransactionStatus } from '../types';

export interface ITransactionDocument extends Document {
  _id: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  senderEmail: string;
  recipientEmail: string;
  recipientWalletAddress: string;
  amountFiat: number;
  amountUSDC: number;
  exchangeRate: number;
  fee: number;
  txHash: string | null;
  status: TransactionStatus;
  errorMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
  toResponse(): ITransactionResponse;
}

interface ITransactionHistoryResult {
  transactions: ITransactionDocument[];
  total: number;
  totalPages: number;
}

export interface ITransactionModel extends Model<ITransactionDocument> {
  findBySender(senderId: string): Promise<ITransactionDocument[]>;
  findByStatus(status: TransactionStatus): Promise<ITransactionDocument[]>;
  getHistory(userId: string, page: number, limit: number): Promise<ITransactionHistoryResult>;
}

const VALID_STATUSES: TransactionStatus[] = ['pending', 'processing', 'completed', 'failed'];

const transactionSchema = new Schema<ITransactionDocument, ITransactionModel>(
  {
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Sender ID is required']
    },
    senderEmail: {
      type: String,
      required: [true, 'Sender email is required'],
      lowercase: true,
      trim: true
    },
    recipientEmail: {
      type: String,
      required: [true, 'Recipient email is required'],
      lowercase: true,
      trim: true
    },
    recipientWalletAddress: {
      type: String,
      required: [true, 'Recipient wallet address is required'],
      trim: true
    },
    amountFiat: {
      type: Number,
      required: [true, 'Fiat amount is required'],
      min: [0.01, 'Amount must be positive']
    },
    amountUSDC: {
      type: Number,
      required: [true, 'USDC amount is required'],
      min: [0, 'USDC amount cannot be negative']
    },
    exchangeRate: {
      type: Number,
      required: [true, 'Exchange rate is required'],
      min: [0, 'Exchange rate cannot be negative']
    },
    fee: {
      type: Number,
      required: [true, 'Fee is required'],
      min: [0, 'Fee cannot be negative']
    },
    txHash: {
      type: String,
      default: null
    },
    status: {
      type: String,
      required: [true, 'Status is required'],
      enum: {
        values: VALID_STATUSES,
        message: 'Invalid status. Must be one of: pending, processing, completed, failed'
      }
    },
    errorMessage: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true
  }
);

transactionSchema.methods.toResponse = function (this: ITransactionDocument): ITransactionResponse {
  return {
    id: this._id.toString(),
    senderEmail: this.senderEmail,
    recipientEmail: this.recipientEmail,
    amountFiat: this.amountFiat,
    amountUSDC: this.amountUSDC,
    exchangeRate: this.exchangeRate,
    fee: this.fee,
    txHash: this.txHash,
    status: this.status,
    createdAt: this.createdAt
  };
};

transactionSchema.statics.findBySender = async function (
  senderId: string
): Promise<ITransactionDocument[]> {
  return this.find({ senderId: new mongoose.Types.ObjectId(senderId) }).sort({ createdAt: -1 });
};

transactionSchema.statics.findByStatus = async function (
  status: TransactionStatus
): Promise<ITransactionDocument[]> {
  return this.find({ status }).sort({ createdAt: -1 });
};

transactionSchema.statics.getHistory = async function (
  userId: string,
  page: number,
  limit: number
): Promise<ITransactionHistoryResult> {
  const skip = (page - 1) * limit;
  const objectId = new mongoose.Types.ObjectId(userId);

  const [transactions, total] = await Promise.all([
    this.find({
      $or: [
        { senderId: objectId },
        { recipientEmail: { $exists: true } }
      ],
      senderId: objectId
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    this.countDocuments({ senderId: objectId })
  ]);

  return {
    transactions,
    total,
    totalPages: Math.ceil(total / limit)
  };
};

transactionSchema.index({ senderId: 1, createdAt: -1 });
transactionSchema.index({ recipientEmail: 1 });
transactionSchema.index({ status: 1 });
transactionSchema.index({ txHash: 1 });

export const Transaction = mongoose.model<ITransactionDocument, ITransactionModel>(
  'Transaction',
  transactionSchema
);
