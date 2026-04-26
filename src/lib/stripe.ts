import Stripe from 'stripe';
import { env } from './env';

let _stripe: Stripe | null = null;

export function stripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-02-24.acacia',
      typescript: true,
      // Netlify Functions cap at 10s (free) / 26s (paid). Stripe SDK's
      // 80s default would be killed by the platform mid-request, surfacing
      // as an opaque gateway 502. Cap below the function limit so we
      // surface a real Stripe error in our catch instead.
      timeout: 8000,
      maxNetworkRetries: 1,
    });
  }
  return _stripe;
}
