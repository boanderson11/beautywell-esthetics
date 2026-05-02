import { redirect } from 'next/navigation';
import { getAdminSession } from '@/lib/admin-auth';
import { db } from '@/lib/db';
import PrepView from './PrepView';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export type PrepBooking = {
  id: string;
  source: 'db' | 'manual';
  clientName: string;
  serviceId: string;
  serviceName: string;
  servicePrice: number;
  addons: Array<{ id: string; name: string; price: number }>;
  date: string | null;
  time: string | null;
  notes: string | null;
  totalCents: number | null;
  prepCompletedAt: string | null;
};

type DbRow = {
  id: string;
  first_name: string;
  last_name: string;
  service_id: string;
  service_name: string;
  addons: Array<{ id?: string; name: string; price: number }>;
  date: string;
  time_slot: string;
  notes: string | null;
  total_cents: number;
  prep_completed_at: string | null;
};

async function fetchBooking(id: string): Promise<PrepBooking | null> {
  const sql = db();
  const rows = (await sql`
    SELECT id, first_name, last_name, service_id, service_name, addons,
           date::text AS date, time_slot, notes, total_cents, prep_completed_at
    FROM bookings
    WHERE id = ${id}
    LIMIT 1
  `) as unknown as DbRow[];

  if (rows.length === 0) return null;
  const r = rows[0];
  return {
    id: r.id,
    source: 'db',
    clientName: `${r.first_name} ${r.last_name}`.trim(),
    serviceId: r.service_id,
    serviceName: r.service_name,
    servicePrice: 0, // Not stored separately on the row; total is what matters here.
    addons: (r.addons ?? []).map((a) => ({
      id: a.id ?? '',
      name: a.name,
      price: a.price,
    })),
    date: r.date,
    time: r.time_slot,
    notes: r.notes,
    totalCents: r.total_cents,
    prepCompletedAt: r.prep_completed_at,
  };
}

export default async function PrepPage({ params }: { params: { id: string } }) {
  const session = getAdminSession();
  if (!session) {
    redirect(`/admin/login?next=/admin/prep/${params.id}`);
  }

  // Manual entries live in admin-side localStorage only — no DB row. The
  // client component hydrates from localStorage when it sees source: 'manual'.
  if (params.id.startsWith('manual-')) {
    return <PrepView booking={null} bookingId={params.id} source="manual" />;
  }

  const booking = await fetchBooking(params.id);
  return (
    <PrepView booking={booking} bookingId={params.id} source="db" />
  );
}
