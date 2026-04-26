import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getAdminSession } from '@/lib/admin-auth';
import { validateSlot } from '@/lib/booking-validation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const Body = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD'),
  time: z.string().min(1).max(20),
});

type Row = {
  id: string;
  status: 'pending_payment' | 'confirmed' | 'expired' | 'cancelled';
};

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

  // Only reschedule live bookings — cancelled/expired ones aren't holding a slot.
  const rows = (await sql`
    SELECT id, status FROM bookings WHERE id = ${params.id} LIMIT 1
  `) as unknown as Row[];

  if (rows.length === 0) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
  }
  const status = rows[0].status;
  if (status !== 'confirmed' && status !== 'pending_payment') {
    return NextResponse.json(
      { error: `Cannot reschedule a ${status.replace('_', ' ')} booking` },
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

  return NextResponse.json({ ok: true, date: parsed.date, time: parsed.time });
}
