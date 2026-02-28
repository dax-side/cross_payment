import { useEffect, useMemo, useState, useCallback } from 'react';
import type { FormEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { paymentApi, ratesApi, walletApi, analyticsApi } from '../lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { QRCodeSVG } from 'qrcode.react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useDarkMode } from '../hooks/useDarkMode';
import { useSocket } from '../hooks/useSocket';
import { CardSkeleton, TransactionSkeleton } from '../components/Skeleton';
import TransactionModal from '../components/TransactionModal';
import TutorialOverlay from '../components/TutorialOverlay';
import CardPaymentForm from '../components/CardPaymentForm';

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

interface AnalyticsSummary {
  sent: { count: number; totalGBP: number; totalUSDC: number };
  received: { count: number; totalUSDC: number };
  statusBreakdown: Record<string, number>;
  volume30d: { date: string; amount: number }[];
}

const cardClass =
  'bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-2xl p-6 shadow-[0_18px_40px_-32px_rgba(15,23,42,0.45)]';
const inputClass =
  'w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1f3b5c] dark:focus:ring-blue-500 focus:border-transparent transition';
const btnPrimary =
  'bg-[#1f3b5c] text-white rounded-lg text-sm font-medium hover:bg-[#1a324d] disabled:opacity-50 disabled:cursor-not-allowed transition';

const PAGE_SIZE = 10;

