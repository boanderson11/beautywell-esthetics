// Centralized env access. Throws on missing values rather than silently failing,
// so config bugs surface at the first request rather than as mysterious 500s.

function required(name: string): string {
  const v = process.env[name];
  if (!v || v.length === 0) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return v;
}

function optional(name: string): string | undefined {
  const v = process.env[name];
  return v && v.length > 0 ? v : undefined;
}

export const env = {
  get DATABASE_URL() { return required('DATABASE_URL'); },
  get STRIPE_SECRET_KEY() { return required('STRIPE_SECRET_KEY'); },
  get STRIPE_WEBHOOK_SECRET() { return required('STRIPE_WEBHOOK_SECRET'); },
  get RESEND_API_KEY() { return required('RESEND_API_KEY'); },
  get OWNER_EMAIL() { return required('OWNER_EMAIL'); },
  get FROM_EMAIL() { return process.env.FROM_EMAIL || 'Beautywell <onboarding@resend.dev>'; },
  get SITE_URL() { return required('SITE_URL'); },
  get SESSION_SECRET() {
    const v = required('SESSION_SECRET');
    if (v.length < 32) {
      throw new Error('SESSION_SECRET must be at least 32 characters');
    }
    return v;
  },
  get CRON_SECRET() { return required('CRON_SECRET'); },
};

export function envIsConfigured(): boolean {
  return Boolean(
    optional('DATABASE_URL') &&
    optional('STRIPE_SECRET_KEY') &&
    optional('STRIPE_WEBHOOK_SECRET') &&
    optional('RESEND_API_KEY') &&
    optional('OWNER_EMAIL') &&
    optional('SITE_URL')
  );
}
