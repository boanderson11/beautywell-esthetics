import { NextRequest, NextResponse } from 'next/server';
import { bookingInputSchema, validateSlot } from '@/lib/booking-validation';
import { priceFor } from '@/lib/services-lookup';
import { db } from '@/lib/db';
import { stripe } from '@/lib/stripe';
import { newBookingId } from '@/lib/booking-id';
import { env } from '@/lib/env';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// 30-minute Stripe Checkout window. Slot is held only this long before being released.
const SESSION_TTL_SECONDS = 30 * 60;

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 });
  }

  const parsed = bookingInputSchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return NextResponse.json({ error: first?.message ?? 'Invalid input.' }, { status: 400 });
  }
  const input = parsed.data;

  // Honeypot: real users leave `website` blank. Anything filled = bot.
  if (input.website && input.website.length > 0) {
    return NextResponse.json({ error: 'Submission rejected.' }, { status: 400 });
  }

  const slotCheck = await validateSlot(input.date, input.time);
  if (!slotCheck.ok) {
    return NextResponse.json({ error: slotCheck.reason }, { status: 400 });
  }

  const calc = await priceFor(input.serviceId, input.addonIds);
  if ('error' in calc) {
    return NextResponse.json({ error: calc.error }, { status: 400 });
  }
  if (calc.depositCents <= 0) {
    return NextResponse.json({ error: 'Deposit amount must be greater than zero.' }, { status: 400 });
  }
  // Stripe minimum charge is $0.50 USD.
  if (calc.depositCents < 50) {
    return NextResponse.json({ error: 'Deposit amount is below the payment processor minimum.' }, { status: 400 });
  }

  // Verify required env up front so a misconfigured deploy fails before we
  // INSERT a pending_payment row that would otherwise be stranded when the
  // Stripe step throws on a missing var.
  try {
    void env.STRIPE_SECRET_KEY;
    void env.SITE_URL;
  } catch (err) {
    console.error('[booking/create] env misconfigured', err);
    return NextResponse.json(
      { error: 'Booking is temporarily unavailable. Please try again shortly.' },
      { status: 503 },
    );
  }

  const bookingId = newBookingId();
  const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000);

  // Insert pending booking. The partial unique index on (date, time_slot) WHERE
  // status IN ('pending_payment','confirmed') is the foolproof guard against
  // double-booking — two concurrent requests will see one INSERT succeed and the
  // other fail with 23505.
  const sql = db();
  try {
    await sql`
      INSERT INTO bookings (
        id, status, first_name, last_name, email, phone,
        service_id, service_name, addons,
        date, time_slot, total_cents, deposit_cents, notes, expires_at
      ) VALUES (
        ${bookingId}, 'pending_payment',
        ${input.firstName}, ${input.lastName}, ${input.email}, ${input.phone},
        ${calc.service.id}, ${calc.service.name},
        ${JSON.stringify(calc.addons.map((a) => ({ id: a.id, name: a.name, price: a.price })))}::jsonb,
        ${input.date}, ${input.time},
        ${calc.totalCents}, ${calc.depositCents},
        ${input.notes || null}, ${expiresAt.toISOString()}
      )
    `;
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code;
    if (code === '23505') {
      return NextResponse.json(
        { error: 'Sorry, that time slot was just taken. Please choose another.' },
        { status: 409 },
      );
    }
    console.error('[booking/create] db insert failed', { bookingId, code });
    return NextResponse.json({ error: 'Could not save booking. Please try again.' }, { status: 500 });
  }

  // Create the Stripe Checkout Session for the deposit.
  let checkoutUrl: string;
  try {
    const session = await stripe().checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      expires_at: Math.floor(expiresAt.getTime() / 1000),
      customer_email: input.email,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: calc.depositCents,
            product_data: {
              name: `${calc.service.name} — 50% deposit`,
              description: `${input.date} at ${input.time}${calc.addons.length ? ` · add-ons: ${calc.addons.map((a) => a.name).join(', ')}` : ''}`,
            },
          },
          quantity: 1,
        },
      ],
      metadata: { booking_id: bookingId },
      payment_intent_data: { metadata: { booking_id: bookingId } },
      allow_promotion_codes: true,
      success_url: `${env.SITE_URL}/booking/success?id=${bookingId}`,
      cancel_url: `${env.SITE_URL}/booking/cancelled?id=${bookingId}`,
    });

    if (!session.url) throw new Error('Stripe returned no checkout URL');
    checkoutUrl = session.url;

    await sql`
      UPDATE bookings
      SET stripe_session_id = ${session.id}
      WHERE id = ${bookingId}
    `;
  } catch (err) {
    // Roll back the booking so the slot is freed if Stripe failed.
    const e = err as {
      type?: string;
      code?: string;
      statusCode?: number;
      message?: string;
      requestId?: string;
    };
    console.error('[booking/create] stripe session failed', {
      bookingId,
      type: e?.type,
      code: e?.code,
      statusCode: e?.statusCode,
      requestId: e?.requestId,
      message: e?.message,
    });
    await sql`UPDATE bookings SET status = 'expired' WHERE id = ${bookingId}`;
    return NextResponse.json(
      { error: 'Could not start checkout. Please try again.' },
      { status: 502 },
    );
  }

  return NextResponse.json({ checkoutUrl, bookingId });
}
