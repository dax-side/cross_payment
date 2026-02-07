import { walletService } from '../../services/wallet.service';

describe('Wallet Service', () => {
  describe('generateWallet', () => {
    it('should generate a new wallet with address and encrypted private key', async () => {
      const wallet = await walletService.generateWallet();

      expect(wallet.address).toBeDefined();
      expect(wallet.address).toMatch(/^0x[a-fA-F0-9]{40}$/);
      expect(wallet.encryptedPrivateKey).toBeDefined();
      expect(wallet.encryptedPrivateKey.length).toBeGreaterThan(0);
    });

    it('should generate unique addresses for each wallet', async () => {
      const wallet1 = await walletService.generateWallet();
      const wallet2 = await walletService.generateWallet();

      expect(wallet1.address).not.toBe(wallet2.address);
    });
  });

  describe('encryptPrivateKey and decryptPrivateKey', () => {
    it('should encrypt and decrypt private key correctly', async () => {
      const originalKey = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      
      const encrypted = walletService.encryptPrivateKey(originalKey);
      const decrypted = walletService.decryptPrivateKey(encrypted);

      expect(encrypted).not.toBe(originalKey);
      expect(decrypted).toBe(originalKey);
    });

    it('should produce different encrypted values for same key', async () => {
      const originalKey = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      
      const encrypted1 = walletService.encryptPrivateKey(originalKey);
      const encrypted2 = walletService.encryptPrivateKey(originalKey);

      // Due to random IV, encrypted values should be different
      expect(encrypted1).not.toBe(encrypted2);
      
      // But both should decrypt to the same value
      expect(walletService.decryptPrivateKey(encrypted1)).toBe(originalKey);
      expect(walletService.decryptPrivateKey(encrypted2)).toBe(originalKey);
    });
  });

  describe('isValidAddress', () => {
    it('should return true for valid Ethereum address', () => {
      const validAddress = '0x1234567890abcdef1234567890abcdef12345678';
      
      expect(walletService.isValidAddress(validAddress)).toBe(true);
    });

    it('should return true for checksum address', () => {
      const checksumAddress = '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B';
      
      expect(walletService.isValidAddress(checksumAddress)).toBe(true);
    });

    it('should return false for invalid address', () => {
      expect(walletService.isValidAddress('invalid')).toBe(false);
      expect(walletService.isValidAddress('0x123')).toBe(false);
      expect(walletService.isValidAddress('')).toBe(false);
    });
  });
});
