import mongoose, { Document, Model, Schema } from 'mongoose';
import { IUserResponse } from '../types';

export interface IUserDocument extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  passwordHash: string;
  walletAddress: string;
  encryptedPrivateKey: string;
  fiatBalance: number;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
  toSafeObject(): IUserResponse;
}

export interface IUserModel extends Model<IUserDocument> {
  findByEmail(email: string): Promise<IUserDocument | null>;
  findByWalletAddress(walletAddress: string): Promise<IUserDocument | null>;
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const userSchema = new Schema<IUserDocument, IUserModel>(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: (value: string): boolean => emailRegex.test(value),
        message: 'Invalid email format'
      }
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required']
    },
    walletAddress: {
      type: String,
      required: [true, 'Wallet address is required'],
      unique: true,
      trim: true
    },
    encryptedPrivateKey: {
      type: String,
      required: [true, 'Encrypted private key is required']
    },
    fiatBalance: {
      type: Number,
      default: 0,
      min: [0, 'Fiat balance cannot be negative']
    },
    passwordResetToken: {
      type: String,
      select: false
    },
    passwordResetExpires: {
      type: Date,
      select: false
    }
  },
  {
    timestamps: true
  }
);

userSchema.methods.toSafeObject = function (this: IUserDocument): IUserResponse {
  return {
    id: this._id.toString(),
    email: this.email,
    walletAddress: this.walletAddress,
    fiatBalance: this.fiatBalance,
    createdAt: this.createdAt
  };
};

userSchema.statics.findByEmail = async function (
  email: string
): Promise<IUserDocument | null> {
  return this.findOne({ email: email.toLowerCase() });
};

userSchema.statics.findByWalletAddress = async function (
  walletAddress: string
): Promise<IUserDocument | null> {
  return this.findOne({ walletAddress });
};

export const User = mongoose.model<IUserDocument, IUserModel>('User', userSchema);
