import mongoose from 'mongoose';
import { Transaction, ITransactionDocument } from '../../models/Transaction.model';
import { User } from '../../models/User.model';

describe('Transaction Model', () => {
  let testUserId: mongoose.Types.ObjectId;

  beforeEach(async () => {
    const user = await new User({
      email: 'sender@example.com',
      passwordHash: 'hashedpassword123',
      walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
      encryptedPrivateKey: 'encryptedkey123'
    }).save();
    testUserId = user._id;
  });

  describe('Schema Validation', () => {
    it('should create a transaction with valid fields', async () => {
      const transactionData = {
        senderId: testUserId,
        senderEmail: 'sender@example.com',
        recipientEmail: 'recipient@example.com',
        recipientWalletAddress: '0xabcdef1234567890abcdef1234567890abcdef12',
        amountFiat: 100,
        amountUSDC: 127,
        exchangeRate: 1.27,
        fee: 0.5,
        status: 'pending' as const
      };

      const transaction = new Transaction(transactionData);
      const savedTransaction = await transaction.save();

      expect(savedTransaction._id).toBeDefined();
      expect(savedTransaction.senderId.toString()).toBe(testUserId.toString());
      expect(savedTransaction.senderEmail).toBe(transactionData.senderEmail);
      expect(savedTransaction.recipientEmail).toBe(transactionData.recipientEmail);
      expect(savedTransaction.amountFiat).toBe(transactionData.amountFiat);
      expect(savedTransaction.amountUSDC).toBe(transactionData.amountUSDC);
      expect(savedTransaction.exchangeRate).toBe(transactionData.exchangeRate);
      expect(savedTransaction.fee).toBe(transactionData.fee);
      expect(savedTransaction.status).toBe('pending');
      expect(savedTransaction.txHash).toBeNull();
      expect(savedTransaction.errorMessage).toBeNull();
      expect(savedTransaction.createdAt).toBeDefined();
      expect(savedTransaction.updatedAt).toBeDefined();
    });

    it('should require senderId', async () => {
      const transactionData = {
        senderEmail: 'sender@example.com',
        recipientEmail: 'recipient@example.com',
        recipientWalletAddress: '0xabcdef1234567890abcdef1234567890abcdef12',
        amountFiat: 100,
        amountUSDC: 127,
        exchangeRate: 1.27,
        fee: 0.5,
        status: 'pending' as const
      };

      const transaction = new Transaction(transactionData);
      
      await expect(transaction.save()).rejects.toThrow();
    });

    it('should require senderEmail', async () => {
      const transactionData = {
        senderId: testUserId,
        recipientEmail: 'recipient@example.com',
        recipientWalletAddress: '0xabcdef1234567890abcdef1234567890abcdef12',
        amountFiat: 100,
        amountUSDC: 127,
        exchangeRate: 1.27,
        fee: 0.5,
        status: 'pending' as const
      };

      const transaction = new Transaction(transactionData);
      
      await expect(transaction.save()).rejects.toThrow();
    });

    it('should require recipientEmail', async () => {
      const transactionData = {
        senderId: testUserId,
        senderEmail: 'sender@example.com',
        recipientWalletAddress: '0xabcdef1234567890abcdef1234567890abcdef12',
        amountFiat: 100,
        amountUSDC: 127,
        exchangeRate: 1.27,
        fee: 0.5,
        status: 'pending' as const
      };

      const transaction = new Transaction(transactionData);
      
      await expect(transaction.save()).rejects.toThrow();
    });

    it('should require amountFiat to be positive', async () => {
      const transactionData = {
        senderId: testUserId,
        senderEmail: 'sender@example.com',
        recipientEmail: 'recipient@example.com',
        recipientWalletAddress: '0xabcdef1234567890abcdef1234567890abcdef12',
        amountFiat: -100,
        amountUSDC: 127,
        exchangeRate: 1.27,
        fee: 0.5,
        status: 'pending' as const
      };

      const transaction = new Transaction(transactionData);
      
      await expect(transaction.save()).rejects.toThrow();
    });

    it('should only allow valid status values', async () => {
      const transactionData = {
        senderId: testUserId,
        senderEmail: 'sender@example.com',
        recipientEmail: 'recipient@example.com',
        recipientWalletAddress: '0xabcdef1234567890abcdef1234567890abcdef12',
        amountFiat: 100,
        amountUSDC: 127,
        exchangeRate: 1.27,
        fee: 0.5,
        status: 'invalid-status'
      };

      const transaction = new Transaction(transactionData);
      
      await expect(transaction.save()).rejects.toThrow();
    });

    it('should allow completed status with txHash', async () => {
      const transactionData = {
        senderId: testUserId,
        senderEmail: 'sender@example.com',
        recipientEmail: 'recipient@example.com',
        recipientWalletAddress: '0xabcdef1234567890abcdef1234567890abcdef12',
        amountFiat: 100,
        amountUSDC: 127,
        exchangeRate: 1.27,
        fee: 0.5,
        status: 'completed' as const,
        txHash: '0xtxhash1234567890'
      };

      const transaction = new Transaction(transactionData);
      const savedTransaction = await transaction.save();

      expect(savedTransaction.status).toBe('completed');
      expect(savedTransaction.txHash).toBe('0xtxhash1234567890');
    });

    it('should allow failed status with errorMessage', async () => {
      const transactionData = {
        senderId: testUserId,
        senderEmail: 'sender@example.com',
        recipientEmail: 'recipient@example.com',
        recipientWalletAddress: '0xabcdef1234567890abcdef1234567890abcdef12',
        amountFiat: 100,
        amountUSDC: 127,
        exchangeRate: 1.27,
        fee: 0.5,
        status: 'failed' as const,
        errorMessage: 'Insufficient gas'
      };

      const transaction = new Transaction(transactionData);
      const savedTransaction = await transaction.save();

      expect(savedTransaction.status).toBe('failed');
      expect(savedTransaction.errorMessage).toBe('Insufficient gas');
    });
  });

  describe('Instance Methods', () => {
    it('should have toResponse method that formats transaction', async () => {
      const transactionData = {
        senderId: testUserId,
        senderEmail: 'sender@example.com',
        recipientEmail: 'recipient@example.com',
        recipientWalletAddress: '0xabcdef1234567890abcdef1234567890abcdef12',
        amountFiat: 100,
        amountUSDC: 127,
        exchangeRate: 1.27,
        fee: 0.5,
        status: 'completed' as const,
        txHash: '0xtxhash123'
      };

      const transaction = new Transaction(transactionData);
      const savedTransaction = await transaction.save();
      const response = savedTransaction.toResponse();

      expect(response.id).toBeDefined();
      expect(response.senderEmail).toBe('sender@example.com');
      expect(response.recipientEmail).toBe('recipient@example.com');
      expect(response.amountFiat).toBe(100);
      expect(response.amountUSDC).toBe(127);
      expect(response.exchangeRate).toBe(1.27);
      expect(response.fee).toBe(0.5);
      expect(response.status).toBe('completed');
      expect(response.txHash).toBe('0xtxhash123');
      expect(response.createdAt).toBeDefined();
    });
  });

  describe('Static Methods', () => {
    it('should find transactions by sender', async () => {
      const transactionData = {
        senderId: testUserId,
        senderEmail: 'sender@example.com',
        recipientEmail: 'recipient@example.com',
        recipientWalletAddress: '0xabcdef1234567890abcdef1234567890abcdef12',
        amountFiat: 100,
        amountUSDC: 127,
        exchangeRate: 1.27,
        fee: 0.5,
        status: 'completed' as const
      };

      await new Transaction(transactionData).save();
      await new Transaction({ ...transactionData, amountFiat: 200, amountUSDC: 254 }).save();

      const transactions = await Transaction.findBySender(testUserId.toString());

      expect(transactions).toHaveLength(2);
    });

    it('should find transactions by status', async () => {
      const baseData = {
        senderId: testUserId,
        senderEmail: 'sender@example.com',
        recipientEmail: 'recipient@example.com',
        recipientWalletAddress: '0xabcdef1234567890abcdef1234567890abcdef12',
        amountFiat: 100,
        amountUSDC: 127,
        exchangeRate: 1.27,
        fee: 0.5
      };

      await new Transaction({ ...baseData, status: 'pending' }).save();
      await new Transaction({ ...baseData, status: 'completed' }).save();
      await new Transaction({ ...baseData, status: 'completed' }).save();

      const completedTransactions = await Transaction.findByStatus('completed');

      expect(completedTransactions).toHaveLength(2);
    });

    it('should get user transaction history with pagination', async () => {
      const baseData = {
        senderId: testUserId,
        senderEmail: 'sender@example.com',
        recipientEmail: 'recipient@example.com',
        recipientWalletAddress: '0xabcdef1234567890abcdef1234567890abcdef12',
        amountFiat: 100,
        amountUSDC: 127,
        exchangeRate: 1.27,
        fee: 0.5,
        status: 'completed' as const
      };

      // Create 5 transactions
      for (let i = 0; i < 5; i++) {
        await new Transaction({ ...baseData, amountFiat: i * 100 }).save();
      }

      const result = await Transaction.getHistory(testUserId.toString(), 1, 2);

      expect(result.transactions).toHaveLength(2);
      expect(result.total).toBe(5);
      expect(result.totalPages).toBe(3);
    });
  });
});
