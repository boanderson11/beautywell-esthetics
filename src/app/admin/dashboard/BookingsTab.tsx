'use client'

import { useState } from 'react'
import type { Booking, BookingStatus } from './types'
import { Label } from './ui'
import { fmtDate } from './cal-helpers'
import { cancelBooking } from './api-client'
import RescheduleForm from './RescheduleForm'

const STATUS_STYLE: Record<BookingStatus, { bg: string; color: string; label: string }> = {
  confirmed:        { bg: '#e8ede3', color: '#3d5240', label: 'Confirmed' },
  pending_payment:  { bg: '#fdf3ec', color: '#6b4423', label: 'Pending payment' },
  cancelled:        { bg: '#fde8e8', color: '#7a2020', label: 'Cancelled' },
  expired:          { bg: '#eee', color: '#7a7268', label: 'Expired' },
}

function dollars(cents: number) {
  return `$${(cents / 100).toFixed(0)}`
}

function BookingCard({ booking, onChanged }: { booking: Booking; onChanged: () => void }) {
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [rescheduling, setRescheduling] = useState(false)
  const style = STATUS_STYLE[booking.status]
  const canModify = booking.status === 'confirmed' || booking.status === 'pending_payment'

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
        <span style={{ fontSize: '10px', letterSpacing: '1.5px', textTransform: 'uppercase', padding: '4px 10px', borderRadius: '20px', background: style.bg, color: style.color, fontWeight: 600, flexShrink: 0 }}>
          {style.label}
        </span>
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

      {canModify && !rescheduling && (
        <div style={{ display: 'flex', gap: '8px' }}>
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

export default function BookingsTab({
  bookings,
  reload,
}: {
  bookings: Booking[];
  reload: () => Promise<void>;
}) {
  const [filter, setFilter] = useState<'upcoming' | 'all'>('upcoming')

  const today = new Date(); today.setHours(0, 0, 0, 0)
  const isUpcoming = (b: Booking) =>
    (b.status === 'confirmed' || b.status === 'pending_payment') &&
    new Date(b.date + 'T12:00:00') >= today

  // Hide expired bookings entirely — they hold no slot and add noise.
  const visible = bookings.filter(b => b.status !== 'expired')
  const filtered = visible
    .filter(b => filter === 'upcoming' ? isUpcoming(b) : true)
    .sort((a, b) => {
      const cmp = a.date.localeCompare(b.date)
      return filter === 'upcoming' ? cmp : -cmp
    })

  const upcomingCount = bookings.filter(isUpcoming).length

  return (
    <>
      <Label>Bookings {upcomingCount > 0 && `(${upcomingCount} upcoming)`}</Label>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
        {(['upcoming', 'all'] as const).map(t => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            style={{ padding: '7px 16px', border: 'none', borderRadius: '20px', fontSize: '12px', letterSpacing: '1.5px', textTransform: 'uppercase', cursor: 'pointer', fontFamily: 'inherit', background: filter === t ? '#3d5240' : '#e8ede3', color: filter === t ? '#faf7ef' : '#7a7268', fontWeight: filter === t ? 600 : 400 }}
          >
            {t === 'upcoming' ? 'Upcoming' : 'All'}
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '32px', color: '#7a7268', fontSize: '14px', fontStyle: 'italic' }}>
          No {filter === 'upcoming' ? 'upcoming ' : ''}bookings.
        </div>
      )}

      {filtered.map(b => <BookingCard key={b.id} booking={b} onChanged={reload} />)}

      <div style={{ paddingBottom: '48px' }} />
    </>
  )
}
