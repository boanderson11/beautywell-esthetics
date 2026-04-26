import { NextRequest, NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { db } from '@/lib/db';
import { resend } from '@/lib/resend';
import { env } from '@/lib/env';
import { customerEmail, ownerEmail, type BookingEmailData } from '@/emails/booking-emails';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type BookingRow = {
  id: string;
  status: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  service_name: string;
  addons: Array<{ name: string; price: number }>;
  date: string;
  time_slot: string;
  total_cents: number;
  deposit_cents: number;
  notes: string | null;
};

export async function POST(req: NextRequest) {
  const sig = req.headers.get('stripe-signature');
  if (!sig) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  // Stripe requires the raw body for signature verification.
  const raw = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(raw, sig, env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('[booking/webhook] signature verification failed', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const sql = db();

  // Idempotency: insert event id; if already present, short-circuit.
  try {
    await sql`INSERT INTO processed_stripe_events (event_id) VALUES (${event.id})`;
  } catch (err: unknown) {
    if ((err as { code?: string })?.code === '23505') {
      return NextResponse.json({ received: true, duplicate: true });
    }
    console.error('[booking/webhook] dedupe insert failed', err);
    // Fall through — better to risk a duplicate than to drop a real event.
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const bookingId = session.metadata?.booking_id;
      if (!bookingId) {
        console.warn('[booking/webhook] session.completed without booking_id', { sessionId: session.id });
        return NextResponse.json({ received: true });
      }

      // Mark confirmed; only do email work if this is the first transition.
      const rows = (await sql`
        UPDATE bookings
        SET status = 'confirmed',
            paid_at = now(),
            stripe_payment_intent = ${typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id ?? null}
        WHERE id = ${bookingId}
          AND status = 'pending_payment'
        RETURNING id, status, first_name, last_name, email, phone,
                  service_name, addons, date::text AS date, time_slot,
                  total_cents, deposit_cents, notes
      `) as unknown as BookingRow[];

      if (rows.length === 0) {
        // Already confirmed (webhook retried) or booking missing — no-op.
        return NextResponse.json({ received: true, alreadyConfirmed: true });
      }

      const row = rows[0];
      const emailData: BookingEmailData = {
        id: row.id,
        firstName: row.first_name,
        lastName: row.last_name,
        email: row.email,
        phone: row.phone,
        serviceName: row.service_name,
        addons: row.addons ?? [],
        date: row.date,
        time: row.time_slot,
        totalCents: row.total_cents,
        depositCents: row.deposit_cents,
        notes: row.notes,
      };

      await sendEmails(emailData);
    } else if (event.type === 'checkout.session.expired') {
      const session = event.data.object as Stripe.Checkout.Session;
      const bookingId = session.metadata?.booking_id;
      if (bookingId) {
        await sql`
          UPDATE bookings
          SET status = 'expired'
          WHERE id = ${bookingId}
            AND status = 'pending_payment'
        `;
      }
    } else if (event.type === 'charge.refunded') {
      const charge = event.data.object as Stripe.Charge;
      const pi = typeof charge.payment_intent === 'string' ? charge.payment_intent : charge.payment_intent?.id;
      if (pi) {
        await sql`
          UPDATE bookings
          SET status = 'cancelled'
          WHERE stripe_payment_intent = ${pi}
            AND status = 'confirmed'
        `;
      }
    }
  } catch (err) {
    console.error('[booking/webhook] handler error', { eventId: event.id, type: event.type, err });
    // Return 200 anyway — we've recorded the event id, retrying won't help.
    // For cases where we need replay, remove the row from processed_stripe_events.
    return NextResponse.json({ received: true, error: 'handler failed (logged)' });
  }

  return NextResponse.json({ received: true });
}

async function sendEmails(data: BookingEmailData): Promise<void> {
  const r = resend();
  const customer = customerEmail(data);
  const owner = ownerEmail(data);

  // Send both in parallel, log failures, never throw — emails are best-effort.
  const results = await Promise.allSettled([
    r.emails.send({
      from: env.FROM_EMAIL,
      to: data.email,
      subject: customer.subject,
      html: customer.html,
      text: customer.text,
    }),
    r.emails.send({
      from: env.FROM_EMAIL,
      to: env.OWNER_EMAIL,
      replyTo: data.email,
      subject: owner.subject,
      html: owner.html,
      text: owner.text,
    }),
  ]);
  results.forEach((r, i) => {
    if (r.status === 'rejected') {
      console.error(`[booking/webhook] email ${i === 0 ? 'customer' : 'owner'} failed`, { bookingId: data.id, err: r.reason });
    }
  });
}
