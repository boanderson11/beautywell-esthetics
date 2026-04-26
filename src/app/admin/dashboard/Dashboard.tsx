'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

import type { ServicesData, AddonsData, Settings, CalendarData, Booking } from './types'
import { loadContent, saveContent, loadBookings } from './api-client'

import PricingTab from './PricingTab'
import AddonsTab from './AddonsTab'
import SettingsTab from './SettingsTab'
import CalendarTab from './CalendarTab'
import BookingsTab from './BookingsTab'

type TabKey = 'bookings' | 'pricing' | 'addons' | 'settings' | 'calendar'

export default function Dashboard({ adminEmail }: { adminEmail: string }) {
  const router = useRouter()
  const [tab, setTab] = useState<TabKey>('bookings')

  const [services, setServices] = useState<ServicesData | null>(null)
  const [addons, setAddons] = useState<AddonsData | null>(null)
  const [settings, setSettings] = useState<Settings | null>(null)
  const [cal, setCal] = useState<CalendarData | null>(null)
  const [bookings, setBookings] = useState<Booking[] | null>(null)
  const [loading, setLoading] = useState(true)

  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')
  const [calSaving, setCalSaving] = useState(false)
  const [calMsg, setCalMsg] = useState('')

  const reload = useCallback(async () => {
    setLoading(true)
    try {
      const [s, a, st, c, b] = await Promise.all([
        loadContent<ServicesData>('services'),
        loadContent<AddonsData>('addons'),
        loadContent<Settings>('settings'),
        loadContent<CalendarData>('calendar'),
        loadBookings<Booking[]>(),
      ])
      setServices(s); setAddons(a); setSettings(st); setCal(c); setBookings(b)
    } catch (e) {
      console.error('[dashboard] load failed', e)
    }
    setLoading(false)
  }, [])

  useEffect(() => { reload() }, [reload])

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.replace('/admin/login')
    router.refresh()
  }

  async function savePricing() {
    if (!services) return
    setSaving(true); setSaveMsg('')
    try {
      await saveContent('services', services)
      setSaveMsg('✓ Saved')
    } catch { setSaveMsg('Save failed. Please try again.') }
    setSaving(false)
  }

  async function saveAddons() {
    if (!addons) return
    setSaving(true); setSaveMsg('')
    try {
      await saveContent('addons', addons)
      setSaveMsg('✓ Saved')
    } catch { setSaveMsg('Save failed. Please try again.') }
    setSaving(false)
  }

  async function saveSettings() {
    if (!settings) return
    setSaving(true); setSaveMsg('')
    try {
      await saveContent('settings', settings)
      setSaveMsg('✓ Saved')
    } catch { setSaveMsg('Save failed. Please try again.') }
    setSaving(false)
  }

  async function saveCalendar(data: CalendarData) {
    setCalSaving(true); setCalMsg('')
    try {
      await saveContent('calendar', data)
      setCalMsg('✓ Saved')
      setTimeout(() => setCalMsg(''), 2000)
    } catch { setCalMsg('Save failed') }
    setCalSaving(false)
  }

  // Reset save message when switching tabs.
  useEffect(() => { setSaveMsg('') }, [tab])

  const TABS: Array<{ key: TabKey; label: string }> = [
    { key: 'bookings', label: 'Bookings' },
    { key: 'pricing',  label: 'Pricing'  },
    { key: 'addons',   label: 'Add-Ons'  },
    { key: 'settings', label: 'Settings' },
    { key: 'calendar', label: 'Calendar' },
  ]

  const upcomingCount = bookings?.filter(b => {
    const today = new Date(); today.setHours(0, 0, 0, 0)
    return (b.status === 'confirmed' || b.status === 'pending_payment') &&
      new Date(b.date + 'T12:00:00') >= today
  }).length ?? 0

  return (
    <div style={{ background: '#f5f1e8', minHeight: '100vh', fontFamily: 'Inter,sans-serif' }}>
      <div style={{ background: '#3d5240', color: '#faf7ef', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 10 }}>
        <div>
          <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '22px', fontWeight: 500 }}>
            Beautywell <span style={{ fontFamily: "'Great Vibes',cursive", color: '#8a6a4a', fontStyle: 'normal', fontSize: '30px', verticalAlign: 'middle', letterSpacing: 0 }}>Esthetics</span>
          </span>
          <span style={{ fontSize: '11px', color: 'rgba(197,207,190,0.75)', letterSpacing: '1.5px', textTransform: 'uppercase', marginLeft: '10px' }}>
            {adminEmail}
          </span>
        </div>
        <button onClick={logout}
          style={{ background: 'none', border: '1px solid rgba(197,207,190,0.35)', color: 'rgba(197,207,190,0.8)', padding: '7px 13px', fontSize: '11px', letterSpacing: '1.5px', textTransform: 'uppercase', cursor: 'pointer', borderRadius: '3px', fontFamily: 'inherit' }}>
          Log Out
        </button>
      </div>

      <div style={{ display: 'flex', background: '#fff', borderBottom: '2px solid #c5cfbe' }}>
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{ flex: 1, padding: '13px 2px', border: 'none', background: 'none', fontSize: '10px', letterSpacing: '1.8px', textTransform: 'uppercase', cursor: 'pointer', fontFamily: 'inherit', fontWeight: tab === t.key ? 600 : 400, color: tab === t.key ? '#3d5240' : '#7a7268', borderBottom: tab === t.key ? '2px solid #3d5240' : '2px solid transparent', marginBottom: '-2px', transition: 'all 0.15s', position: 'relative' }}
          >
            {t.label}
            {t.key === 'bookings' && upcomingCount > 0 && (
              <span style={{ position: 'absolute', top: '8px', right: '4px', background: '#6b4423', color: '#fff', borderRadius: '50%', width: '16px', height: '16px', fontSize: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                {upcomingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      <div style={{ padding: '20px 16px', maxWidth: '560px', margin: '0 auto' }}>
        {loading && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#7a7268', fontSize: '14px' }}>Loading…</div>
        )}

        {!loading && tab === 'bookings' && bookings && (
          <BookingsTab bookings={bookings} reload={reload} />
        )}

        {!loading && tab === 'pricing' && services && (
          <PricingTab
            services={services}
            setServices={u => setServices(s => s && u(s))}
            onSave={savePricing}
            saving={saving}
            message={saveMsg}
          />
        )}

        {!loading && tab === 'addons' && addons && (
          <AddonsTab
            addons={addons}
            setAddons={u => setAddons(a => a && u(a))}
            onSave={saveAddons}
            saving={saving}
            message={saveMsg}
          />
        )}

        {!loading && tab === 'settings' && settings && (
          <SettingsTab
            settings={settings}
            setSettings={u => setSettings(s => s && u(s))}
            onSave={saveSettings}
            saving={saving}
            message={saveMsg}
          />
        )}

        {!loading && tab === 'calendar' && cal && bookings && (
          <CalendarTab
            cal={cal}
            setCal={setCal}
            bookings={bookings}
            saveCalendar={saveCalendar}
            saving={calSaving}
            message={calMsg}
          />
        )}
      </div>
    </div>
  )
}
