import { db } from './db';

export type BookingDetails = {
  id: string;
  status: 'pending_payment' | 'confirmed' | 'expired' | 'cancelled';
  firstName: string;
  serviceName: string;
  serviceDuration: string | null;
  addons: Array<{ name: string; price: number }>;
  date: string;
  time: string;
  totalCents: number;
  depositCents: number;
};

type Row = {
  id: string;
  status: BookingDetails['status'];
  first_name: string;
  service_id: string;
  service_name: string;
  addons: Array<{ name: string; price: number }>;
  date: string;
  time_slot: string;
  total_cents: number;
  deposit_cents: number;
};

export async function fetchBookingForDisplay(id: string): Promise<BookingDetails | null> {
  const sql = db();
  const rows = (await sql`
    SELECT id, status, first_name, service_id, service_name, addons,
           date::text AS date, time_slot, total_cents, deposit_cents
    FROM bookings
    WHERE id = ${id}
    LIMIT 1
  `) as unknown as Row[];

  if (rows.length === 0) return null;
  const r = rows[0];

  // Look up duration from services.json so the calendar export gets the right length.
  let serviceDuration: string | null = null;
  try {
    // Lazy import to keep this module tree-shakeable from edge contexts.
    const { getService } = await import('./services-lookup');
    serviceDuration = getService(r.service_id)?.duration ?? null;
  } catch {
    // ignore
  }

  return {
    id: r.id,
    status: r.status,
    firstName: r.first_name,
    serviceName: r.service_name,
    serviceDuration,
    addons: r.addons ?? [],
    date: r.date,
    time: r.time_slot,
    totalCents: r.total_cents,
    depositCents: r.deposit_cents,
  };
}
