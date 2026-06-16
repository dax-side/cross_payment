import { ethers, Wallet } from 'ethers';
import { logger } from '../config/logger';

class SecureMasterWallet {
  private static instance: SecureMasterWallet | null = null;
  private wallet: Wallet | null = null;
  private accessCount = 0;
  private lastAccess = 0;
  private readonly maxAccessPerHour = 100;

  private constructor() {
    // Private constructor for singleton
  }

  public static getInstance(): SecureMasterWallet {
    if (!SecureMasterWallet.instance) {
      SecureMasterWallet.instance = new SecureMasterWallet();
    }
    return SecureMasterWallet.instance;
  }

  private validateEnvironment(): void {
    const required = [
      'MASTER_WALLET_PRIVATE_KEY',
      'POLYGON_RPC_URL',
      'USDC_CONTRACT_ADDRESS'
    ];

    const missing = required.filter(key => !process.env[key]);
    if (missing.length > 0) {
      logger.error('Missing required environment variables for master wallet', { missing });
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
  }

  private checkAccessLimits(): void {
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;

    // Reset counter if more than an hour has passed
    if (now - this.lastAccess > oneHour) {
      this.accessCount = 0;
    }

    this.accessCount++;
    this.lastAccess = now;

    if (this.accessCount > this.maxAccessPerHour) {
      logger.error('Master wallet access limit exceeded', {
        accessCount: this.accessCount,
        timeWindow: '1 hour',
        limit: this.maxAccessPerHour
      });
      throw new Error('Master wallet access limit exceeded');
    }

    // Log suspicious access patterns
    if (this.accessCount > 50) {
      logger.warn('High frequency master wallet access detected', {
        accessCount: this.accessCount,
        timeWindow: 'current hour'
      });
    }
  }

  public getWallet(provider: ethers.Provider): Wallet {
    try {
      this.validateEnvironment();
      this.checkAccessLimits();

      if (!this.wallet) {
        // Use original key for hackathon (but with additional security measures)
        const privateKey = process.env.MASTER_WALLET_PRIVATE_KEY!;

        // Validate the private key format
        if (!privateKey.startsWith('0x') || privateKey.length !== 66) {
          throw new Error('Invalid master wallet private key format');
        }

        this.wallet = new Wallet(privateKey, provider);

        logger.info('Master wallet initialized', {
          address: this.wallet.address,
          hasProvider: !!provider,
          accessCount: this.accessCount
        });
      }

      return this.wallet;
    } catch (error) {
      logger.error('Failed to initialize master wallet', { error });
      throw new Error('Master wallet initialization failed');
    }
  }

  public getAddress(): string {
    this.validateEnvironment();

    if (!this.wallet) {
      const privateKey = process.env.MASTER_WALLET_PRIVATE_KEY!;
      const tempWallet = new Wallet(privateKey);
      return tempWallet.address;
    }

    return this.wallet.address;
  }

  public getAccessStats(): { accessCount: number; lastAccess: number; limit: number } {
    return {
      accessCount: this.accessCount,
      lastAccess: this.lastAccess,
      limit: this.maxAccessPerHour
    };
  }

  // Emergency methods for security incidents
  public invalidateWallet(): void {
    this.wallet = null;
    this.accessCount = 0;
    logger.warn('Master wallet invalidated - manual security action');
  }

  public resetAccessCounter(): void {
    this.accessCount = 0;
    this.lastAccess = 0;
    logger.info('Master wallet access counter reset');
  }
}

export { SecureMasterWallet };
export default SecureMasterWallet.getInstance();