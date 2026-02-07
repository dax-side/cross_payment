import { User, IUserDocument } from '../../models/User.model';

describe('User Model', () => {
  describe('Schema Validation', () => {
    it('should create a user with valid fields', async () => {
      const userData = {
        email: 'test@example.com',
        passwordHash: 'hashedpassword123',
        walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
        encryptedPrivateKey: 'encryptedkey123',
        fiatBalance: 100.50
      };

      const user = new User(userData);
      const savedUser = await user.save();

      expect(savedUser._id).toBeDefined();
      expect(savedUser.email).toBe(userData.email);
      expect(savedUser.passwordHash).toBe(userData.passwordHash);
      expect(savedUser.walletAddress).toBe(userData.walletAddress);
      expect(savedUser.encryptedPrivateKey).toBe(userData.encryptedPrivateKey);
      expect(savedUser.fiatBalance).toBe(userData.fiatBalance);
      expect(savedUser.createdAt).toBeDefined();
      expect(savedUser.updatedAt).toBeDefined();
    });

    it('should default fiatBalance to 0', async () => {
      const userData = {
        email: 'test@example.com',
        passwordHash: 'hashedpassword123',
        walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
        encryptedPrivateKey: 'encryptedkey123'
      };

      const user = new User(userData);
      const savedUser = await user.save();

      expect(savedUser.fiatBalance).toBe(0);
    });

    it('should require email', async () => {
      const userData = {
        passwordHash: 'hashedpassword123',
        walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
        encryptedPrivateKey: 'encryptedkey123'
      };

      const user = new User(userData);
      
      await expect(user.save()).rejects.toThrow();
    });

    it('should require passwordHash', async () => {
      const userData = {
        email: 'test@example.com',
        walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
        encryptedPrivateKey: 'encryptedkey123'
      };

      const user = new User(userData);
      
      await expect(user.save()).rejects.toThrow();
    });

    it('should require walletAddress', async () => {
      const userData = {
        email: 'test@example.com',
        passwordHash: 'hashedpassword123',
        encryptedPrivateKey: 'encryptedkey123'
      };

      const user = new User(userData);
      
      await expect(user.save()).rejects.toThrow();
    });

    it('should require encryptedPrivateKey', async () => {
      const userData = {
        email: 'test@example.com',
        passwordHash: 'hashedpassword123',
        walletAddress: '0x1234567890abcdef1234567890abcdef12345678'
      };

      const user = new User(userData);
      
      await expect(user.save()).rejects.toThrow();
    });

    it('should enforce unique email', async () => {
      const userData = {
        email: 'duplicate@example.com',
        passwordHash: 'hashedpassword123',
        walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
        encryptedPrivateKey: 'encryptedkey123'
      };

      await new User(userData).save();
      
      const duplicateUser = new User({
        ...userData,
        walletAddress: '0xabcdef1234567890abcdef1234567890abcdef12'
      });

      await expect(duplicateUser.save()).rejects.toThrow();
    });

    it('should enforce unique walletAddress', async () => {
      const userData = {
        email: 'test1@example.com',
        passwordHash: 'hashedpassword123',
        walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
        encryptedPrivateKey: 'encryptedkey123'
      };

      await new User(userData).save();
      
      const duplicateWallet = new User({
        ...userData,
        email: 'test2@example.com'
      });

      await expect(duplicateWallet.save()).rejects.toThrow();
    });

    it('should validate email format', async () => {
      const userData = {
        email: 'invalid-email',
        passwordHash: 'hashedpassword123',
        walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
        encryptedPrivateKey: 'encryptedkey123'
      };

      const user = new User(userData);
      
      await expect(user.save()).rejects.toThrow();
    });

    it('should convert email to lowercase', async () => {
      const userData = {
        email: 'TEST@EXAMPLE.COM',
        passwordHash: 'hashedpassword123',
        walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
        encryptedPrivateKey: 'encryptedkey123'
      };

      const user = new User(userData);
      const savedUser = await user.save();

      expect(savedUser.email).toBe('test@example.com');
    });
  });

  describe('Instance Methods', () => {
    it('should have toSafeObject method that excludes sensitive fields', async () => {
      const userData = {
        email: 'test@example.com',
        passwordHash: 'hashedpassword123',
        walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
        encryptedPrivateKey: 'encryptedkey123',
        fiatBalance: 100
      };

      const user = new User(userData);
      const savedUser = await user.save();
      const safeObject = savedUser.toSafeObject();

      expect(safeObject.id).toBeDefined();
      expect(safeObject.email).toBe(userData.email);
      expect(safeObject.walletAddress).toBe(userData.walletAddress);
      expect(safeObject.fiatBalance).toBe(userData.fiatBalance);
      expect((safeObject as Record<string, unknown>).passwordHash).toBeUndefined();
      expect((safeObject as Record<string, unknown>).encryptedPrivateKey).toBeUndefined();
    });
  });

  describe('Static Methods', () => {
    it('should find user by email', async () => {
      const userData = {
        email: 'findme@example.com',
        passwordHash: 'hashedpassword123',
        walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
        encryptedPrivateKey: 'encryptedkey123'
      };

      await new User(userData).save();
      
      const foundUser = await User.findByEmail('findme@example.com');

      expect(foundUser).not.toBeNull();
      expect(foundUser?.email).toBe('findme@example.com');
    });

    it('should return null for non-existent email', async () => {
      const foundUser = await User.findByEmail('nonexistent@example.com');

      expect(foundUser).toBeNull();
    });

    it('should find user by wallet address', async () => {
      const userData = {
        email: 'wallet@example.com',
        passwordHash: 'hashedpassword123',
        walletAddress: '0xabcdef1234567890abcdef1234567890abcdef12',
        encryptedPrivateKey: 'encryptedkey123'
      };

      await new User(userData).save();
      
      const foundUser = await User.findByWalletAddress('0xabcdef1234567890abcdef1234567890abcdef12');

      expect(foundUser).not.toBeNull();
      expect(foundUser?.walletAddress).toBe('0xabcdef1234567890abcdef1234567890abcdef12');
    });
  });
});
