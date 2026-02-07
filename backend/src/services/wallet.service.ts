import { ethers } from 'ethers';
import crypto from 'crypto';
import { logger } from '../config/logger';
import { IWalletInfo } from '../types';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

const getEncryptionKey = (): Buffer => {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error('ENCRYPTION_KEY environment variable is not set');
  }
  if (key.length !== 64) {
    throw new Error('ENCRYPTION_KEY must be 64 hex characters (32 bytes)');
  }
  return Buffer.from(key, 'hex');
};

const encryptPrivateKey = (privateKey: string): string => {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(privateKey, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return iv.toString('hex') + authTag.toString('hex') + encrypted;
};

const decryptPrivateKey = (encryptedData: string): string => {
  const key = getEncryptionKey();
  
  const iv = Buffer.from(encryptedData.slice(0, IV_LENGTH * 2), 'hex');
  const authTag = Buffer.from(
    encryptedData.slice(IV_LENGTH * 2, IV_LENGTH * 2 + AUTH_TAG_LENGTH * 2),
    'hex'
  );
  const encrypted = encryptedData.slice(IV_LENGTH * 2 + AUTH_TAG_LENGTH * 2);
  
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
};

const generateWallet = async (): Promise<IWalletInfo> => {
  try {
    const wallet = ethers.Wallet.createRandom();
    
    const encryptedPrivateKey = encryptPrivateKey(wallet.privateKey);
    
    logger.info('New wallet generated', { address: wallet.address });
    
    return {
      address: wallet.address,
      encryptedPrivateKey
    };
  } catch (error) {
    logger.error('Wallet generation failed', { error });
    throw new Error('Failed to generate wallet');
  }
};

const isValidAddress = (address: string): boolean => {
  try {
    return ethers.isAddress(address);
  } catch {
    return false;
  }
};

const getWalletFromEncryptedKey = (encryptedPrivateKey: string): ethers.Wallet => {
  const privateKey = decryptPrivateKey(encryptedPrivateKey);
  return new ethers.Wallet(privateKey);
};

export const walletService = {
  generateWallet,
  encryptPrivateKey,
  decryptPrivateKey,
  isValidAddress,
  getWalletFromEncryptedKey
};
