/*
* User Types 
*/                    

export interface IUser {
  _id: string;
  email: string;
  passwordHash: string;
  walletAddress: string;
  encryptedPrivateKey: string;
  fiatBalance: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserCreate {
  email: string;
  password: string;
}

export interface IUserResponse {
  id: string;
  email: string;
  walletAddress: string;
  fiatBalance: number;
  createdAt: Date;
}

/*
* Transaction Types 
*/
export type TransactionStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface ITransaction {
  _id: string;
  senderId: string;
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
}

export interface ITransactionCreate {
  senderId: string;
  senderEmail: string;
  recipientEmail: string;
  amountFiat: number;
}

export interface ITransactionResponse {
  id: string;
  senderEmail: string;
  recipientEmail: string;
  amountFiat: number;
  amountUSDC: number;
  exchangeRate: number;
  fee: number;
  txHash: string | null;
  status: TransactionStatus;
  createdAt: Date;
}

/*
* JWT Types 
*/

import { JwtPayload } from '@dax-side/jwt-abstraction';

export interface IJWTPayloadData {
  userId: string;
  email: string;
}

export interface IJWTPayload extends JwtPayload {
  userId: string;
  email: string;
}

export interface ITokenPair {
  accessToken: string;
  refreshToken: string;
}

/*
* Api response Types 
*/

export interface IAPIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface IPaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/*
* Wallet Types 
*/

export interface IWalletBalance {
  fiatBalance: number;
  usdcBalance: string;
  walletAddress: string;
}

export interface ITreasuryBalance {
  maticBalance: string;
  usdcBalance: string;
  walletAddress: string;
}

export interface IWalletInfo {
  address: string;
  encryptedPrivateKey: string;
}

/*
* Wallet Types 
*/

export interface ISendPaymentRequest {
  recipientEmail: string;
  amountGBP: number;
}

export interface IPaymentResult {
  success: boolean;
  transactionId?: string;
  txHash?: string;
  error?: string;
}

/*
* Exchange rate Types 
*/
export interface IExchangeRate {
  from: string;
  to: string;
  rate: number;
  timestamp: Date;
}

/*
* Blockchain Types 
*/

export interface IBlockchainTransaction {
  hash: string;
  from: string;
  to: string;
  amount: string;
  blockNumber: number;
  status: 'success' | 'failed';
}
