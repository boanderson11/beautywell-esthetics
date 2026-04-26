'use client'

import { useEffect, useState } from 'react'
import type { Booking } from './types'
import { fmtDate, slotsForDay, toISO } from './cal-helpers'
import { loadAvailability, rescheduleBooking, type Availability } from './api-client'

export default function RescheduleForm({
  booking,
  onDone,
  onCancel,
}: {
  booking: Booking;
  onDone: () => void;
  onCancel: () => void;
}) {
  // Default to today (or today+1 if today's slots are gone — keep it simple).
  const [date, setDate] = useState(() => toISO(new Date()))
  const [time, setTime] = useState('')
  const [availability, setAvailability] = useState<Availability | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => {
    loadAvailability().then(setAvailability).catch(() => setErr('Could not load availability'))
  }, [])

  // Reset selected time whenever the day changes — yesterday's pick may not be
  // valid on the new day.
  useEffect(() => { setTime('') }, [date])

  const allSlots = slotsForDay(date)
  const dayBlocked = availability?.blockedDates.includes(date) ?? false
  const blockedSlotsForDay = availability?.blockedTimes[date] ?? []
  // Don't treat the booking's own current slot as taken — they're moving away from it.
  const slotIsTaken = (slot: string) =>
    blockedSlotsForDay.includes(slot) && !(date === booking.date && slot === booking.time_slot)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setErr(''); setSubmitting(true)
    try {
      await rescheduleBooking(booking.id, date, time)
      onDone()
    } catch (e2) {
      setErr((e2 as Error).message)
      setSubmitting(false)
    }
  }

  const minDate = toISO(new Date())

  return (
    <form
      onSubmit={submit}
      style={{ background: '#faf7ef', border: '1px solid #c5cfbe', borderRadius: '4px', padding: '14px', marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '10px' }}
    >
      <div style={{ fontSize: '11px', letterSpacing: '1.5px', textTransform: 'uppercase', color: '#6b4423' }}>
        Reschedule · currently {fmtDate(booking.date)} {booking.time_slot}
      </div>

      <div>
        <label style={{ fontSize: '10px', letterSpacing: '1.5px', textTransform: 'uppercase', color: '#7a7268', display: 'block', marginBottom: '4px' }}>
          New Date
        </label>
        <input
          type="date"
          value={date}
          min={minDate}
          onChange={e => setDate(e.target.value)}
          style={{ width: '100%', padding: '10px 12px', border: '1px solid #c5cfbe', borderRadius: '3px', fontSize: '14px', fontFamily: 'Inter,sans-serif', color: '#2a2620', background: '#fff', boxSizing: 'border-box' }}
        />
      </div>

      <div>
        <label style={{ fontSize: '10px', letterSpacing: '1.5px', textTransform: 'uppercase', color: '#7a7268', display: 'block', marginBottom: '4px' }}>
          New Time
        </label>
        {allSlots.length === 0 ? (
          <div style={{ fontSize: '12px', color: '#7a7268', fontStyle: 'italic' }}>
            Studio is closed on this day.
          </div>
        ) : dayBlocked ? (
          <div style={{ fontSize: '12px', color: '#7a7268', fontStyle: 'italic' }}>
            This day is blocked. Pick a different date or unblock it in the Calendar tab.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
            {allSlots.map(slot => {
              const taken = slotIsTaken(slot)
              const selected = time === slot
              return (
                <button
                  key={slot}
                  type="button"
                  disabled={taken}
                  onClick={() => setTime(slot)}
                  style={{
                    padding: '8px 4px', textAlign: 'center', fontSize: '12px',
                    borderRadius: '3px', cursor: taken ? 'not-allowed' : 'pointer',
                    border: `1px solid ${selected ? '#3d5240' : '#c5cfbe'}`,
                    background: taken ? '#eee' : selected ? '#3d5240' : '#fff',
                    color: taken ? '#aaa' : selected ? '#faf7ef' : '#2a2620',
                    fontWeight: selected ? 600 : 400,
                    fontFamily: 'inherit',
                  }}
                >
                  {slot}{taken && ' ·'}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {err && (
        <div style={{ padding: '8px 12px', background: '#fde8e8', color: '#7a2020', border: '1px solid #f5b8b8', borderRadius: '3px', fontSize: '12px' }}>
          {err}
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          type="button"
          onClick={onCancel}
          style={{ flex: 1, padding: '10px', background: 'none', color: '#7a7268', border: '1px solid #c5cfbe', borderRadius: '3px', fontSize: '11px', letterSpacing: '1.5px', textTransform: 'uppercase', cursor: 'pointer', fontFamily: 'inherit' }}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting || !time}
          style={{ flex: 1, padding: '10px', background: submitting || !time ? '#869a7e' : '#3d5240', color: '#faf7ef', border: 'none', borderRadius: '3px', fontSize: '11px', letterSpacing: '1.5px', textTransform: 'uppercase', cursor: submitting || !time ? 'not-allowed' : 'pointer', fontFamily: 'inherit', fontWeight: 500 }}
        >
          {submitting ? 'Saving…' : 'Confirm Reschedule'}
        </button>
      </div>
    </form>
  )
}
