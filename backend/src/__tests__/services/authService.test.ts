import { authService } from '../../services/auth.service';
import { User } from '../../models/User.model';
import bcrypt from 'bcrypt';

// Mock wallet service
jest.mock('../../services/walletService', () => ({
  walletService: {
    generateWallet: jest.fn().mockResolvedValue({
      address: '0xmockedwalletaddress1234567890abcdef1234',
      encryptedPrivateKey: 'mockedencryptedprivatekey'
    })
  }
}));

describe('Auth Service', () => {
  describe('register', () => {
    it('should register a new user with hashed password', async () => {
      const result = await authService.register({
        email: 'newuser@example.com',
        password: 'Password123'
      });

      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.user?.email).toBe('newuser@example.com');
      expect(result.user?.walletAddress).toBeDefined();
      expect(result.tokens).toBeDefined();
      expect(result.tokens?.accessToken).toBeDefined();
      expect(result.tokens?.refreshToken).toBeDefined();

      // Verify password is hashed
      const savedUser = await User.findByEmail('newuser@example.com');
      expect(savedUser?.passwordHash).not.toBe('Password123');
      const isMatch = await bcrypt.compare('Password123', savedUser?.passwordHash ?? '');
      expect(isMatch).toBe(true);
    });

    it('should return error if email already exists', async () => {
      // Create existing user
      await authService.register({
        email: 'existing@example.com',
        password: 'Password123'
      });

      // Try to register with same email
      const result = await authService.register({
        email: 'existing@example.com',
        password: 'DifferentPassword123'
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Email already registered');
    });

    it('should create wallet for new user', async () => {
      const result = await authService.register({
        email: 'walletuser@example.com',
        password: 'Password123'
      });

      expect(result.success).toBe(true);
      expect(result.user?.walletAddress).toBeDefined();
      expect(result.user?.walletAddress).toBe('0xmockedwalletaddress1234567890abcdef1234');
    });
  });

  describe('login', () => {
    beforeEach(async () => {
      await authService.register({
        email: 'loginuser@example.com',
        password: 'Password123'
      });
    });

    it('should login with valid credentials', async () => {
      const result = await authService.login({
        email: 'loginuser@example.com',
        password: 'Password123'
      });

      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.user?.email).toBe('loginuser@example.com');
      expect(result.tokens).toBeDefined();
      expect(result.tokens?.accessToken).toBeDefined();
      expect(result.tokens?.refreshToken).toBeDefined();
    });

    it('should return error for non-existent email', async () => {
      const result = await authService.login({
        email: 'nonexistent@example.com',
        password: 'Password123'
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid email or password');
    });

    it('should return error for wrong password', async () => {
      const result = await authService.login({
        email: 'loginuser@example.com',
        password: 'WrongPassword123'
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid email or password');
    });

    it('should handle case-insensitive email', async () => {
      const result = await authService.login({
        email: 'LOGINUSER@EXAMPLE.COM',
        password: 'Password123'
      });

      expect(result.success).toBe(true);
      expect(result.user?.email).toBe('loginuser@example.com');
    });
  });

  describe('getUserById', () => {
    it('should return user by ID', async () => {
      const registerResult = await authService.register({
        email: 'getuser@example.com',
        password: 'Password123'
      });

      const userId = registerResult.user?.id;
      expect(userId).toBeDefined();

      const user = await authService.getUserById(userId as string);

      expect(user).not.toBeNull();
      expect(user?.email).toBe('getuser@example.com');
    });

    it('should return null for non-existent ID', async () => {
      const user = await authService.getUserById('507f1f77bcf86cd799439011');

      expect(user).toBeNull();
    });
  });

  describe('validatePassword', () => {
    it('should return true for matching password', async () => {
      await authService.register({
        email: 'validatepass@example.com',
        password: 'Password123'
      });

      const user = await User.findByEmail('validatepass@example.com');
      const isValid = await authService.validatePassword(
        'Password123',
        user?.passwordHash ?? ''
      );

      expect(isValid).toBe(true);
    });

    it('should return false for non-matching password', async () => {
      await authService.register({
        email: 'validatepass2@example.com',
        password: 'Password123'
      });

      const user = await User.findByEmail('validatepass2@example.com');
      const isValid = await authService.validatePassword(
        'WrongPassword',
        user?.passwordHash ?? ''
      );

      expect(isValid).toBe(false);
    });
  });
});
