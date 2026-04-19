'use client'

import { useState, useEffect, useCallback } from 'react'

/* ─── Types ────────────────────────────────────────────────── */
type Facial = {
  id: string; name: string; tag?: string; duration: string
  price: number; description: string; benefits?: string[]
}
type Waxing = {
  id: string; name: string; tag?: string; duration: string
  price: number; description: string
}
type Addon = { id: string; name: string; price: number; description: string }
type ServicesData = { facials: Facial[]; waxing: Waxing[] }
type AddonsData = { addons: Addon[] }
type Settings = {
  businessName: string; tagline: string; heroSubtitle: string
  aboutText1: string; aboutText2: string; email: string; phone: string
  location: string; locationNote: string; hoursWeekday: string
  hoursSaturday: string; hoursClosed: string; bookingNote: string
  depositPolicy: string; googleCalendarSrc: string
}
type FileState<T> = { data: T; sha: string }

/* ─── Git Gateway helpers ───────────────────────────────────── */
const GW = '/.netlify/git/github/contents'

async function readGitFile<T>(path: string, token: string): Promise<FileState<T>> {
  const res = await fetch(`${GW}/${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`Read failed: ${path}`)
  const { content, sha } = await res.json()
  return { data: JSON.parse(atob(content.replace(/\n/g, ''))), sha }
}

async function writeGitFile(
  path: string, content: unknown, sha: string, token: string, message: string
) {
  const res = await fetch(`${GW}/${path}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, content: btoa(JSON.stringify(content, null, 2)), sha }),
  })
  if (!res.ok) throw new Error(`Write failed: ${path}`)
  return res.json()
}

/* ─── Sub-components ────────────────────────────────────────── */
function Label({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      fontSize: '10px', letterSpacing: '2.5px', textTransform: 'uppercase',
      color: '#6b4423', marginBottom: '10px', paddingBottom: '8px',
      borderBottom: '1px solid #c5cfbe', ...style,
    }}>
      {children}
    </div>
  )
}

function PriceCard({
  name, sub, price, onChange,
}: { name: string; sub?: string; price: number; onChange: (p: number) => void }) {
  return (
    <div style={{
      background: '#fff', border: '1px solid #c5cfbe', borderRadius: '4px',
      padding: '14px 16px', marginBottom: '10px',
      display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px',
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: "'Cormorant Garamond', serif", fontSize: '18px',
          color: '#3d5240', lineHeight: 1.2,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{name}</div>
        {sub && <div style={{ fontSize: '12px', color: '#7a7268', marginTop: '2px' }}>{sub}</div>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '2px', flexShrink: 0 }}>
        <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '20px', color: '#6b4423' }}>$</span>
        <input
          type="number" inputMode="numeric" value={price}
          onChange={e => onChange(Number(e.target.value))}
          style={{
            width: '76px', padding: '10px 6px', border: '1px solid #c5cfbe',
            borderRadius: '3px', fontSize: '20px',
            fontFamily: "'Cormorant Garamond', serif", color: '#6b4423',
            textAlign: 'center', background: '#faf7ef',
          }}
        />
      </div>
    </div>
  )
}

function Field({
  label, value, onChange, type = 'text', multiline,
}: {
  label: string; value: string; onChange: (v: string) => void
  type?: string; multiline?: boolean
}) {
  const base: React.CSSProperties = {
    width: '100%', padding: '12px 14px', border: '1px solid #c5cfbe',
    borderRadius: '3px', fontSize: '15px', fontFamily: 'Inter, sans-serif',
    color: '#2a2620', background: '#fff', boxSizing: 'border-box',
  }
  return (
    <div style={{ marginBottom: '16px' }}>
      <label style={{
        fontSize: '10px', letterSpacing: '1.5px', textTransform: 'uppercase',
        color: '#7a7268', display: 'block', marginBottom: '6px',
      }}>
        {label}
      </label>
      {multiline
        ? <textarea value={value} onChange={e => onChange(e.target.value)}
            rows={3} style={{ ...base, resize: 'vertical', minHeight: '80px', lineHeight: 1.6 }} />
        : <input type={type} value={value} onChange={e => onChange(e.target.value)} style={base} />}
    </div>
  )
}

/* ─── Login screen ──────────────────────────────────────────── */
function LoginScreen() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: '#f5f1e8', padding: '24px',
    }}>
      <div style={{ textAlign: 'center', width: '100%', maxWidth: '320px' }}>
        <div style={{
          fontFamily: "'Cormorant Garamond', serif", fontSize: '36px',
          color: '#3d5240', marginBottom: '4px', fontWeight: 300,
        }}>
          Beautywell<span style={{ color: '#6b4423', fontStyle: 'italic' }}>.</span>
        </div>
        <div style={{
          fontSize: '11px', color: '#7a7268', letterSpacing: '3px',
          textTransform: 'uppercase', marginBottom: '40px',
        }}>
          Admin Portal
        </div>
        <button
          onClick={() => (window as any).netlifyIdentity?.open()}
          style={{
            width: '100%', padding: '18px',
            background: '#3d5240', color: '#faf7ef', border: 'none',
            fontSize: '12px', letterSpacing: '2.5px', textTransform: 'uppercase',
            cursor: 'pointer', borderRadius: '3px', fontFamily: 'inherit', fontWeight: 500,
          }}
        >
          Log In
        </button>
      </div>
    </div>
  )
}

