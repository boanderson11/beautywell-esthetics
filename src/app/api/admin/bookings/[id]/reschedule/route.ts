import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { env } from '@/lib/env';
import { resend } from '@/lib/resend';
import { getAdminSession } from '@/lib/admin-auth';
import { validateSlot } from '@/lib/booking-validation';
import {
  customerRescheduledEmail,
  ownerRescheduledEmail,
  type RescheduleEmailData,
} from '@/emails/booking-emails';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const Body = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD'),
  time: z.string().min(1).max(20),
});

type BookingRow = {
  id: string;
  status: 'pending_payment' | 'confirmed' | 'expired' | 'cancelled';
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

async function sendRescheduleEmails(data: RescheduleEmailData): Promise<void> {
  const r = resend();
  const customer = customerRescheduledEmail(data);
  const owner = ownerRescheduledEmail(data);

  // Best-effort: log failures but never throw — the DB reschedule already
  // succeeded and we don't want to roll it back over an email outage.
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
  results.forEach((res, i) => {
    if (res.status === 'rejected') {
      console.error(`[admin/reschedule] email ${i === 0 ? 'customer' : 'owner'} failed`, {
        bookingId: data.id, err: res.reason,
      });
    }
  });
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  if (!getAdminSession()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let parsed;
  try {
    parsed = Body.parse(await req.json());
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const sql = db();

  // Read the full row up front so we have the customer info + previous slot
  // for the email after the UPDATE succeeds.
  const rows = (await sql`
    SELECT
      id, status, first_name, last_name, email, phone, service_name, addons,
      date::text AS date, time_slot, total_cents, deposit_cents, notes
    FROM bookings
    WHERE id = ${params.id}
    LIMIT 1
  `) as unknown as BookingRow[];

  if (rows.length === 0) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
  }
  const row = rows[0];
  if (row.status !== 'confirmed' && row.status !== 'pending_payment') {
    return NextResponse.json(
      { error: `Cannot reschedule a ${row.status.replace('_', ' ')} booking` },
      { status: 400 },
    );
  }

  const slotCheck = await validateSlot(parsed.date, parsed.time);
  if (!slotCheck.ok) {
    return NextResponse.json({ error: slotCheck.reason }, { status: 400 });
  }

  // The partial unique index on (date, time_slot) WHERE status IN
  // ('pending_payment','confirmed') guards against double-booking — if another
  // active booking holds the target slot, the UPDATE fails with 23505.
  try {
    await sql`
      UPDATE bookings
      SET date = ${parsed.date}, time_slot = ${parsed.time}
      WHERE id = ${params.id}
    `;
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code;
    if (code === '23505') {
      return NextResponse.json(
        { error: 'That time slot is already taken. Please choose another.' },
        { status: 409 },
      );
    }
    console.error('[admin/reschedule] update failed', { id: params.id, code });
    return NextResponse.json({ error: 'Could not reschedule booking' }, { status: 500 });
  }

  // Notify customer and owner. Only fires for confirmed bookings — emailing a
  // customer about a "rescheduled" pending-payment booking would be confusing
  // since they may not have completed payment yet.
  if (row.status === 'confirmed') {
    await sendRescheduleEmails({
      id: row.id,
      firstName: row.first_name,
      lastName: row.last_name,
      email: row.email,
      phone: row.phone,
      serviceName: row.service_name,
      addons: row.addons ?? [],
      date: parsed.date,
      time: parsed.time,
      previousDate: row.date,
      previousTime: row.time_slot,
      totalCents: row.total_cents,
      depositCents: row.deposit_cents,
      notes: row.notes,
    });
  }

  return NextResponse.json({ ok: true, date: parsed.date, time: parsed.time });
}
