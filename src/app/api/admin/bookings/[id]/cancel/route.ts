import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/admin-auth';
import { db } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Marks a booking as cancelled. The unique-per-slot index is partial on
// status IN ('pending_payment','confirmed'), so cancelling immediately frees
// the slot. Refunds (if any) are issued separately from the Stripe dashboard.
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  if (!getAdminSession()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sql = db();
  const result = (await sql`
    UPDATE bookings
    SET status = 'cancelled'
    WHERE id = ${params.id}
      AND status IN ('pending_payment','confirmed')
    RETURNING id
  `) as unknown as Array<{ id: string }>;

  if (result.length === 0) {
    return NextResponse.json(
      { error: 'Booking not found or already cancelled/expired' },
      { status: 404 },
    );
  }

  return NextResponse.json({ ok: true });
}