/* ─── Main component ────────────────────────────────────────── */
export default function AdminPage() {
  const [user, setUser] = useState<any>(null)
  const [ready, setReady] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')
  const [tab, setTab] = useState<'pricing' | 'addons' | 'settings'>('pricing')

  const [services, setServices] = useState<FileState<ServicesData> | null>(null)
  const [addons, setAddons] = useState<FileState<AddonsData> | null>(null)
  const [settings, setSettings] = useState<FileState<Settings> | null>(null)

  /* Auth setup */
  useEffect(() => {
    const ni = (window as any).netlifyIdentity
    if (!ni) return
    ni.on('init', (u: any) => { setUser(u); setReady(true) })
    ni.on('login', (u: any) => { setUser(u); ni.close() })
    ni.on('logout', () => setUser(null))
    ni.init()
  }, [])

  /* Load content */
  const loadContent = useCallback(async (token: string) => {
    setLoading(true)
    try {
      const [svc, adn, cfg] = await Promise.all([
        readGitFile<ServicesData>('content/services.json', token),
        readGitFile<AddonsData>('content/addons.json', token),
        readGitFile<Settings>('content/settings.json', token),
      ])
      setServices(svc)
      setAddons(adn)
      setSettings(cfg)
    } catch (e) {
      console.error('Load error:', e)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    if (user?.token?.access_token) {
      loadContent(user.token.access_token)
    }
  }, [user, loadContent])

  /* Save */
  const handleSave = async () => {
    if (!user?.token?.access_token || !services || !addons || !settings) return
    setSaving(true)
    setSaveMsg('')
    const token = user.token.access_token
    try {
      await Promise.all([
        writeGitFile('content/services.json', services.data, services.sha, token, 'Update services & pricing'),
        writeGitFile('content/addons.json', addons.data, addons.sha, token, 'Update add-ons'),
        writeGitFile('content/settings.json', settings.data, settings.sha, token, 'Update settings'),
      ])
      setSaveMsg('✓ Saved! Site will update in ~1 minute.')
      await loadContent(token)
    } catch (e) {
      setSaveMsg('Something went wrong. Please try again.')
      console.error(e)
    }
    setSaving(false)
  }

  /* Updaters */
  const setFacialPrice = (id: string, price: number) =>
    setServices(s => s && { ...s, data: { ...s.data, facials: s.data.facials.map(f => f.id === id ? { ...f, price } : f) } })

  const setWaxingPrice = (id: string, price: number) =>
    setServices(s => s && { ...s, data: { ...s.data, waxing: s.data.waxing.map(w => w.id === id ? { ...w, price } : w) } })

  const setAddonPrice = (id: string, price: number) =>
    setAddons(s => s && { ...s, data: { addons: s.data.addons.map(a => a.id === id ? { ...a, price } : a) } })

  const setSetting = (key: keyof Settings, value: string) =>
    setSettings(s => s && { ...s, data: { ...s.data, [key]: value } })

  /* Render */
  if (!ready || (!user && !ready)) return null
  if (!user) return <LoginScreen />

  const TABS = [
    { key: 'pricing', label: 'Pricing' },
    { key: 'addons', label: 'Add-Ons' },
    { key: 'settings', label: 'Settings' },
  ] as const

  return (
    <div style={{ background: '#f5f1e8', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>

      {/* Header */}
      <div style={{
        background: '#3d5240', color: '#faf7ef', padding: '14px 20px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <div>
          <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '22px', fontWeight: 500 }}>
            Beautywell<span style={{ color: '#8a6a4a', fontStyle: 'italic' }}>.</span>
          </span>
          <span style={{ fontSize: '11px', color: 'rgba(197,207,190,0.75)', letterSpacing: '1.5px', textTransform: 'uppercase', marginLeft: '10px' }}>
            Admin
          </span>
        </div>
        <button
          onClick={() => (window as any).netlifyIdentity?.logout()}
          style={{
            background: 'none', border: '1px solid rgba(197,207,190,0.35)',
            color: 'rgba(197,207,190,0.8)', padding: '7px 13px',
            fontSize: '11px', letterSpacing: '1.5px', textTransform: 'uppercase',
            cursor: 'pointer', borderRadius: '3px', fontFamily: 'inherit',
          }}
        >
          Log Out
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', background: '#fff', borderBottom: '2px solid #c5cfbe' }}>
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              flex: 1, padding: '14px 4px', border: 'none', background: 'none',
              fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase',
              cursor: 'pointer', fontFamily: 'inherit', fontWeight: tab === t.key ? 600 : 400,
              color: tab === t.key ? '#3d5240' : '#7a7268',
              borderBottom: tab === t.key ? '2px solid #3d5240' : '2px solid transparent',
              marginBottom: '-2px', transition: 'all 0.15s',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Body */}
      <div style={{ padding: '20px 16px', maxWidth: '560px', margin: '0 auto' }}>

        {loading && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#7a7268', fontSize: '14px' }}>
            Loading…
          </div>
        )}

        {/* ── PRICING ── */}
        {!loading && tab === 'pricing' && services && (
          <>
            <Label>Facials</Label>
            {services.data.facials.map(f => (
              <PriceCard key={f.id} name={f.name} sub={f.duration} price={f.price} onChange={p => setFacialPrice(f.id, p)} />
            ))}
            <Label style={{ marginTop: '24px' }}>Waxing Services</Label>
            {services.data.waxing.map(w => (
              <PriceCard key={w.id} name={w.name} sub={w.duration} price={w.price} onChange={p => setWaxingPrice(w.id, p)} />
            ))}
          </>
        )}

        {/* ── ADD-ONS ── */}
        {!loading && tab === 'addons' && addons && (
          <>
            <Label>Add-On Enhancements</Label>
            {addons.data.addons.map(a => (
              <PriceCard key={a.id} name={a.name} price={a.price} onChange={p => setAddonPrice(a.id, p)} />
            ))}
          </>
        )}

        {/* ── SETTINGS ── */}
        {!loading && tab === 'settings' && settings && (
          <>
            <Label>Business Info</Label>
            <Field label="Business Name" value={settings.data.businessName} onChange={v => setSetting('businessName', v)} />
            <Field label="Tagline" value={settings.data.tagline} onChange={v => setSetting('tagline', v)} />
            <Field label="Email" value={settings.data.email} onChange={v => setSetting('email', v)} type="email" />
            <Field label="Phone" value={settings.data.phone} onChange={v => setSetting('phone', v)} type="tel" />
            <Field label="Location" value={settings.data.location} onChange={v => setSetting('location', v)} />
            <Field label="Location Note" value={settings.data.locationNote} onChange={v => setSetting('locationNote', v)} />

            <Label style={{ marginTop: '24px' }}>Hours</Label>
            <Field label="Weekday Hours" value={settings.data.hoursWeekday} onChange={v => setSetting('hoursWeekday', v)} />
            <Field label="Saturday Hours" value={settings.data.hoursSaturday} onChange={v => setSetting('hoursSaturday', v)} />
            <Field label="Closed Days" value={settings.data.hoursClosed} onChange={v => setSetting('hoursClosed', v)} />

            <Label style={{ marginTop: '24px' }}>Website Copy</Label>
            <Field label="Hero Subtitle" value={settings.data.heroSubtitle} onChange={v => setSetting('heroSubtitle', v)} multiline />
            <Field label="About — Paragraph 1" value={settings.data.aboutText1} onChange={v => setSetting('aboutText1', v)} multiline />
            <Field label="About — Paragraph 2" value={settings.data.aboutText2} onChange={v => setSetting('aboutText2', v)} multiline />
            <Field label="Booking Note" value={settings.data.bookingNote} onChange={v => setSetting('bookingNote', v)} multiline />
            <Field label="Deposit & Cancellation Policy" value={settings.data.depositPolicy} onChange={v => setSetting('depositPolicy', v)} multiline />

            <Label style={{ marginTop: '24px' }}>Calendar</Label>
            <Field label="Google Calendar Embed URL" value={settings.data.googleCalendarSrc || ''} onChange={v => setSetting('googleCalendarSrc', v)} />
          </>
        )}

        {/* Save */}
        {!loading && (
          <div style={{ marginTop: '28px', paddingBottom: '48px' }}>
            {saveMsg && (
              <div style={{
                padding: '12px 16px', borderRadius: '3px', marginBottom: '12px',
                fontSize: '13px', textAlign: 'center',
                background: saveMsg.startsWith('✓') ? '#e8ede3' : '#fde8e8',
                color: saveMsg.startsWith('✓') ? '#3d5240' : '#7a2020',
                border: `1px solid ${saveMsg.startsWith('✓') ? '#c5cfbe' : '#f5b8b8'}`,
              }}>
                {saveMsg}
              </div>
            )}
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                width: '100%', padding: '18px',
                background: saving ? '#869a7e' : '#3d5240',
                color: '#faf7ef', border: 'none', borderRadius: '3px',
                fontSize: '13px', letterSpacing: '2px', textTransform: 'uppercase',
                cursor: saving ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit', fontWeight: 500, transition: 'background 0.2s',
              }}
            >
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
            <p style={{ textAlign: 'center', fontSize: '12px', color: '#7a7268', marginTop: '10px', lineHeight: 1.5 }}>
              Changes go live in ~1 minute after saving.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
