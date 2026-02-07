import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { paymentApi, ratesApi, walletApi } from '../lib/api';

interface Transaction {
  id: string;
  senderEmail: string;
  recipientEmail: string;
  amountFiat: number;
  amountUSDC: number;
  exchangeRate: number;
  fee: number;
  status: string;
  txHash: string | null;
  createdAt: string;
}

export default function Dashboard() {
  const { user, logout, sessionRestored, clearSessionRestored } = useAuth();
  const navigate = useNavigate();
  const [recipientEmail, setRecipientEmail] = useState('');
  const [amountGBP, setAmountGBP] = useState('');
  const [transferLoading, setTransferLoading] = useState(false);
  const [transferError, setTransferError] = useState('');
  const [transferSuccess, setTransferSuccess] = useState('');
  const [fiatBalance, setFiatBalance] = useState<number | null>(null);
  const [usdcBalance, setUsdcBalance] = useState<string>('0');
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);
  const [rateTimestamp, setRateTimestamp] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ amountUSDC: number; fee: number; exchangeRate: number } | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [treasuryUsdc, setTreasuryUsdc] = useState<string>('0');
  const [treasuryMatic, setTreasuryMatic] = useState<string>('0');
  const [treasuryAddress, setTreasuryAddress] = useState<string | null>(null);
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [walletActionError, setWalletActionError] = useState('');
  const [walletActionSuccess, setWalletActionSuccess] = useState('');

  const displayName = useMemo(() => {
    const fullName = `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim();
    if (fullName) return fullName;
    if (user?.email) return user.email.split('@')[0];
    return '—';
  }, [user?.firstName, user?.lastName, user?.email]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const loadBalance = async () => {
    try {
      const { data } = await walletApi.balance();
      setFiatBalance(data.data.fiatBalance);
      setUsdcBalance(data.data.usdcBalance);
      setWalletAddress(data.data.walletAddress);
    } catch {
      // keep previous values
    }

    try {
      const { data } = await walletApi.treasuryBalance();
      setTreasuryUsdc(data.data.usdcBalance);
      setTreasuryMatic(data.data.maticBalance);
      setTreasuryAddress(data.data.walletAddress);
    } catch {
      // keep previous values
    }
  };

  const loadRates = async () => {
    try {
      const { data } = await ratesApi.current();
      setExchangeRate(data.data.rate);
      setRateTimestamp(data.data.timestamp);
    } catch {
      // ignore rate errors for now
    }
  };

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const { data } = await paymentApi.history(1, 10);
      setTransactions(data.data || []);
    } catch {
      setTransactions([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    void loadBalance();
    void loadRates();
    void loadHistory();
  }, []);

  const handleTransfer = async (e: FormEvent) => {
    e.preventDefault();
    setTransferError('');
    setTransferSuccess('');
    setTransferLoading(true);

    try {
      const amount = Number(amountGBP);
      await paymentApi.send({ recipientEmail, amountGBP: amount });
      setTransferSuccess('Transfer initiated successfully.');
      setRecipientEmail('');
      setAmountGBP('');
      setPreview(null);
      await loadBalance();
      await loadHistory();
    } catch (err: any) {
      const apiError = err.response?.data;
      const validationMessage = apiError?.details?.[0]?.message;
      setTransferError(validationMessage || apiError?.error || apiError?.message || 'Transfer failed.');
    } finally {
      setTransferLoading(false);
    }
  };

  const handlePreview = async () => {
    setTransferError('');
    const amount = Number(amountGBP);
    if (!amount || amount <= 0) {
      setTransferError('Enter a valid amount to preview.');
      return;
    }

    const { data } = await paymentApi.preview({ amountGBP: amount });
    setPreview({
      amountUSDC: data.data.amountUSDC,
      fee: data.data.fee,
      exchangeRate: data.data.exchangeRate,
    });
  };

  const handleDeposit = async (e: FormEvent) => {
    e.preventDefault();
    setWalletActionError('');
    setWalletActionSuccess('');
    try {
      const amount = Number(depositAmount);
      const { data } = await walletApi.deposit(amount);
      setWalletActionSuccess(`Deposit successful: £${data.data.deposited}`);
      setDepositAmount('');
      await loadBalance();
    } catch (err: any) {
      const apiError = err.response?.data;
      const validationMessage = apiError?.details?.[0]?.message;
      setWalletActionError(validationMessage || apiError?.error || apiError?.message || 'Deposit failed.');
    }
  };

  const handleWithdraw = async (e: FormEvent) => {
    e.preventDefault();
    setWalletActionError('');
    setWalletActionSuccess('');
    try {
      const amount = Number(withdrawAmount);
      const { data } = await walletApi.withdraw(amount);
      setWalletActionSuccess(`Withdrawal successful: £${data.data.withdrawn}`);
      setWithdrawAmount('');
      await loadBalance();
    } catch (err: any) {
      const apiError = err.response?.data;
      const validationMessage = apiError?.details?.[0]?.message;
      setWalletActionError(validationMessage || apiError?.error || apiError?.message || 'Withdrawal failed.');
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f2eb]">
      {/* Header */}
      <header className="border-b border-slate-200/80 bg-white">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-white border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-100 via-white to-blue-100" />
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight">CrossPay</h1>
              <p className="text-[10px] uppercase tracking-[0.25em] text-slate-400">Private client</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="text-sm text-slate-700 hover:text-slate-900"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-serif font-semibold mb-2">
            Welcome back, {displayName}
          </h2>
          <p className="text-slate-600">Manage your cross-border payments and wallet</p>
        </div>

        {sessionRestored && (
          <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 flex items-center justify-between">
            <span>Session restored automatically. You're still signed in.</span>
            <button
              onClick={clearSessionRestored}
              className="text-emerald-700 hover:text-emerald-900"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-[0_18px_40px_-32px_rgba(15,23,42,0.45)]">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-[#e7eef6] text-[#1f3b5c] flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <path d="M21 12a9 9 0 1 1-9-9" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M3.6 9h16.8M3.6 15h16.8" strokeLinecap="round" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-slate-500">Wallet Balance</p>
                <p className="text-2xl font-semibold">£{(fiatBalance ?? 0).toFixed(2)}</p>
              </div>
            </div>
            <p className="text-xs text-slate-500">USDC on Polygon (your wallet): {usdcBalance}</p>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-[0_18px_40px_-32px_rgba(15,23,42,0.45)]">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-[#f4e6d2] text-[#b07a2a] flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <path d="M3 12h18M3 6h18M3 18h18" strokeLinecap="round" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-slate-500">Total Transfers</p>
                <p className="text-2xl font-semibold">{transactions.length}</p>
              </div>
            </div>
            <p className="text-xs text-slate-500">All time</p>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-[0_18px_40px_-32px_rgba(15,23,42,0.45)]">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-[#e6eceb] text-[#5b6b6f] flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-slate-500">Treasury Wallet</p>
                <p className="text-2xl font-semibold">{Number(treasuryUsdc).toFixed(2)} USDC</p>
              </div>
            </div>
            <p className="text-xs text-slate-500">Gas: {Number(treasuryMatic).toFixed(4)} POL</p>
            {treasuryAddress && (
              <a
                href={`https://amoy.polygonscan.com/address/${treasuryAddress}`}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-flex text-xs text-[#1f3b5c] hover:text-[#1a324d]"
              >
                View treasury on explorer
              </a>
            )}
          </div>

        </div>

        {/* Account Details */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-[0_18px_40px_-32px_rgba(15,23,42,0.45)]">
            <h3 className="text-lg font-serif font-semibold mb-4">Account Details</h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-slate-500 mb-1">Account Name</p>
                <p className="text-sm font-medium">{displayName}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Email Address</p>
                <p className="text-sm font-medium">{user?.email}</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-[0_18px_40px_-32px_rgba(15,23,42,0.45)]">
            <h3 className="text-lg font-serif font-semibold mb-4">Wallet Address</h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-slate-500 mb-1">Polygon Address</p>
                <p className="text-sm font-mono text-slate-600 break-all">{walletAddress ?? user?.walletAddress}</p>
              </div>
              <p className="text-xs text-slate-500">
                This is your receiving wallet. Transfers are funded from the platform treasury wallet.
              </p>
              {walletAddress ? (
                <a
                  href={`https://amoy.polygonscan.com/address/${walletAddress}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full mt-4 inline-flex items-center justify-center bg-[#1f3b5c] text-white py-2.5 rounded-lg text-sm font-medium hover:bg-[#1a324d] transition"
                >
                  View on Explorer
                </a>
              ) : (
                <button
                  disabled
                  className="w-full mt-4 bg-slate-200 text-slate-500 py-2.5 rounded-lg text-sm font-medium cursor-not-allowed"
                >
                  Wallet not available
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Wallet Actions */}
        <div className="mt-6 grid md:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-[0_18px_40px_-32px_rgba(15,23,42,0.45)]">
            <h3 className="text-lg font-serif font-semibold mb-4">Deposit Funds</h3>
            <form onSubmit={handleDeposit} className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="block text-xs text-slate-500 mb-2">Amount (GBP)</label>
                <input
                  type="number"
                  min="10"
                  step="1"
                  required
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1f3b5c] focus:border-transparent"
                  placeholder="100"
                />
              </div>
              <button
                type="submit"
                className="h-11 px-6 bg-[#1f3b5c] text-white rounded-lg text-sm font-medium hover:bg-[#1a324d] transition"
              >
                Deposit
              </button>
            </form>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-[0_18px_40px_-32px_rgba(15,23,42,0.45)]">
            <h3 className="text-lg font-serif font-semibold mb-4">Withdraw Funds</h3>
            <form onSubmit={handleWithdraw} className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="block text-xs text-slate-500 mb-2">Amount (GBP)</label>
                <input
                  type="number"
                  min="10"
                  step="1"
                  required
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1f3b5c] focus:border-transparent"
                  placeholder="100"
                />
              </div>
              <button
                type="submit"
                className="h-11 px-6 bg-[#1f3b5c] text-white rounded-lg text-sm font-medium hover:bg-[#1a324d] transition"
              >
                Withdraw
              </button>
            </form>
          </div>
        </div>

        {(walletActionError || walletActionSuccess) && (
          <div className="mt-3">
            {walletActionError && <p className="text-sm text-red-600">{walletActionError}</p>}
            {walletActionSuccess && <p className="text-sm text-emerald-600">{walletActionSuccess}</p>}
          </div>
        )}

        {/* Transfer */}
        <div className="mt-6 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-[0_18px_40px_-32px_rgba(15,23,42,0.45)]">
          <h3 className="text-lg font-serif font-semibold mb-4">New Transfer</h3>
          <form onSubmit={handleTransfer} className="grid md:grid-cols-[2fr_1fr_auto] gap-4 items-end">
            <div>
              <label className="block text-xs text-slate-500 mb-2">Recipient Email</label>
              <input
                type="email"
                required
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1f3b5c] focus:border-transparent"
                placeholder="recipient@example.com"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-2">Amount (GBP)</label>
              <input
                type="number"
                min="1"
                step="0.01"
                required
                value={amountGBP}
                onChange={(e) => setAmountGBP(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1f3b5c] focus:border-transparent"
                placeholder="100.00"
              />
            </div>
            <button
              type="submit"
              disabled={transferLoading}
              className="h-11 px-6 bg-[#1f3b5c] text-white rounded-lg text-sm font-medium hover:bg-[#1a324d] disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {transferLoading ? 'Sending...' : 'Send'}
            </button>
          </form>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handlePreview}
              className="text-sm text-slate-600 hover:text-slate-900"
            >
              Preview conversion
            </button>
            {preview && (
              <span className="text-xs text-slate-500">
                Rate: {preview.exchangeRate.toFixed(2)} • Fee: £{preview.fee.toFixed(2)} • USDC: {preview.amountUSDC.toFixed(2)}
              </span>
            )}
          </div>
          {transferError && (
            <p className="mt-3 text-sm text-red-600">{transferError}</p>
          )}
          {transferSuccess && (
            <p className="mt-3 text-sm text-emerald-600">{transferSuccess}</p>
          )}
        </div>

        {/* Rates */}
        <div className="mt-6 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-[0_18px_40px_-32px_rgba(15,23,42,0.45)]">
          <h3 className="text-lg font-serif font-semibold mb-4">Exchange Rate</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500">GBP → USDC</p>
              <p className="text-2xl font-semibold">{exchangeRate ? exchangeRate.toFixed(2) : '—'}</p>
            </div>
            <p className="text-xs text-slate-400">{rateTimestamp ? new Date(rateTimestamp).toLocaleString() : ''}</p>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mt-6 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-[0_18px_40px_-32px_rgba(15,23,42,0.45)]">
          <h3 className="text-lg font-serif font-semibold mb-4">Recent Activity</h3>
          {historyLoading ? (
            <p className="text-sm text-slate-500">Loading history...</p>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <svg viewBox="0 0 24 24" className="h-12 w-12 mx-auto mb-3 text-slate-300" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <p className="text-sm">No transactions yet</p>
              <p className="text-xs mt-1">Your transfer history will appear here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx) => (
                <div key={tx.id} className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 border border-slate-200 rounded-xl px-4 py-3">
                  <div>
                    <p className="text-sm font-medium">To {tx.recipientEmail}</p>
                    <p className="text-xs text-slate-500">{new Date(tx.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="text-sm text-slate-600">
                    GBP {tx.amountFiat.toFixed(2)} to {tx.amountUSDC.toFixed(2)} USDC
                  </div>
                  <span className="text-xs uppercase tracking-wide text-slate-500">{tx.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
