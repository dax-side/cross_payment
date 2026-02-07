import { blockchainService } from '../../services/blockchain.service';
import { ethers } from 'ethers';

// Mock ethers
jest.mock('ethers', () => {
  const originalModule = jest.requireActual('ethers');
  return {
    ...originalModule,
    JsonRpcProvider: jest.fn().mockImplementation(() => ({
      getBalance: jest.fn().mockResolvedValue(BigInt('1000000000000000000')),
      getNetwork: jest.fn().mockResolvedValue({ chainId: BigInt(80002) }),
      waitForTransaction: jest.fn().mockResolvedValue({
        status: 1,
        blockNumber: 12345,
        hash: '0xmockedtxhash'
      })
    })),
    Contract: jest.fn().mockImplementation(() => ({
      balanceOf: jest.fn().mockResolvedValue(BigInt('1000000')), // 1 USDC (6 decimals)
      decimals: jest.fn().mockResolvedValue(6),
      transfer: jest.fn().mockResolvedValue({
        hash: '0xmockedtxhash',
        wait: jest.fn().mockResolvedValue({
          status: 1,
          blockNumber: 12345
        })
      })
    })),
    Wallet: jest.fn().mockImplementation((privateKey) => ({
      address: '0xmockedwalletaddress',
      privateKey,
      connect: jest.fn().mockReturnThis()
    })),
    formatUnits: originalModule.formatUnits,
    parseUnits: originalModule.parseUnits,
    isAddress: originalModule.isAddress
  };
});

describe('Blockchain Service', () => {
  beforeEach(() => {
    process.env.POLYGON_RPC_URL = 'https://mock-rpc-url';
    process.env.USDC_CONTRACT_ADDRESS = '0x41e94eb019c0762f9bfcf9fb1e58725bfb0e7582';
    process.env.MASTER_WALLET_PRIVATE_KEY = '0x' + 'a'.repeat(64);
  });

  describe('getUSDCBalance', () => {
    it('should return formatted USDC balance', async () => {
      const balance = await blockchainService.getUSDCBalance(
        '0x1234567890abcdef1234567890abcdef12345678'
      );

      expect(balance).toBe('1.0');
    });
  });

  describe('getExchangeRate', () => {
    it('should return hardcoded exchange rate for GBP to USDC', () => {
      const rate = blockchainService.getExchangeRate('GBP', 'USDC');

      expect(rate).toBe(1.27);
    });

    it('should return 1 for same currency', () => {
      const rate = blockchainService.getExchangeRate('USDC', 'USDC');

      expect(rate).toBe(1);
    });
  });

  describe('calculateFee', () => {
    it('should calculate 0.5% fee', () => {
      const fee = blockchainService.calculateFee(100);

      expect(fee).toBe(0.5);
    });

    it('should apply minimum fee of 0.01', () => {
      const fee = blockchainService.calculateFee(1);

      expect(fee).toBe(0.01);
    });
  });

  describe('convertGBPToUSDC', () => {
    it('should convert GBP to USDC correctly', () => {
      const result = blockchainService.convertGBPToUSDC(100);

      expect(result.amountUSDC).toBeCloseTo(126.5, 1); // 100 * 1.27 - 0.5% fee
      expect(result.exchangeRate).toBe(1.27);
      expect(result.fee).toBe(0.5);
    });
  });

  describe('transferUSDC', () => {
    it('should transfer USDC and return transaction hash', async () => {
      const result = await blockchainService.transferUSDC(
        '0xrecipientaddress1234567890abcdef12345678',
        '10'
      );

      expect(result.success).toBe(true);
      expect(result.txHash).toBeDefined();
    });

    it('should return error for invalid address', async () => {
      const result = await blockchainService.transferUSDC(
        'invalid-address',
        '10'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('isValidChain', () => {
    it('should validate Polygon Amoy testnet chain ID', async () => {
      const isValid = await blockchainService.isValidChain();

      expect(isValid).toBe(true);
    });
  });
});
