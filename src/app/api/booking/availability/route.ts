import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { todayISO } from '@/lib/slots';
import { getContent } from '@/lib/content-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Calendar = { blockedDates: string[]; blockedTimes: Record<string, string[]> };

type TakenRow = { date: string; time_slot: string };

export async function GET() {
  const cal = await getContent<Calendar>('calendar');

  // Merge owner-blocked times with currently-active bookings so the calendar
  // reflects both manual blocks and slots already held by other customers.
  let taken: TakenRow[] = [];
  try {
    const sql = db();
    taken = (await sql`
      SELECT date::text AS date, time_slot
      FROM bookings
      WHERE status IN ('pending_payment','confirmed')
        AND date >= ${todayISO()}::date
    `) as unknown as TakenRow[];
  } catch (err) {
    // If the DB is misconfigured, fall back to the calendar block list only —
    // better the form shows more availability than crashes.
    console.error('[booking/availability] db read failed; serving calendar blocks only', err);
  }

  const blockedTimes: Record<string, string[]> = { ...cal.blockedTimes };
  for (const row of taken) {
    if (!blockedTimes[row.date]) blockedTimes[row.date] = [];
    if (!blockedTimes[row.date].includes(row.time_slot)) {
      blockedTimes[row.date].push(row.time_slot);
    }
  }

  return NextResponse.json(
    {
      blockedDates: cal.blockedDates,
      blockedTimes,
    },
    {
      headers: {
        // Short cache: stale availability would cause double-bookings to be
        // attempted (which the DB unique index would still catch), but freshness
        // helps the UX. 30 seconds is a reasonable trade-off.
        'Cache-Control': 'public, max-age=30, s-maxage=30',
      },
    },
  );
}
