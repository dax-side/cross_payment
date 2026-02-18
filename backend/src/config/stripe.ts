import Stripe from 'stripe';

let _stripe: Stripe | null = null;

export const getStripe = (): Stripe => {
  if (_stripe) return _stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY is not set. Add it to your environment variables.');
  }
  _stripe = new Stripe(key as string, {
    apiVersion: '2024-12-18.acacia' as Stripe.LatestApiVersion,
  });
  return _stripe;
};

export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return (getStripe() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

