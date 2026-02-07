import { paymentService } from '../../services/payment.service';
import { User } from '../../models/User.model';
import { Transaction } from '../../models/Transaction.model';

// Mock blockchain service
jest.mock('../../services/blockchainService', () => ({
  blockchainService: {
    convertGBPToUSDC: jest.fn().mockReturnValue({
      amountUSDC: 126.5,
      exchangeRate: 1.27,
      fee: 0.5
    }),
    transferUSDC: jest.fn().mockResolvedValue({
      success: true,
      txHash: '0xmockedtxhash1234567890',
      blockNumber: 12345
    }),
    getUSDCBalance: jest.fn().mockResolvedValue('100.0')
  }
}));

describe('Payment Service', () => {
  let senderId: string;
  let recipientId: string;

  beforeEach(async () => {
    // Create sender
    const sender = await new User({
      email: 'sender@example.com',
      passwordHash: 'hashedpassword',
      walletAddress: '0xsenderwalletaddress1234567890abcdef1234',
      encryptedPrivateKey: 'encryptedkey',
      fiatBalance: 500
    }).save();
    senderId = sender._id.toString();

    // Create recipient
    const recipient = await new User({
      email: 'recipient@example.com',
      passwordHash: 'hashedpassword',
      walletAddress: '0xrecipientwalletaddress1234567890abcdef',
      encryptedPrivateKey: 'encryptedkey',
      fiatBalance: 0
    }).save();
    recipientId = recipient._id.toString();
  });

  describe('sendPayment', () => {
    it('should send payment successfully', async () => {
      const result = await paymentService.sendPayment({
        senderId,
        senderEmail: 'sender@example.com',
        recipientEmail: 'recipient@example.com',
        amountGBP: 100
      });

      expect(result.success).toBe(true);
      expect(result.transaction).toBeDefined();
      expect(result.transaction?.status).toBe('completed');
      expect(result.transaction?.txHash).toBe('0xmockedtxhash1234567890');
    });

    it('should deduct amount from sender fiat balance', async () => {
      await paymentService.sendPayment({
        senderId,
        senderEmail: 'sender@example.com',
        recipientEmail: 'recipient@example.com',
        amountGBP: 100
      });

      const sender = await User.findById(senderId);
      expect(sender?.fiatBalance).toBe(400); // 500 - 100
    });

    it('should fail if sender has insufficient balance', async () => {
      const result = await paymentService.sendPayment({
        senderId,
        senderEmail: 'sender@example.com',
        recipientEmail: 'recipient@example.com',
        amountGBP: 600 // More than 500 balance
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Insufficient balance');
    });

    it('should fail if recipient not found', async () => {
      const result = await paymentService.sendPayment({
        senderId,
        senderEmail: 'sender@example.com',
        recipientEmail: 'nonexistent@example.com',
        amountGBP: 100
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Recipient not found');
    });

    it('should fail if sender not found', async () => {
      const result = await paymentService.sendPayment({
        senderId: '507f1f77bcf86cd799439011',
        senderEmail: 'sender@example.com',
        recipientEmail: 'recipient@example.com',
        amountGBP: 100
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Sender not found');
    });

    it('should create transaction record', async () => {
      await paymentService.sendPayment({
        senderId,
        senderEmail: 'sender@example.com',
        recipientEmail: 'recipient@example.com',
        amountGBP: 100
      });

      const transactions = await Transaction.findBySender(senderId);
      expect(transactions).toHaveLength(1);
      expect(transactions[0]?.amountFiat).toBe(100);
      expect(transactions[0]?.amountUSDC).toBe(126.5);
    });

    it('should not allow sending to self', async () => {
      const result = await paymentService.sendPayment({
        senderId,
        senderEmail: 'sender@example.com',
        recipientEmail: 'sender@example.com',
        amountGBP: 100
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Cannot send to yourself');
    });
  });

  describe('getTransactionHistory', () => {
    beforeEach(async () => {
      // Create some transactions
      for (let i = 0; i < 5; i++) {
        await new Transaction({
          senderId,
          senderEmail: 'sender@example.com',
          recipientEmail: 'recipient@example.com',
          recipientWalletAddress: '0xrecipientwalletaddress1234567890abcdef',
          amountFiat: (i + 1) * 10,
          amountUSDC: (i + 1) * 12.7,
          exchangeRate: 1.27,
          fee: 0.5,
          status: 'completed',
          txHash: `0xtxhash${i}`
        }).save();
      }
    });

    it('should return paginated transaction history', async () => {
      const result = await paymentService.getTransactionHistory(senderId, 1, 2);

      expect(result.transactions).toHaveLength(2);
      expect(result.total).toBe(5);
      expect(result.totalPages).toBe(3);
      expect(result.page).toBe(1);
    });

    it('should return empty array for user with no transactions', async () => {
      const result = await paymentService.getTransactionHistory(recipientId, 1, 10);

      expect(result.transactions).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  describe('getTransactionById', () => {
    it('should return transaction by ID', async () => {
      const transaction = await new Transaction({
        senderId,
        senderEmail: 'sender@example.com',
        recipientEmail: 'recipient@example.com',
        recipientWalletAddress: '0xrecipientwalletaddress1234567890abcdef',
        amountFiat: 100,
        amountUSDC: 127,
        exchangeRate: 1.27,
        fee: 0.5,
        status: 'completed',
        txHash: '0xtxhash123'
      }).save();

      const result = await paymentService.getTransactionById(
        transaction._id.toString(),
        senderId
      );

      expect(result).not.toBeNull();
      expect(result?.amountFiat).toBe(100);
    });

    it('should return null for unauthorized access', async () => {
      const transaction = await new Transaction({
        senderId,
        senderEmail: 'sender@example.com',
        recipientEmail: 'recipient@example.com',
        recipientWalletAddress: '0xrecipientwalletaddress1234567890abcdef',
        amountFiat: 100,
        amountUSDC: 127,
        exchangeRate: 1.27,
        fee: 0.5,
        status: 'completed'
      }).save();

      const result = await paymentService.getTransactionById(
        transaction._id.toString(),
        '507f1f77bcf86cd799439011' // Different user
      );

      expect(result).toBeNull();
    });
  });
});
