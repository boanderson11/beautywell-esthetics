'use client'

import { useState } from 'react'
import type { CalendarData, Booking } from './types'
import { Label } from './ui'
import { MONTH_NAMES, fmtDate, slotsForDay, toISO } from './cal-helpers'

export default function CalendarTab({
  cal,
  setCal,
  bookings,
  saveCalendar,
  saving,
  message,
}: {
  cal: CalendarData;
  setCal: (data: CalendarData) => void;
  bookings: Booking[];
  saveCalendar: (data: CalendarData) => Promise<void>;
  saving: boolean;
  message: string;
}) {
  const [adminMonth, setAdminMonth] = useState(() => { const d = new Date(); d.setDate(1); return d })
  const [selDay, setSelDay] = useState<string | null>(null)

  // Treat any booking that holds a slot (pending_payment / confirmed) as "active".
  const isActive = (b: Booking) => b.status === 'pending_payment' || b.status === 'confirmed'

  const toggleBlockDay = async (iso: string) => {
    const cur = cal.blockedDates
    const next = cur.includes(iso) ? cur.filter(d => d !== iso) : [...cur, iso]
    const newData = { ...cal, blockedDates: next }
    setCal(newData)
    await saveCalendar(newData)
  }

  const toggleBlockTime = async (iso: string, slot: string) => {
    const cur = cal.blockedTimes[iso] ?? []
    const next = cur.includes(slot) ? cur.filter(s => s !== slot) : [...cur, slot]
    const newTimes = { ...cal.blockedTimes, [iso]: next }
    if (next.length === 0) delete newTimes[iso]
    const newData = { ...cal, blockedTimes: newTimes }
    setCal(newData)
    await saveCalendar(newData)
  }

  const buildDays = () => {
    const y = adminMonth.getFullYear(), m = adminMonth.getMonth()
    const firstDay = new Date(y, m, 1).getDay()
    const daysInMonth = new Date(y, m + 1, 0).getDate()
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const days: Array<{ iso: string; day: number; past: boolean; unavailable: boolean; blocked: boolean; hasBooking: boolean } | null> = []
    for (let i = 0; i < firstDay; i++) days.push(null)
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(y, m, d)
      const dow = date.getDay()
      const iso = toISO(date)
      const unavailable = dow === 0 || dow === 1
      const blocked = cal.blockedDates.includes(iso)
      const hasBooking = bookings.some(b => b.date === iso && isActive(b))
      days.push({ iso, day: d, past: date < today, unavailable, blocked, hasBooking })
    }
    return days
  }

  const selDaySlots = selDay ? slotsForDay(selDay) : []
  const selDayBlockedTimes = selDay ? (cal.blockedTimes[selDay] ?? []) : []
  const selDayBlocked = selDay ? cal.blockedDates.includes(selDay) : false
  const selDayBookings = selDay ? bookings.filter(b => b.date === selDay && isActive(b)) : []

  return (
    <>
      {/* Month header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <button onClick={() => setAdminMonth(m => { const n = new Date(m); n.setMonth(n.getMonth() - 1); return n })}
          style={{ background: 'none', border: '1px solid #c5cfbe', borderRadius: '3px', width: '36px', height: '36px', cursor: 'pointer', fontSize: '18px', color: '#3d5240' }}>‹</button>
        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '22px', color: '#3d5240', fontWeight: 500 }}>
          {MONTH_NAMES[adminMonth.getMonth()]} {adminMonth.getFullYear()}
        </div>
        <button onClick={() => setAdminMonth(m => { const n = new Date(m); n.setMonth(n.getMonth() + 1); return n })}
          style={{ background: 'none', border: '1px solid #c5cfbe', borderRadius: '3px', width: '36px', height: '36px', cursor: 'pointer', fontSize: '18px', color: '#3d5240' }}>›</button>
      </div>

      {/* Calendar grid */}
      <div style={{ background: '#fff', border: '1px solid #c5cfbe', borderRadius: '4px', padding: '16px', marginBottom: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: '4px', marginBottom: '8px' }}>
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
            <div key={i} style={{ textAlign: 'center', fontSize: '10px', letterSpacing: '1px', color: '#7a7268', padding: '4px 0', textTransform: 'uppercase' }}>{d}</div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: '4px' }}>
          {buildDays().map((day, i) => {
            if (!day) return <div key={i} />
            const isSelected = selDay === day.iso
            const bg = isSelected ? '#3d5240' : day.blocked ? 'rgba(107,68,35,0.12)' : day.unavailable || day.past ? 'transparent' : '#faf7ef'
            const color = isSelected ? '#faf7ef' : day.unavailable || day.past ? '#c5cfbe' : day.blocked ? '#6b4423' : '#2a2620'
            return (
              <div
                key={i}
                onClick={() => !day.unavailable && !day.past && setSelDay(isSelected ? null : day.iso)}
                style={{ aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '3px', fontSize: '14px', fontWeight: 500, cursor: day.unavailable || day.past ? 'default' : 'pointer', background: bg, color, border: isSelected ? 'none' : '1px solid transparent', position: 'relative', transition: 'all 0.15s' }}
              >
                {day.day}
                {day.hasBooking && !isSelected && (
                  <div style={{ position: 'absolute', bottom: '3px', left: '50%', transform: 'translateX(-50%)', width: '4px', height: '4px', borderRadius: '50%', background: '#6b4423' }} />
                )}
              </div>
            )
          })}
        </div>
        <div style={{ display: 'flex', gap: '16px', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #c5cfbe', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#7a7268' }}>
            <div style={{ width: '12px', height: '12px', background: 'rgba(107,68,35,0.12)', borderRadius: '2px' }} /> Blocked
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#7a7268' }}>
            <div style={{ width: '8px', height: '8px', background: '#6b4423', borderRadius: '50%' }} /> Has booking
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#7a7268' }}>
            <div style={{ width: '12px', height: '12px', background: '#3d5240', borderRadius: '2px' }} /> Selected
          </div>
        </div>
      </div>

      {/* Selected day detail */}
      {selDay && (
        <div style={{ background: '#fff', border: '1px solid #c5cfbe', borderRadius: '4px', padding: '16px', marginBottom: '16px' }}>
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '20px', color: '#3d5240', marginBottom: '14px', fontWeight: 500 }}>
            {fmtDate(selDay)}
          </div>

          <div
            onClick={() => toggleBlockDay(selDay)}
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', border: '1px solid #c5cfbe', borderRadius: '3px', cursor: 'pointer', marginBottom: '12px', background: selDayBlocked ? 'rgba(107,68,35,0.06)' : '#faf7ef' }}
          >
            <span style={{ fontSize: '14px', color: '#2a2620', fontWeight: 500 }}>Block entire day</span>
            <div style={{ width: '44px', height: '24px', borderRadius: '12px', background: selDayBlocked ? '#6b4423' : '#c5cfbe', position: 'relative', transition: 'background 0.2s' }}>
              <div style={{ position: 'absolute', top: '3px', left: selDayBlocked ? '23px' : '3px', width: '18px', height: '18px', borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
            </div>
          </div>

          {!selDayBlocked && selDaySlots.length > 0 && (
            <>
              <div style={{ fontSize: '10px', letterSpacing: '2px', textTransform: 'uppercase', color: '#7a7268', marginBottom: '10px' }}>Block specific times</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px' }}>
                {selDaySlots.map(slot => {
                  const isBlocked = selDayBlockedTimes.includes(slot)
                  const hasBookingAtSlot = selDayBookings.some(b => b.time_slot === slot)
                  return (
                    <div
                      key={slot}
                      onClick={() => toggleBlockTime(selDay, slot)}
                      style={{ padding: '10px 4px', textAlign: 'center', fontSize: '13px', borderRadius: '3px', cursor: 'pointer', border: `1px solid ${isBlocked ? '#6b4423' : '#c5cfbe'}`, background: isBlocked ? 'rgba(107,68,35,0.08)' : '#faf7ef', color: isBlocked ? '#6b4423' : '#2a2620', fontWeight: isBlocked ? 600 : 400, position: 'relative' }}
                    >
                      {slot}
                      {hasBookingAtSlot && <div style={{ position: 'absolute', top: '4px', right: '4px', width: '5px', height: '5px', borderRadius: '50%', background: '#6b4423' }} />}
                    </div>
                  )
                })}
              </div>
            </>
          )}

          {selDayBookings.length > 0 && (
            <>
              <Label style={{ marginTop: '16px' }}>Bookings this day</Label>
              {selDayBookings.map(b => (
                <div key={b.id} style={{ background: '#faf7ef', border: '1px solid #c5cfbe', borderRadius: '4px', padding: '12px', marginBottom: '8px', fontSize: '13px' }}>
                  <div style={{ fontWeight: 600, color: '#3d5240' }}>{b.first_name} {b.last_name} · {b.time_slot}</div>
                  <div style={{ color: '#7a7268', marginTop: '2px' }}>{b.service_name}</div>
                </div>
              ))}
            </>
          )}

          {saving && <div style={{ fontSize: '12px', color: '#7a7268', marginTop: '10px', textAlign: 'center' }}>Saving…</div>}
          {message && <div style={{ fontSize: '12px', color: '#3d5240', marginTop: '10px', textAlign: 'center' }}>{message}</div>}
        </div>
      )}

      <div style={{ paddingBottom: '48px' }} />
    </>
  )
}
