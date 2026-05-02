'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Booking, BookingStatus, ServicesData, AddonsData } from './types'
import { Label } from './ui'
import { fmtDate } from './cal-helpers'
import { cancelBooking } from './api-client'
import RescheduleForm from './RescheduleForm'
import ManualPrepForm from './ManualPrepForm'

const MANUAL_ENTRIES_KEY = 'bw_manual_prep_entries'

const STATUS_STYLE: Record<BookingStatus, { bg: string; color: string; label: string }> = {
  confirmed:        { bg: '#e8ede3', color: '#3d5240', label: 'Confirmed' },
  pending_payment:  { bg: '#fdf3ec', color: '#6b4423', label: 'Pending payment' },
  cancelled:        { bg: '#fde8e8', color: '#7a2020', label: 'Cancelled' },
  expired:          { bg: '#eee', color: '#7a7268', label: 'Expired' },
}

function dollars(cents: number) {
  return `$${(cents / 100).toFixed(0)}`
}

// A unified shape for both DB bookings and localStorage manual entries so the
// list can render them through one component.
type ManualEntry = {
  id: string
  clientName: string
  serviceId: string
  serviceName: string
  servicePrice: number
  addons: Array<{ id: string; name: string; price: number }>
  date: string | null
  time: string | null
  notes: string | null
  prepCompletedAt: string | null
  createdAt: string
}

type QueueItem = {
  source: 'db' | 'manual'
  id: string
  status: BookingStatus | 'manual'
  // For DB bookings, the original Booking is preserved for reschedule/cancel.
  booking?: Booking
  // For manual entries, the unified subset of fields to render.
  manual?: ManualEntry
  // For sorting — YYYY-MM-DD or null (sorted last).
  date: string | null
}

function readManualEntries(): ManualEntry[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(MANUAL_ENTRIES_KEY)
    return raw ? (JSON.parse(raw) as ManualEntry[]) : []
  } catch {
    return []
  }
}

function writeManualEntries(list: ManualEntry[]): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(MANUAL_ENTRIES_KEY, JSON.stringify(list))
  } catch {
    // ignore
  }
}

