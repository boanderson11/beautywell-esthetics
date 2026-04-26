import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/admin-auth';
import { db } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type BookingRow = {
  id: string;
  status: 'pending_payment' | 'confirmed' | 'expired' | 'cancelled';
  created_at: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  service_name: string;
  addons: Array<{ id: string; name: string; price: number }>;
  date: string;
  time_slot: string;
  total_cents: number;
  deposit_cents: number;
  notes: string | null;
  paid_at: string | null;
  intake_completed_at: string | null;
};

export async function GET() {
  if (!getAdminSession()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sql = db();
  const rows = (await sql`
    SELECT
      id, status, created_at, first_name, last_name, email, phone,
      service_name, addons, date::text AS date, time_slot,
      total_cents, deposit_cents, notes, paid_at, intake_completed_at
    FROM bookings
    ORDER BY date DESC, time_slot DESC, created_at DESC
    LIMIT 500
  `) as unknown as BookingRow[];

  return NextResponse.json({ bookings: rows });
}
