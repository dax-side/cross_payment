import { useMemo, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import type { Appearance, StripeElementsOptions } from '@stripe/stripe-js';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import toast from 'react-hot-toast';
import { paymentApi } from '../lib/api';
import { useDarkMode } from '../hooks/useDarkMode';

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string | undefined;
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

interface CardPaymentFormProps {
  onSuccess?: () => Promise<void> | void;
}

interface CheckoutInnerProps {
  amountGBP: number;
  onSuccess?: () => Promise<void> | void;
  onError: (message: string) => void;
}

function CheckoutInner({ amountGBP, onSuccess, onError }: CheckoutInnerProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    onError('');
    setProcessing(true);

    const result = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
      confirmParams: {
        return_url: `${window.location.origin}/dashboard?topup=1`,
      },
    });

    if (result.error) {
      onError(result.error.message ?? 'Payment failed. Please try again.');
      setProcessing(false);
      return;
    }

    const status = result.paymentIntent?.status;
    if (status === 'succeeded' || status === 'processing' || !status) {
      // Confirm with backend to credit the fiatBalance
      try {
        const intentId = result.paymentIntent?.id;
        if (intentId) {
          await paymentApi.confirmTopUp(intentId);
        }
      } catch {
      }
      toast.success(`£${amountGBP.toFixed(2)} added to your balance.`);
      await onSuccess?.();
      return;
    }

    onError('Payment did not complete. Please try again.');
    setProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <PaymentElement />
      <button
        type="submit"
        disabled={!stripe || processing}
        className="w-full bg-[#1f3b5c] text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-[#17304d] disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        {processing ? 'Processing payment...' : `Pay £${amountGBP.toFixed(2)}`}
      </button>
    </form>
  );
}

export default function CardPaymentForm({ onSuccess }: CardPaymentFormProps) {
  const { dark } = useDarkMode();
  const [amountGBP, setAmountGBP] = useState(50);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [preparing, setPreparing] = useState(false);
  const [error, setError] = useState('');

  const appearance = useMemo<Appearance>(
    () =>
      dark
        ? {
            theme: 'night',
            variables: {
              colorPrimary: '#1f3b5c',
              colorBackground: '#0f172a',
              colorText: '#ffffff',
              colorDanger: '#ff4444',
              fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
              borderRadius: '8px',
            },
          }
        : {
            theme: 'stripe',
            variables: {
              colorPrimary: '#1f3b5c',
              colorBackground: '#ffffff',
              colorText: '#0f172a',
              colorDanger: '#ff4444',
              fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
              borderRadius: '8px',
            },
          },
    [dark]
  );

  const createIntent = async () => {
    if (!amountGBP || amountGBP < 1) {
      setError('Enter a valid amount (minimum £1).');
      return;
    }

    setError('');
    setPreparing(true);
    try {
      const { data } = await paymentApi.createTopUpIntent(amountGBP);
      setClientSecret(data.data.clientSecret);
    } catch (err: any) {
      const apiError = err.response?.data;
      setError(apiError?.details?.[0]?.message || apiError?.error || apiError?.message || 'Unable to start card payment.');
    } finally {
      setPreparing(false);
    }
  };

  if (!stripePromise) {
    return (
      <p className="text-xs text-red-600 dark:text-red-400">
        Stripe is not configured. Add VITE_STRIPE_PUBLISHABLE_KEY to frontend environment.
      </p>
    );
  }

  const elementOptions: StripeElementsOptions | undefined = clientSecret
    ? {
        clientSecret,
        appearance,
      }
    : undefined;

  return (
    <div className="space-y-3">
      <div className="flex gap-3 items-end">
        <div className="flex-1">
          <label className="block text-xs text-slate-500 dark:text-slate-300 mb-2">Amount (GBP)</label>
          <input
            type="number"
            min="1"
            step="0.01"
            value={amountGBP}
            onChange={(e) => {
              setAmountGBP(Number(e.target.value));
              if (clientSecret) setClientSecret(null);
            }}
            className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1f3b5c] focus:border-transparent transition"
            placeholder="50"
          />
        </div>
        {!clientSecret && (
          <button
            type="button"
            onClick={createIntent}
            disabled={preparing}
            className="h-11 px-4 rounded-lg bg-[#1f3b5c] text-white text-sm font-medium hover:bg-[#1a324d] disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {preparing ? 'Loading...' : 'Load card form'}
          </button>
        )}
      </div>

      {error && (
        <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
      )}

      {clientSecret && elementOptions && (
        <Elements stripe={stripePromise} options={elementOptions}>
          <CheckoutInner amountGBP={amountGBP} onSuccess={onSuccess} onError={setError} />
        </Elements>
      )}

      <p className="text-[11px] text-slate-500 dark:text-slate-400">
        Use Stripe test cards only. Your dashboard balance updates after successful confirmation. 4242 4242 4242 4242 with any future expiry and CVC works for testing. For more test card numbers, see{' '}
        <a href="https://stripe.com/docs/testing#cards" target="_blank" rel="noopener noreferrer" className="text-[#1f3b5c] hover:underline">
          Stripe testing docs
        </a>. 
      </p>
    </div>
  );
}
