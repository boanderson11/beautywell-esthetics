// Netlify scheduled function — fires daily and pings the Next.js cron endpoint
// which holds all the reminder logic. Keeping the logic in /api keeps it
// runnable manually (curl + bearer token) and inside the same Next.js
// runtime as the rest of the app.
//
// Schedule: 16:00 UTC ≈ 9am Pacific (PDT) / 8am Pacific (PST). Adjust below
// if you want reminders sent at a different local time.

export const config = {
  schedule: '0 16 * * *',
};

export default async () => {
  const siteUrl = process.env.SITE_URL;
  const cronSecret = process.env.CRON_SECRET;

  if (!siteUrl || !cronSecret) {
    console.error('[send-reminders] missing SITE_URL or CRON_SECRET');
    return new Response('misconfigured', { status: 500 });
  }

  const res = await fetch(`${siteUrl}/api/cron/send-reminders`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${cronSecret}` },
  });

  const body = await res.text();
  if (!res.ok) {
    console.error('[send-reminders] cron call failed', { status: res.status, body });
    return new Response(body, { status: res.status });
  }

  console.log('[send-reminders] ok', body);
  return new Response(body, { status: 200 });
};
