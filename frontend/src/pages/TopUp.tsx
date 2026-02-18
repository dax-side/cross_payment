import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { paymentApi } from '../lib/api';
import { useDarkMode } from '../hooks/useDarkMode';
import toast from 'react-hot-toast';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string);

function CheckoutForm({ amountGBP }: { amountGBP: number }) {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const [paying, setPaying] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setPaying(true);
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/dashboard?topup=1`,
      },
      redirect: 'if_required',
    });

    if (error) {
      toast.error(error.message ?? 'Payment failed');
      setPaying(false);
    } else {
      toast.success(`£${amountGBP} top-up successful! Balance will update shortly.`);
      navigate('/dashboard?topup=1');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <button
        type="submit"
        disabled={!stripe || paying}
        className="w-full bg-[#1f3b5c] text-white py-3 rounded-xl text-sm font-semibold hover:bg-[#17304d] disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        {paying ? 'Processing…' : `Pay £${amountGBP} →`}
      </button>
      <p className="text-center text-xs text-slate-400">
        Test card: <span className="font-mono">4242 4242 4242 4242</span> · any future date · any CVC
      </p>
    </form>
  );
}

export default function TopUp() {
  const { dark, toggle } = useDarkMode();
  const navigate = useNavigate();

  const [stage, setStage] = useState<'amount' | 'pay'>('amount');
  const [amount, setAmount] = useState(50);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    setLoading(true);
    try {
      const { data } = await paymentApi.createTopUpIntent(amount);
      setClientSecret(data.data.clientSecret);
      setStage('pay');
    } catch {
      toast.error('Could not create payment — try again.');
    } finally {
      setLoading(false);
    }
  };

  const presets = [10, 25, 50, 100, 250, 500];

  return (
    <div className="min-h-screen bg-[#f5f0e8] dark:bg-[#0c1117] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => (stage === 'pay' ? setStage('amount') : navigate('/dashboard'))}
            className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white transition"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {stage === 'pay' ? 'Change amount' : 'Back to dashboard'}
          </button>
          <button
            onClick={toggle}
            className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white transition"
          >
            {dark ? (
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
                <circle cx="12" cy="12" r="5" />
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" strokeLinecap="round" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-[#141b26] border border-slate-200/80 dark:border-slate-700/60 rounded-2xl shadow-[0_32px_80px_-32px_rgba(15,23,42,0.3)] p-8">
          <div className="mb-7">
            <p className="text-xs uppercase tracking-[0.3em] text-[#b07a2a] dark:text-[#e8c97a] font-semibold mb-2">Top up balance</p>
            <h1 className="text-2xl font-serif font-bold dark:text-white">Add GBP funds</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Charged to your card. Instant credit. Use to send USDC.
            </p>
          </div>

          {stage === 'amount' ? (
            <div className="space-y-6">
              {/* Preset amounts */}
              <div>
                <label className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 mb-3 block">
                  Select amount
                </label>
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {presets.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setAmount(p)}
                      className={`py-2.5 rounded-xl text-sm font-semibold border transition ${
                        amount === p
                          ? 'bg-[#1f3b5c] text-white border-[#1f3b5c]'
                          : 'bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-[#1f3b5c] dark:hover:border-[#93b5e0]'
                      }`}
                    >
                      £{p}
                    </button>
                  ))}
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-semibold">£</span>
                  <input
                    type="number"
                    min={1}
                    max={10000}
                    value={amount}
                    onChange={(e) => setAmount(Math.max(1, Math.min(10000, Number(e.target.value))))}
                    className="w-full pl-8 pr-4 py-3 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1f3b5c] transition text-sm"
                    placeholder="Custom amount"
                  />
                </div>
              </div>

              {/* Summary */}
              <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl px-4 py-3 text-sm flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">You'll be charged</span>
                <span className="font-bold text-base dark:text-white">£{amount.toFixed(2)}</span>
              </div>

              <button
                onClick={handleContinue}
                disabled={loading || amount < 1}
                className="w-full bg-[#1f3b5c] text-white py-3 rounded-xl text-sm font-semibold hover:bg-[#17304d] disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm"
              >
                {loading ? 'Preparing…' : `Continue to payment →`}
              </button>
            </div>
          ) : (
            clientSecret && (
              <Elements
                stripe={stripePromise}
                options={{
                  clientSecret,
                  appearance: {
                    theme: dark ? 'night' : 'stripe',
                    variables: {
                      colorPrimary: '#1f3b5c',
                      borderRadius: '10px',
                    },
                  },
                }}
              >
                <CheckoutForm amountGBP={amount} />
              </Elements>
            )
          )}
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          Powered by Stripe · Payments are processed in test mode
        </p>
      </div>
    </div>
  );
}