export default function Dashboard() {
  const { user, logout, sessionRestored, clearSessionRestored } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { dark: darkMode, toggle: toggleDarkMode } = useDarkMode();
  const { onTransactionUpdate, onBalanceUpdate } = useSocket(user?.id);

  const [recipientEmail, setRecipientEmail] = useState('');
  const [amountGBP, setAmountGBP] = useState('');
  const [transferLoading, setTransferLoading] = useState(false);
  const [preview, setPreview] = useState<{ amountUSDC: number; fee: number; exchangeRate: number } | null>(null);

  const [fiatBalance, setFiatBalance] = useState<number | null>(null);
  const [usdcBalance, setUsdcBalance] = useState<string>('0');
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);
  const [rateTimestamp, setRateTimestamp] = useState<string | null>(null);
  const [rateSource, setRateSource] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [treasuryUsdc, setTreasuryUsdc] = useState<string>('0');
  const [treasuryMatic, setTreasuryMatic] = useState<string>('0');
  const [treasuryAddress, setTreasuryAddress] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);

  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');

  const [initialLoading, setInitialLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [txPage, setTxPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [recipientValid, setRecipientValid] = useState<boolean | null>(null);
  const [showQR, setShowQR] = useState(false);
  const [activeTab, setActiveTab] = useState<'send' | 'deposit' | 'withdraw'>('send');

  const displayName = useMemo(() => {
    if (user?.email) return user.email.split('@')[0];
    return '\u2014';
  }, [user?.email]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const loadBalance = useCallback(async () => {
    try {
      const { data } = await walletApi.balance();
      setFiatBalance(data.data.fiatBalance);
      setUsdcBalance(data.data.usdcBalance);
      setWalletAddress(data.data.walletAddress);
    } catch { /* keep previous */ }

    try {
      const { data } = await walletApi.treasuryBalance();
      setTreasuryUsdc(data.data.usdcBalance);
      setTreasuryMatic(data.data.maticBalance);
      setTreasuryAddress(data.data.walletAddress);
    } catch { /* keep previous */ }
  }, []);

  const loadRates = useCallback(async () => {
    try {
      const { data } = await ratesApi.current();
      setExchangeRate(data.data.rate);
      setRateTimestamp(data.data.timestamp);
      setRateSource(data.data.source ?? null);
    } catch { /* ignore */ }
  }, []);

  const loadHistory = useCallback(async (page = 1, append = false) => {
    setHistoryLoading(true);
    try {
      const { data } = await paymentApi.history(page, PAGE_SIZE);
      const items: Transaction[] = data.data || [];
      setTransactions((prev) => (append ? [...prev, ...items] : items));
      setHasMore(items.length === PAGE_SIZE);
    } catch {
      if (!append) setTransactions([]);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  const loadAnalytics = useCallback(async () => {
    try {
      const { data } = await analyticsApi.summary();
      setAnalytics(data.data);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    Promise.all([loadBalance(), loadRates(), loadHistory(1), loadAnalytics()]).finally(() =>
      setInitialLoading(false)
    );
  }, [loadBalance, loadRates, loadHistory, loadAnalytics]);

  useEffect(() => {
    const unsubTx = onTransactionUpdate((tx: Transaction) => {
      setTransactions((prev) => {
        const idx = prev.findIndex((t) => t.id === tx.id);
        if (idx >= 0) {
          const copy = [...prev];
          copy[idx] = tx;
          return copy;
        }
        return [tx, ...prev];
      });
      toast.success(`Transfer ${tx.status}: ${(tx.amountUSDC ?? 0).toFixed(2)} USDC`);
    });

    const unsubBal = onBalanceUpdate((bal: { fiatBalance: number; usdcBalance: string }) => {
      setFiatBalance(bal.fiatBalance);
      setUsdcBalance(bal.usdcBalance);
    });

    return () => {
      unsubTx();
      unsubBal();
    };
  }, [onTransactionUpdate, onBalanceUpdate]);

  useEffect(() => {
    if (sessionRestored) {
      toast('Session restored \u2014 you\u2019re still signed in.', { icon: '\uD83D\uDD12' });
      clearSessionRestored();
    }
  }, [sessionRestored, clearSessionRestored]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('topup') === '1') {
      toast.success('Top-up received! Balance will refresh shortly.', { duration: 5000 });
      navigate('/dashboard', { replace: true });
      setTimeout(() => loadBalance(), 3000);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!recipientEmail || !recipientEmail.includes('@')) {
      setRecipientValid(null);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const { data } = await analyticsApi.lookupRecipient(recipientEmail);
        setRecipientValid(data.data?.exists ?? false);
      } catch {
        setRecipientValid(null);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [recipientEmail]);

  const handleTransfer = async (e: FormEvent) => {
    e.preventDefault();
    setTransferLoading(true);
    try {
      const amount = Number(amountGBP);
      await paymentApi.send({ recipientEmail, amountGBP: amount });
      toast.success('Transfer initiated successfully');
      setRecipientEmail('');
      setAmountGBP('');
      setPreview(null);
      await loadBalance();
      await loadHistory(1);
    } catch (err: any) {
      const apiError = err.response?.data;
      const msg = apiError?.details?.[0]?.message || apiError?.error || apiError?.message || 'Transfer failed.';
      toast.error(msg);
    } finally {
      setTransferLoading(false);
    }
  };

  const handlePreview = async () => {
    const amount = Number(amountGBP);
    if (!amount || amount <= 0) {
      toast.error('Enter a valid amount to preview.');
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
    try {
      const amount = Number(depositAmount);
      const { data } = await walletApi.deposit(amount);
      toast.success(`Deposited \u00A3${data.data.deposited}`);
      setDepositAmount('');
      await loadBalance();
    } catch (err: any) {
      const apiError = err.response?.data;
      toast.error(apiError?.details?.[0]?.message || apiError?.error || apiError?.message || 'Deposit failed.');
    }
  };

  const handleWithdraw = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const amount = Number(withdrawAmount);
      const { data } = await walletApi.withdraw(amount);
      toast.success(`Withdrawn \u00A3${data.data.withdrawn}`);
      setWithdrawAmount('');
      await loadBalance();
    } catch (err: any) {
      const apiError = err.response?.data;
      toast.error(apiError?.details?.[0]?.message || apiError?.error || apiError?.message || 'Withdrawal failed.');
    }
  };

  const handleExportCSV = async () => {
    try {
      const { data } = await analyticsApi.export();
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `crosspay-transactions-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Transactions exported');
    } catch {
      toast.error('Export failed');
    }
  };

  const loadMoreTx = () => {
    const next = txPage + 1;
    setTxPage(next);
    loadHistory(next, true);
  };

  return (
    <div className="min-h-screen bg-[#f6f2eb] dark:bg-slate-950 transition-colors duration-300">
      {/* Header */}
      <header className="border-b border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-[#1f3b5c] border border-[#27496f] flex items-center justify-center relative">
              <span className="text-[#d9b47a] font-serif font-bold text-sm tracking-tight">CP</span>
              <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-[#d9b47a]" />
            </div>
            <div>
              <h1 className="text-lg font-serif font-semibold tracking-tight dark:text-white">CrossPay</h1>
              <p className="text-[10px] uppercase tracking-[0.25em] text-slate-400">Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={toggleDarkMode}
              className="h-9 w-9 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title={darkMode ? 'Light mode' : 'Dark mode'}
            >
              {darkMode ? (
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <circle cx="12" cy="12" r="5" />
                  <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" strokeLinecap="round" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
            <span className="text-sm text-slate-600 dark:text-slate-300 hidden sm:block">{user?.email}</span>
            <button onClick={handleLogout} className="text-sm text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition">
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Welcome */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h2 className="text-3xl font-serif font-semibold mb-1 dark:text-white">
            Welcome back, {displayName}
          </h2>
          <p className="text-slate-600 dark:text-slate-400">Manage your cross-border payments and wallet</p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {initialLoading ? (
            <>
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
            </>
          ) : (
            <>
              <motion.div data-tour="balance-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className={cardClass}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-xl bg-[#e7eef6] dark:bg-[#1f3b5c]/30 text-[#1f3b5c] dark:text-blue-400 flex items-center justify-center">
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M8 6h8M8 12h7a3 3 0 0 1 0 6H8" strokeLinecap="round" />
                      <path d="M11 4v16" strokeLinecap="round" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Wallet Balance</p>
                    <p className="text-2xl font-semibold dark:text-white">{'\u00A3'}{(fiatBalance ?? 0).toFixed(2)}</p>
                  </div>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">USDC on Polygon: {usdcBalance}</p>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className={cardClass}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-xl bg-[#f4e6d2] dark:bg-[#b07a2a]/20 text-[#b07a2a] flex items-center justify-center">
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6">
                      <path d="M3 12h18M3 6h18M3 18h18" strokeLinecap="round" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Total Transfers</p>
                    <p className="text-2xl font-semibold dark:text-white">{analytics?.sent.count ?? transactions.length}</p>
                  </div>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {analytics ? `${'\u00A3'}${analytics.sent.totalGBP.toFixed(2)} sent total` : 'All time'}
                </p>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-slate-50/75 dark:bg-slate-900/30 border border-slate-200/60 dark:border-slate-800 rounded-2xl p-5 shadow-none">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-xl bg-[#e6eceb]/80 dark:bg-[#5b6b6f]/15 text-[#5b6b6f] dark:text-slate-400 flex items-center justify-center">
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M12 3v18" strokeLinecap="round" />
                      <path d="M16 7h-5a3 3 0 0 0 0 6h2a3 3 0 0 1 0 6H8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-500">Treasury Wallet</p>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{Number(treasuryUsdc).toFixed(2)} USDC</p>
                  </div>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-500">Gas: {Number(treasuryMatic).toFixed(4)} POL</p>
                {treasuryAddress && (
                  <a
                    href={`https://amoy.polygonscan.com/address/${treasuryAddress}`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-flex text-xs text-[#1f3b5c]/80 dark:text-blue-400/90 hover:underline"
                  >
                    View treasury on explorer {'\u2197'}
                  </a>
                )}
              </motion.div>
            </>
          )}
        </div>

        {/* Volume chart */}
        {analytics?.volume30d && analytics.volume30d.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={`${cardClass} mb-8`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-serif font-semibold dark:text-white">30-Day Volume</h3>
              <button onClick={handleExportCSV} className="text-xs text-[#1f3b5c] dark:text-blue-400 hover:underline">
                Export CSV {'\u2193'}
              </button>
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={analytics.volume30d}>
                  <defs>
                    <linearGradient id="volumeGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#1f3b5c" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#1f3b5c" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="date"
                    tickFormatter={(v: string) => v.slice(5)}
                    tick={{ fontSize: 11, fill: darkMode ? '#94a3b8' : '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: darkMode ? '#94a3b8' : '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v: number) => `${'\u00A3'}${v}`}
                  />
                  <Tooltip
                    contentStyle={{
                      background: darkMode ? '#1e293b' : '#fff',
                      border: '1px solid',
                      borderColor: darkMode ? '#334155' : '#e2e8f0',
                      borderRadius: 12,
                      fontSize: 13,
                      color: darkMode ? '#f1f5f9' : '#1e293b',
                    }}
                    formatter={(val: number | undefined) => [`${'\u00A3'}${(val ?? 0).toFixed(2)}`, 'Volume']}
                  />
                  <Area type="monotone" dataKey="amount" stroke="#1f3b5c" fill="url(#volumeGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}

        {/* Account & Wallet */}
        <div className="grid md:grid-cols-[0.88fr_1.12fr] gap-6 mb-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-slate-50/80 dark:bg-slate-900/35 border border-slate-200/70 dark:border-slate-800 rounded-2xl p-5 shadow-none">
            <h3 className="text-base font-serif font-semibold mb-4 dark:text-white">Account Details</h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Account Name</p>
                <p className="text-sm font-medium dark:text-white">{displayName}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Email Address</p>
                <p className="text-sm font-medium dark:text-white">{user?.email}</p>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className={`${cardClass} p-6 ring-1 ring-[#1f3b5c]/25 dark:ring-[#93b5e0]/25`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-serif font-semibold dark:text-white">Wallet Address</h3>
              {walletAddress && (
                <button
                  onClick={() => setShowQR(!showQR)}
                  className="text-xs text-[#1f3b5c] dark:text-blue-400 hover:underline"
                >
                  {showQR ? 'Hide QR' : 'Show QR'}
                </button>
              )}
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Polygon Address</p>
                <p className="text-sm font-mono text-slate-600 dark:text-slate-300 break-all">{walletAddress ?? user?.walletAddress}</p>
              </div>

              <AnimatePresence>
                {showQR && walletAddress && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex justify-center py-3 overflow-hidden"
                  >
                    <div className="p-3 bg-white rounded-xl">
                      <QRCodeSVG value={walletAddress} size={140} fgColor="#1f3b5c" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <p className="text-xs text-slate-500 dark:text-slate-400">
                This is your receiving wallet. Transfers are funded from the platform treasury wallet.
              </p>
              {walletAddress ? (
                <a
                  href={`https://amoy.polygonscan.com/address/${walletAddress}`}
                  target="_blank"
                  rel="noreferrer"
                  className={`w-full mt-2 inline-flex items-center justify-center py-2.5 ${btnPrimary}`}
                >
                  View on Explorer {'\u2197'}
                </a>
              ) : (
                <button disabled className="w-full mt-2 bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 py-2.5 rounded-lg text-sm font-medium cursor-not-allowed">
                  Wallet not available
                </button>
              )}
            </div>
          </motion.div>
        </div>

        {/* Actions: Send / Deposit / Withdraw */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className={`${cardClass} mb-8`}>
          <div data-tour="deposit-tab" className="flex border-b border-slate-200 dark:border-slate-700 mb-6">
            {(['send', 'deposit', 'withdraw'] as const).map((tab) => (
              <button
                key={tab}
                data-tour={tab === 'send' ? 'send-tab' : undefined}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-3 text-sm font-medium capitalize transition border-b-2 -mb-[1px] ${
                  activeTab === tab
                    ? 'border-[#1f3b5c] dark:border-blue-400 text-[#1f3b5c] dark:text-blue-400'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                {tab === 'send' ? 'Send Transfer' : tab === 'deposit' ? 'Deposit' : 'Withdraw'}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'send' && (
              <motion.div key="send" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
                <form onSubmit={handleTransfer} className="grid md:grid-cols-[2fr_1fr_auto] gap-4 items-end">
                  <div>
                    <label className="block text-xs text-slate-500 dark:text-slate-400 mb-2">Recipient Email</label>
                    <div className="relative">
                      <input
                        type="email"
                        required
                        value={recipientEmail}
                        onChange={(e) => setRecipientEmail(e.target.value)}
                        className={inputClass}
                        placeholder="recipient@example.com"
                      />
                      {recipientValid !== null && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2">
                          {recipientValid ? (
                            <svg className="h-4 w-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          ) : (
                            <svg className="h-4 w-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="10" />
                              <path d="M12 8v4M12 16h.01" strokeLinecap="round" />
                            </svg>
                          )}
                        </span>
                      )}
                    </div>
                    {recipientValid === false && recipientEmail.includes('@') && (
                      <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">Recipient not found {'\u2014'} they'll need to register to claim the transfer.</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 dark:text-slate-400 mb-2">Amount (GBP)</label>
                    <input
                      type="number"
                      min="1"
                      step="0.01"
                      required
                      value={amountGBP}
                      onChange={(e) => setAmountGBP(e.target.value)}
                      className={inputClass}
                      placeholder="100.00"
                    />
                  </div>
                  <button type="submit" disabled={transferLoading} className={`h-11 px-6 ${btnPrimary}`}>
                    {transferLoading ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Sending
                      </span>
                    ) : (
                      'Send'
                    )}
                  </button>
                </form>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <button type="button" onClick={handlePreview} className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition">
                    Preview conversion
                  </button>
                  {preview && (
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      Rate: {preview.exchangeRate.toFixed(2)} {'\u00B7'} Fee: {'\u00A3'}{preview.fee.toFixed(2)} {'\u00B7'} USDC: {preview.amountUSDC.toFixed(2)}
                    </span>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'deposit' && (
              <motion.div key="deposit" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
                <div className="space-y-5">
                  <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/30 p-4">
                    <p className="text-sm font-semibold dark:text-white mb-3">Simulated deposit (testing)</p>
                    <form onSubmit={handleDeposit} className="flex gap-3 items-end">
                      <div className="flex-1">
                        <label className="block text-xs text-slate-500 dark:text-slate-400 mb-2">Amount (GBP)</label>
                        <input
                          type="number"
                          min="10"
                          step="1"
                          required
                          value={depositAmount}
                          onChange={(e) => setDepositAmount(e.target.value)}
                          className={inputClass}
                          placeholder="100"
                        />
                      </div>
                      <button type="submit" className={`h-11 px-6 ${btnPrimary}`}>Deposit</button>
                    </form>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">Adds demo GBP balance locally for test transfers.</p>
                  </div>

                  <div className="rounded-xl border border-[#b07a2a]/30 dark:border-[#e8c97a]/20 bg-[#b07a2a]/5 dark:bg-[#e8c97a]/5 p-4">
                    <p className="text-sm font-semibold text-[#b07a2a] dark:text-[#e8c97a] mb-3">Real card payment (Stripe)</p>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mb-3">Uses Stripe test mode checkout and webhook crediting.</p>
                    <CardPaymentForm onSuccess={loadBalance} />
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'withdraw' && (
              <motion.div key="withdraw" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
                <form onSubmit={handleWithdraw} className="flex gap-3 items-end">
                  <div className="flex-1">
                    <label className="block text-xs text-slate-500 dark:text-slate-400 mb-2">Amount (GBP)</label>
                    <input
                      type="number"
                      min="10"
                      step="1"
                      required
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      className={inputClass}
                      placeholder="100"
                    />
                  </div>
                  <button type="submit" className={`h-11 px-6 ${btnPrimary}`}>Withdraw</button>
                </form>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">Withdraw GBP from your simulated fiat balance.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <div className="grid md:grid-cols-[0.95fr_1.05fr] gap-6">
          {/* Exchange Rate */}
          <motion.div data-tour="exchange-rate" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className={cardClass}>
            <h3 className="text-lg font-serif font-semibold mb-4 dark:text-white">Exchange Rate</h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">GBP {'\u2192'} USDC</p>
                <p className="text-2xl font-semibold dark:text-white">{exchangeRate ? exchangeRate.toFixed(4) : '\u2014'}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400">{rateTimestamp ? new Date(rateTimestamp).toLocaleString() : ''}</p>
                {rateSource && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full mt-1 inline-flex items-center gap-1 ${
                    rateSource === 'live'
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                      : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                  }`}>
                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                    {rateSource.charAt(0).toUpperCase() + rateSource.slice(1).toLowerCase()}
                  </span>
                )}
              </div>
            </div>
          </motion.div>

          {/* Recent Activity */}
          <motion.div data-tour="recent-activity" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className={cardClass}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-serif font-semibold dark:text-white">Recent Activity</h3>
            {transactions.length > 0 && (
              <button onClick={handleExportCSV} className="text-xs text-[#1f3b5c] dark:text-blue-400 hover:underline">
                Export CSV
              </button>
            )}
          </div>

          {historyLoading && transactions.length === 0 ? (
            <div className="space-y-3">
              <TransactionSkeleton />
              <TransactionSkeleton />
              <TransactionSkeleton />
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-10 text-slate-500 dark:text-slate-400">
              <svg viewBox="0 0 24 24" className="h-12 w-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <p className="text-sm font-medium">No transactions yet</p>
              <p className="text-xs mt-1">Your transfer history will appear here</p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {transactions.map((tx, i) => (
                  <motion.div
                    key={tx.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    onClick={() => setSelectedTx(tx)}
                    className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition group"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-medium ${
                        tx.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                          : tx.status === 'failed'
                          ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                      }`}>
                        {tx.status === 'completed' ? '\u2713' : tx.status === 'failed' ? '\u2717' : '\u22EF'}
                      </div>
                      <div>
                        <p className="text-sm font-medium dark:text-white">To {tx.recipientEmail}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{new Date(tx.createdAt).toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-medium dark:text-white">{'\u00A3'}{(tx.amountFiat ?? 0).toFixed(2)}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{(tx.amountUSDC ?? 0).toFixed(2)} USDC</p>
                      </div>
                      <svg className="h-4 w-4 text-slate-300 dark:text-slate-600 group-hover:text-slate-500 dark:group-hover:text-slate-400 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  </motion.div>
                ))}
              </div>

              {hasMore && (
                <div className="mt-4 text-center">
                  <button
                    onClick={loadMoreTx}
                    disabled={historyLoading}
                    className="text-sm text-[#1f3b5c] dark:text-blue-400 hover:underline disabled:opacity-50"
                  >
                    {historyLoading ? 'Loading...' : 'Load more transactions'}
                  </button>
                </div>
              )}
            </>
          )}
          </motion.div>
        </div>
      </main>

      {/* Transaction Modal */}
      <AnimatePresence>
        {selectedTx && <TransactionModal transaction={selectedTx} onClose={() => setSelectedTx(null)} />}
      </AnimatePresence>

      {/* Onboarding Tutorial */}
      <TutorialOverlay />
    </div>
  );
}
