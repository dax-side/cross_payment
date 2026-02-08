import { motion, AnimatePresence } from 'framer-motion';

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

interface Props {
  transaction: Transaction | null;
  onClose: () => void;
}

const statusColors: Record<string, string> = {
  completed: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  processing: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  failed: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

export default function TransactionModal({ transaction, onClose }: Props) {
  if (!transaction) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <h3 className="text-lg font-serif font-semibold dark:text-white">Transaction Details</h3>
            <button
              onClick={onClose}
              className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 dark:hover:text-slate-300 transition"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-5 space-y-4">
            {/* Status */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-500 dark:text-slate-400">Status</span>
              <span className={`text-xs font-medium px-3 py-1 rounded-full uppercase tracking-wide ${statusColors[transaction.status] ?? 'bg-slate-100 text-slate-600'}`}>
                {transaction.status}
              </span>
            </div>

            {/* Amount */}
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-slate-500 dark:text-slate-400">Sent</span>
                <span className="text-sm font-semibold dark:text-white">£{transaction.amountFiat.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-500 dark:text-slate-400">Fee</span>
                <span className="text-sm font-medium text-slate-600 dark:text-slate-300">£{transaction.fee.toFixed(2)}</span>
              </div>
              <div className="border-t border-slate-200 dark:border-slate-700 pt-2 flex justify-between">
                <span className="text-sm text-slate-500 dark:text-slate-400">Received</span>
                <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">{transaction.amountUSDC.toFixed(2)} USDC</span>
              </div>
            </div>

            {/* Details */}
            <div className="space-y-3">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Recipient</p>
                <p className="text-sm font-medium dark:text-white">{transaction.recipientEmail}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Exchange Rate</p>
                <p className="text-sm font-medium dark:text-white">1 GBP = {transaction.exchangeRate.toFixed(4)} USDC</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Date</p>
                <p className="text-sm font-medium dark:text-white">{new Date(transaction.createdAt).toLocaleString()}</p>
              </div>
              {transaction.txHash && (
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Transaction Hash</p>
                  <a
                    href={`https://amoy.polygonscan.com/tx/${transaction.txHash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-mono text-[#1f3b5c] dark:text-blue-400 hover:underline break-all"
                  >
                    {transaction.txHash.slice(0, 10)}...{transaction.txHash.slice(-8)}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          {transaction.txHash && (
            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700">
              <a
                href={`https://amoy.polygonscan.com/tx/${transaction.txHash}`}
                target="_blank"
                rel="noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 bg-[#1f3b5c] text-white py-2.5 rounded-lg text-sm font-medium hover:bg-[#1a324d] transition"
              >
                View on PolygonScan
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
