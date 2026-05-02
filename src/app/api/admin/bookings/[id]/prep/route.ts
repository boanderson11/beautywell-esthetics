import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/admin-auth';
import { db } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Toggles the back-of-house prep state for a booking. Body: { completed: boolean }.
// `true` stamps prep_completed_at = now(); `false` clears it. Doesn't touch the
// booking's `status` — prep is an independent axis, like intake_completed_at.
export async function POST(req: Request, { params }: { params: { id: string } }) {
  if (!getAdminSession()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { completed?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 });
  }
  if (typeof body.completed !== 'boolean') {
    return NextResponse.json(
      { error: '`completed` must be a boolean.' },
      { status: 400 },
    );
  }

  const sql = db();
  const result = body.completed
    ? ((await sql`
        UPDATE bookings
        SET prep_completed_at = now()
        WHERE id = ${params.id}
        RETURNING id, prep_completed_at
      `) as unknown as Array<{ id: string; prep_completed_at: string }>)
    : ((await sql`
        UPDATE bookings
        SET prep_completed_at = NULL
        WHERE id = ${params.id}
        RETURNING id, prep_completed_at
      `) as unknown as Array<{ id: string; prep_completed_at: string | null }>);

  if (result.length === 0) {
    return NextResponse.json({ error: 'Booking not found.' }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    prep_completed_at: result[0].prep_completed_at,
  });
}