function DbBookingCard({
  booking,
  onChanged,
}: {
  booking: Booking
  onChanged: () => void
}) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [rescheduling, setRescheduling] = useState(false)
  const style = STATUS_STYLE[booking.status]
  const canModify = booking.status === 'confirmed' || booking.status === 'pending_payment'
  const isPrepped = !!booking.prep_completed_at

  async function doCancel() {
    if (!confirm(`Cancel ${booking.first_name} ${booking.last_name} on ${booking.date} at ${booking.time_slot}?`)) return
    setBusy(true); setErr('')
    try {
      await cancelBooking(booking.id)
      onChanged()
    } catch (e) {
      setErr((e as Error).message)
      setBusy(false)
    }
  }

  return (
    <div style={{ background: '#fff', border: '1px solid #c5cfbe', borderRadius: '4px', padding: '16px', marginBottom: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px', gap: '10px' }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '20px', color: '#3d5240', fontWeight: 500 }}>
            {booking.first_name} {booking.last_name}
          </div>
          <div style={{ fontSize: '13px', color: '#6b4423', marginTop: '2px' }}>{booking.service_name}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end', flexShrink: 0 }}>
          <span style={{ fontSize: '10px', letterSpacing: '1.5px', textTransform: 'uppercase', padding: '4px 10px', borderRadius: '20px', background: style.bg, color: style.color, fontWeight: 600 }}>
            {style.label}
          </span>
          {isPrepped && <span className="prep-prepped-badge">✓ Prepped</span>}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '10px', fontSize: '13px', color: '#7a7268' }}>
        <div>📅 {fmtDate(booking.date)}</div>
        <div>🕐 {booking.time_slot}</div>
        <div>📞 {booking.phone}</div>
        <div>✉️ {booking.email}</div>
        <div>💰 {dollars(booking.total_cents)} ({dollars(booking.deposit_cents)} dep)</div>
        <div>{booking.intake_completed_at ? '📝 Intake done' : '📝 No intake yet'}</div>
      </div>

      {booking.addons.length > 0 && (
        <div style={{ fontSize: '12px', color: '#7a7268', marginBottom: '10px' }}>
          + {booking.addons.map(a => a.name).join(', ')}
        </div>
      )}

      {booking.notes && (
        <div style={{ fontSize: '12px', color: '#7a7268', fontStyle: 'italic', marginBottom: '10px', padding: '8px', background: '#f5f1e8', borderRadius: '3px' }}>
          &ldquo;{booking.notes}&rdquo;
        </div>
      )}

      {err && (
        <div style={{ fontSize: '12px', color: '#7a2020', marginBottom: '8px' }}>{err}</div>
      )}

      {!rescheduling && (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={() => router.push(`/admin/prep/${booking.id}`)}
            disabled={busy}
            style={{ padding: '8px 14px', background: '#3d5240', color: '#faf7ef', border: '1px solid #3d5240', borderRadius: '3px', fontSize: '11px', letterSpacing: '1.5px', textTransform: 'uppercase', cursor: busy ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}
          >
            Prep Sheet
          </button>
          {canModify && (
            <>
              <button
                onClick={() => setRescheduling(true)}
                disabled={busy}
                style={{ padding: '8px 14px', background: 'none', color: '#3d5240', border: '1px solid #c5cfbe', borderRadius: '3px', fontSize: '11px', letterSpacing: '1.5px', textTransform: 'uppercase', cursor: busy ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}
              >
                Reschedule
              </button>
              <button
                onClick={doCancel}
                disabled={busy}
                style={{ padding: '8px 14px', background: 'none', color: '#7a2020', border: '1px solid #f5b8b8', borderRadius: '3px', fontSize: '11px', letterSpacing: '1.5px', textTransform: 'uppercase', cursor: busy ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}
              >
                {busy ? 'Cancelling…' : 'Cancel Booking'}
              </button>
            </>
          )}
        </div>
      )}

      {rescheduling && (
        <RescheduleForm
          booking={booking}
          onCancel={() => setRescheduling(false)}
          onDone={() => { setRescheduling(false); onChanged() }}
        />
      )}
    </div>
  )
}

function ManualEntryCard({
  entry,
  onDelete,
}: {
  entry: ManualEntry
  onDelete: () => void
}) {
  const router = useRouter()
  const isPrepped = !!entry.prepCompletedAt
  const totalDollars =
    entry.servicePrice + entry.addons.reduce((s, a) => s + a.price, 0)

  return (
    <div style={{ background: '#fff', border: '1px solid #c5cfbe', borderRadius: '4px', padding: '16px', marginBottom: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px', gap: '10px' }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '20px', color: '#3d5240', fontWeight: 500 }}>
            {entry.clientName}
          </div>
          <div style={{ fontSize: '13px', color: '#6b4423', marginTop: '2px' }}>{entry.serviceName}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end', flexShrink: 0 }}>
          <span style={{ fontSize: '10px', letterSpacing: '1.5px', textTransform: 'uppercase', padding: '4px 10px', borderRadius: '20px', background: '#ede5d3', color: '#5a3a22', fontWeight: 600 }}>
            Manual
          </span>
          {isPrepped && <span className="prep-prepped-badge">✓ Prepped</span>}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '10px', fontSize: '13px', color: '#7a7268' }}>
        <div>📅 {entry.date ? fmtDate(entry.date) : 'No date'}</div>
        <div>🕐 {entry.time ?? '—'}</div>
        <div>💰 ${totalDollars}</div>
        <div></div>
      </div>

      {entry.addons.length > 0 && (
        <div style={{ fontSize: '12px', color: '#7a7268', marginBottom: '10px' }}>
          + {entry.addons.map(a => a.name).join(', ')}
        </div>
      )}

      {entry.notes && (
        <div style={{ fontSize: '12px', color: '#7a7268', fontStyle: 'italic', marginBottom: '10px', padding: '8px', background: '#f5f1e8', borderRadius: '3px' }}>
          &ldquo;{entry.notes}&rdquo;
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={() => router.push(`/admin/prep/${entry.id}`)}
          style={{ padding: '8px 14px', background: '#3d5240', color: '#faf7ef', border: '1px solid #3d5240', borderRadius: '3px', fontSize: '11px', letterSpacing: '1.5px', textTransform: 'uppercase', cursor: 'pointer', fontFamily: 'inherit' }}
        >
          Prep Sheet
        </button>
        <button
          onClick={() => {
            if (confirm(`Delete manual prep entry for ${entry.clientName}?`)) onDelete()
          }}
          style={{ padding: '8px 14px', background: 'none', color: '#7a2020', border: '1px solid #f5b8b8', borderRadius: '3px', fontSize: '11px', letterSpacing: '1.5px', textTransform: 'uppercase', cursor: 'pointer', fontFamily: 'inherit' }}
        >
          Delete
        </button>
      </div>
    </div>
  )
}

export default function BookingsTab({
  bookings,
  services,
  addons,
  reload,
}: {
  bookings: Booking[]
  services: ServicesData
  addons: AddonsData
  reload: () => Promise<void>
}) {
  const [filter, setFilter] = useState<'upcoming' | 'all'>('upcoming')
  const [showManualForm, setShowManualForm] = useState(false)
  const [manualEntries, setManualEntries] = useState<ManualEntry[]>([])

  // Hydrate manual entries from localStorage on mount and whenever the user
  // returns to the dashboard (e.g. after creating one).
  useEffect(() => {
    setManualEntries(readManualEntries())
    const onFocus = () => setManualEntries(readManualEntries())
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [])

  const deleteManualEntry = (id: string) => {
    const next = readManualEntries().filter(e => e.id !== id)
    writeManualEntries(next)
    setManualEntries(next)
  }

  const today = new Date(); today.setHours(0, 0, 0, 0)
  const isUpcomingDb = (b: Booking) =>
    (b.status === 'confirmed' || b.status === 'pending_payment') &&
    new Date(b.date + 'T12:00:00') >= today
  const isUpcomingManual = (m: ManualEntry) =>
    !m.prepCompletedAt && (!m.date || new Date(m.date + 'T12:00:00') >= today)

  // Build a unified queue. Hide expired DB bookings — they hold no slot.
  const queueItems: QueueItem[] = [
    ...bookings
      .filter(b => b.status !== 'expired')
      .map<QueueItem>(b => ({
        source: 'db',
        id: b.id,
        status: b.status,
        booking: b,
        date: b.date,
      })),
    ...manualEntries.map<QueueItem>(m => ({
      source: 'manual',
      id: m.id,
      status: 'manual',
      manual: m,
      date: m.date,
    })),
  ]

  const filtered = queueItems
    .filter(item => {
      if (filter === 'all') return true
      if (item.source === 'db' && item.booking) return isUpcomingDb(item.booking)
      if (item.source === 'manual' && item.manual) return isUpcomingManual(item.manual)
      return false
    })
    .sort((a, b) => {
      // null dates sort last; ascending for 'upcoming', descending for 'all'.
      if (!a.date && !b.date) return 0
      if (!a.date) return 1
      if (!b.date) return -1
      const cmp = a.date.localeCompare(b.date)
      return filter === 'upcoming' ? cmp : -cmp
    })

  const upcomingCount =
    bookings.filter(isUpcomingDb).length + manualEntries.filter(isUpcomingManual).length

  return (
    <>
      <Label>Bookings {upcomingCount > 0 && `(${upcomingCount} upcoming)`}</Label>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
        {(['upcoming', 'all'] as const).map(t => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            style={{ padding: '7px 16px', border: 'none', borderRadius: '20px', fontSize: '12px', letterSpacing: '1.5px', textTransform: 'uppercase', cursor: 'pointer', fontFamily: 'inherit', background: filter === t ? '#3d5240' : '#e8ede3', color: filter === t ? '#faf7ef' : '#7a7268', fontWeight: filter === t ? 600 : 400 }}
          >
            {t === 'upcoming' ? 'Upcoming' : 'All'}
          </button>
        ))}
        <button
          onClick={() => setShowManualForm(v => !v)}
          style={{ marginLeft: 'auto', padding: '7px 16px', border: '1px solid #c5cfbe', borderRadius: '20px', fontSize: '12px', letterSpacing: '1.5px', textTransform: 'uppercase', cursor: 'pointer', fontFamily: 'inherit', background: showManualForm ? '#e8ede3' : '#fff', color: '#3d5240', fontWeight: 500 }}
        >
          {showManualForm ? '× Close' : '+ Manual Prep'}
        </button>
      </div>

      {showManualForm && (
        <ManualPrepForm
          services={services}
          addons={addons}
          onCancel={() => setShowManualForm(false)}
        />
      )}

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '32px', color: '#7a7268', fontSize: '14px', fontStyle: 'italic' }}>
          No {filter === 'upcoming' ? 'upcoming ' : ''}bookings.
        </div>
      )}

      {filtered.map(item =>
        item.source === 'db' && item.booking ? (
          <DbBookingCard key={item.id} booking={item.booking} onChanged={reload} />
        ) : item.source === 'manual' && item.manual ? (
          <ManualEntryCard
            key={item.id}
            entry={item.manual}
            onDelete={() => deleteManualEntry(item.id)}
          />
        ) : null,
      )}

      <div style={{ paddingBottom: '48px' }} />
    </>
  )
}
