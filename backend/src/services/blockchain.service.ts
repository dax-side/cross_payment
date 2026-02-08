import { ethers, JsonRpcProvider, Contract, Wallet } from 'ethers';
import { logger } from '../config/logger';

const USDC_ABI = [
  'function balanceOf(address account) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function decimals() view returns (uint8)',
  'function approve(address spender, uint256 amount) returns (bool)'
];

const POLYGON_AMOY_CHAIN_ID = 80002;

const FALLBACK_RATES: Record<string, number> = {
  'GBP_USDC': 1.27,
  'USD_USDC': 1.0,
  'EUR_USDC': 1.08
};

let rateCache: { rate: number; timestamp: number; source: string } | null = null;
const RATE_CACHE_TTL = 60_000;

const FEE_PERCENTAGE = 0.005;
const MIN_FEE = 0.01;

interface TransferResult {
  success: boolean;
  txHash?: string;
  blockNumber?: number;
  error?: string;
}

interface ConversionResult {
  amountUSDC: number;
  exchangeRate: number;
  fee: number;
}

const getProvider = (): JsonRpcProvider => {
  const rpcUrl = process.env.POLYGON_RPC_URL;
  if (!rpcUrl) {
    throw new Error('POLYGON_RPC_URL environment variable is not set');
  }
  return new JsonRpcProvider(rpcUrl);
};

const getUSDCContract = (signerOrProvider: Wallet | JsonRpcProvider): Contract => {
  const contractAddress = process.env.USDC_CONTRACT_ADDRESS;
  if (!contractAddress) {
    throw new Error('USDC_CONTRACT_ADDRESS environment variable is not set');
  }
  return new Contract(contractAddress, USDC_ABI, signerOrProvider);
};

const getMasterWallet = (): Wallet => {
  const privateKey = process.env.MASTER_WALLET_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error('MASTER_WALLET_PRIVATE_KEY environment variable is not set');
  }
  const provider = getProvider();
  return new Wallet(privateKey, provider);
};

const getUSDCBalance = async (walletAddress: string): Promise<string> => {
  try {
    const provider = getProvider();
    const contract = getUSDCContract(provider);
    
    if (!contract.balanceOf || !contract.decimals) {
      throw new Error('Contract methods not available');
    }
    
    const balance = await contract.balanceOf(walletAddress) as bigint;
    const decimals = await contract.decimals() as number;
    return ethers.formatUnits(balance, decimals);
  } catch (error) {
    logger.error('Failed to get USDC balance', { error, walletAddress });
    throw new Error('Failed to get USDC balance');
  }
};

const fetchLiveGBPRate = async (): Promise<{ rate: number; source: string }> => {
  const now = Date.now();
  if (rateCache && (now - rateCache.timestamp) < RATE_CACHE_TTL) {
    return { rate: rateCache.rate, source: rateCache.source };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=usd-coin&vs_currencies=gbp',
      { signal: controller.signal }
    );
    clearTimeout(timeout);

    if (!res.ok) throw new Error(`CoinGecko responded ${res.status}`);

    const data = await res.json() as { 'usd-coin'?: { gbp?: number } };
    const gbpPerUsdc = data['usd-coin']?.gbp;

    if (!gbpPerUsdc || gbpPerUsdc <= 0) throw new Error('Invalid rate from CoinGecko');

    const rate = 1 / gbpPerUsdc;

    rateCache = { rate, timestamp: now, source: 'coingecko' };
    logger.info('Fetched live exchange rate', { rate, source: 'coingecko' });
    return { rate, source: 'coingecko' };
  } catch (error) {
    logger.warn('Failed to fetch live rate, using fallback', { error });
    const fallback = FALLBACK_RATES['GBP_USDC'] ?? 1.27;
    return { rate: fallback, source: 'fallback' };
  }
};

const getExchangeRate = async (from: string, to: string): Promise<number> => {
  if (from === to) return 1;

  if (from === 'GBP' && to === 'USDC') {
    const { rate } = await fetchLiveGBPRate();
    return rate;
  }

  const key = `${from}_${to}`;
  const rate = FALLBACK_RATES[key];
  if (rate === undefined) {
    logger.warn('Exchange rate not found, using default', { from, to });
    return 1;
  }
  return rate;
};

const getExchangeRateWithMeta = async (): Promise<{ rate: number; source: string; timestamp: string }> => {
  const { rate, source } = await fetchLiveGBPRate();
  return {
    rate,
    source,
    timestamp: new Date().toISOString()
  };
};

const calculateFee = (amountGBP: number): number => {
  const fee = amountGBP * FEE_PERCENTAGE;
  return Math.max(fee, MIN_FEE);
};

const convertGBPToUSDC = async (amountGBP: number): Promise<ConversionResult> => {
  const exchangeRate = await getExchangeRate('GBP', 'USDC');
  const fee = calculateFee(amountGBP);
  const amountAfterFee = amountGBP - fee;
  const amountUSDC = amountAfterFee * exchangeRate;

  return {
    amountUSDC,
    exchangeRate,
    fee
  };
};

const transferUSDC = async (
  toAddress: string,
  amount: string
): Promise<TransferResult> => {
  try {
    if (!ethers.isAddress(toAddress)) {
      return { success: false, error: 'Invalid recipient address' };
    }

    const masterWallet = getMasterWallet();
    const contract = getUSDCContract(masterWallet);
    
    const amountInUnits = ethers.parseUnits(amount, 6);

    logger.info('Initiating USDC transfer', {
      to: toAddress,
      amount,
      from: masterWallet.address
    });

    if (!contract.transfer) {
      return { success: false, error: 'Contract transfer method not available' };
    }

    const tx = await contract.transfer(toAddress, amountInUnits) as ethers.ContractTransactionResponse;
    
    logger.info('Transaction submitted', { txHash: tx.hash });

    const receipt = await tx.wait();
    
    if (!receipt) {
      return { success: false, error: 'Transaction receipt not found' };
    }

    logger.info('Transaction confirmed', {
      txHash: tx.hash,
      blockNumber: receipt.blockNumber
    });

    return {
      success: true,
      txHash: tx.hash,
      blockNumber: receipt.blockNumber
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('USDC transfer failed', { error, toAddress, amount });
    return { success: false, error: errorMessage };
  }
};

const isValidChain = async (): Promise<boolean> => {
  try {
    const provider = getProvider();
    const network = await provider.getNetwork();
    return Number(network.chainId) === POLYGON_AMOY_CHAIN_ID;
  } catch (error) {
    logger.error('Failed to validate chain', { error });
    return false;
  }
};

const getMasterWalletBalance = async (): Promise<{
  maticBalance: string;
  usdcBalance: string;
}> => {
  try {
    const masterWallet = getMasterWallet();
    const provider = getProvider();
    
    const maticBalance = await provider.getBalance(masterWallet.address);
    const usdcBalance = await getUSDCBalance(masterWallet.address);

    return {
      maticBalance: ethers.formatEther(maticBalance),
      usdcBalance
    };
  } catch (error) {
    logger.error('Failed to get master wallet balance', { error });
    throw new Error('Failed to get master wallet balance');
  }
};

export const blockchainService = {
  getProvider,
  getUSDCContract,
  getMasterWallet,
  getUSDCBalance,
  getExchangeRate,
  getExchangeRateWithMeta,
  calculateFee,
  convertGBPToUSDC,
  transferUSDC,
  isValidChain,
  getMasterWalletBalance
};
