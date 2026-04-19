'use client'

import { useState, useEffect, useCallback } from 'react'

/* ─── Types ────────────────────────────────────────────────── */
type Facial  = { id: string; name: string; tag?: string; duration: string; price: number; description: string; benefits?: string[] }
type Waxing  = { id: string; name: string; tag?: string; duration: string; price: number; description: string }
type Addon   = { id: string; name: string; price: number; description: string }
type ServicesData = { facials: Facial[]; waxing: Waxing[] }
type AddonsData   = { addons: Addon[] }
type Settings = {
  businessName: string; tagline: string; heroSubtitle: string
  aboutText1: string; aboutText2: string; email: string; phone: string
  location: string; locationNote: string; hoursWeekday: string
  hoursSaturday: string; hoursClosed: string; bookingNote: string
  depositPolicy: string; googleCalendarSrc: string
}
type CalendarData = { blockedDates: string[]; blockedTimes: Record<string, string[]> }
type Booking = {
  id: string; createdAt: string; status: 'pending' | 'confirmed' | 'declined'
  firstName: string; lastName: string; email: string; phone: string
  service: string; addons: string[]; date: string; time: string
  total: number; deposit: number; notes?: string
}
type BookingsData = { bookings: Booking[] }
type FileState<T> = { data: T; sha: string }

/* ─── Constants ─────────────────────────────────────────────── */
const WEEKDAY_SLOTS = ['5:30 PM', '6:30 PM', '7:30 PM']
const SATURDAY_SLOTS = ['9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM']
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December']
const GW = '/.netlify/git/github/contents'

/* ─── Git Gateway helpers ───────────────────────────────────── */
async function readGitFile<T>(path: string, token: string): Promise<FileState<T>> {
  const res = await fetch(`${GW}/${path}`, { headers: { Authorization: `Bearer ${token}` } })
  if (!res.ok) throw new Error(`Read failed: ${path}`)
  const { content, sha } = await res.json()
  return { data: JSON.parse(atob(content.replace(/\n/g, ''))), sha }
}
async function writeGitFile(path: string, content: unknown, sha: string, token: string, message: string) {
  const res = await fetch(`${GW}/${path}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, content: btoa(JSON.stringify(content, null, 2)), sha }),
  })
  if (!res.ok) throw new Error(`Write failed: ${path}`)
  return res.json()
}

/* ─── Helpers ───────────────────────────────────────────────── */
function toISO(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}
function fmtDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m-1, d).toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric' })
}
function slotsForDay(iso: string) {
  const dow = new Date(iso + 'T12:00:00').getDay()
  if (dow >= 2 && dow <= 5) return WEEKDAY_SLOTS
  if (dow === 6) return SATURDAY_SLOTS
  return []
}

/* ─── Sub-components ────────────────────────────────────────── */
function Label({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ fontSize:'10px', letterSpacing:'2.5px', textTransform:'uppercase', color:'#6b4423', marginBottom:'10px', paddingBottom:'8px', borderBottom:'1px solid #c5cfbe', ...style }}>
      {children}
    </div>
  )
}
function PriceCard({ name, sub, price, onChange }: { name: string; sub?: string; price: number; onChange: (p: number) => void }) {
  return (
    <div style={{ background:'#fff', border:'1px solid #c5cfbe', borderRadius:'4px', padding:'14px 16px', marginBottom:'10px', display:'flex', justifyContent:'space-between', alignItems:'center', gap:'12px' }}>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'18px', color:'#3d5240', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{name}</div>
        {sub && <div style={{ fontSize:'12px', color:'#7a7268', marginTop:'2px' }}>{sub}</div>}
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:'2px', flexShrink:0 }}>
        <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'20px', color:'#6b4423' }}>$</span>
        <input type="number" inputMode="numeric" value={price} onChange={e => onChange(Number(e.target.value))}
          style={{ width:'76px', padding:'10px 6px', border:'1px solid #c5cfbe', borderRadius:'3px', fontSize:'20px', fontFamily:"'Cormorant Garamond',serif", color:'#6b4423', textAlign:'center', background:'#faf7ef' }} />
      </div>
    </div>
  )
}
function Field({ label, value, onChange, type='text', multiline }: { label:string; value:string; onChange:(v:string)=>void; type?:string; multiline?:boolean }) {
  const base: React.CSSProperties = { width:'100%', padding:'12px 14px', border:'1px solid #c5cfbe', borderRadius:'3px', fontSize:'15px', fontFamily:'Inter,sans-serif', color:'#2a2620', background:'#fff', boxSizing:'border-box' }
  return (
    <div style={{ marginBottom:'16px' }}>
      <label style={{ fontSize:'10px', letterSpacing:'1.5px', textTransform:'uppercase', color:'#7a7268', display:'block', marginBottom:'6px' }}>{label}</label>
      {multiline
        ? <textarea value={value} onChange={e=>onChange(e.target.value)} rows={3} style={{ ...base, resize:'vertical', minHeight:'80px', lineHeight:1.6 }} />
        : <input type={type} value={value} onChange={e=>onChange(e.target.value)} style={base} />}
    </div>
  )
}

/* ─── Login ─────────────────────────────────────────────────── */
function LoginScreen() {
  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#f5f1e8', padding:'24px' }}>
      <div style={{ textAlign:'center', width:'100%', maxWidth:'320px' }}>
        <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'36px', color:'#3d5240', marginBottom:'4px', fontWeight:300 }}>
          Beautywell <span style={{ fontFamily:"'Great Vibes',cursive", color:'#6b4423', fontStyle:'normal', fontSize:'48px', verticalAlign:'middle', letterSpacing:0 }}>Esthetics</span>
        </div>
        <div style={{ fontSize:'11px', color:'#7a7268', letterSpacing:'3px', textTransform:'uppercase', marginBottom:'40px' }}>Admin Portal</div>
        <button onClick={() => (window as any).netlifyIdentity?.open()}
          style={{ width:'100%', padding:'18px', background:'#3d5240', color:'#faf7ef', border:'none', fontSize:'12px', letterSpacing:'2.5px', textTransform:'uppercase', cursor:'pointer', borderRadius:'3px', fontFamily:'inherit', fontWeight:500 }}>
          Log In
        </button>
      </div>
    </div>
  )
}

/* ─── Booking Request Card ──────────────────────────────────── */
function BookingCard({ booking, onStatusChange }: { booking: Booking; onStatusChange: (id: string, status: 'confirmed'|'declined') => void }) {
  const statusColor = booking.status === 'confirmed' ? '#3d5240' : booking.status === 'declined' ? '#7a2020' : '#6b4423'
  const statusBg = booking.status === 'confirmed' ? '#e8ede3' : booking.status === 'declined' ? '#fde8e8' : '#fdf3ec'
  return (
    <div style={{ background:'#fff', border:'1px solid #c5cfbe', borderRadius:'4px', padding:'16px', marginBottom:'12px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'10px' }}>
        <div>
          <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'20px', color:'#3d5240', fontWeight:500 }}>
            {booking.firstName} {booking.lastName}
          </div>
          <div style={{ fontSize:'13px', color:'#6b4423', marginTop:'2px' }}>{booking.service}</div>
        </div>
        <span style={{ fontSize:'10px', letterSpacing:'1.5px', textTransform:'uppercase', padding:'4px 10px', borderRadius:'20px', background:statusBg, color:statusColor, fontWeight:600, flexShrink:0 }}>
          {booking.status}
        </span>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'6px', marginBottom:'10px' }}>
        <div style={{ fontSize:'13px', color:'#7a7268' }}>📅 {fmtDate(booking.date)}</div>
        <div style={{ fontSize:'13px', color:'#7a7268' }}>🕐 {booking.time}</div>
        <div style={{ fontSize:'13px', color:'#7a7268' }}>📞 {booking.phone}</div>
        <div style={{ fontSize:'13px', color:'#7a7268' }}>💰 ${booking.total} (${booking.deposit} dep)</div>
      </div>
      {booking.notes && (
        <div style={{ fontSize:'12px', color:'#7a7268', fontStyle:'italic', marginBottom:'10px', padding:'8px', background:'#f5f1e8', borderRadius:'3px' }}>
          "{booking.notes}"
        </div>
      )}
      {booking.status === 'pending' && (
        <div style={{ display:'flex', gap:'8px' }}>
          <button onClick={() => onStatusChange(booking.id, 'confirmed')}
            style={{ flex:1, padding:'10px', background:'#3d5240', color:'#faf7ef', border:'none', borderRadius:'3px', fontSize:'12px', letterSpacing:'1.5px', textTransform:'uppercase', cursor:'pointer', fontFamily:'inherit', fontWeight:500 }}>
            Confirm
          </button>
          <button onClick={() => onStatusChange(booking.id, 'declined')}
            style={{ flex:1, padding:'10px', background:'none', color:'#7a2020', border:'1px solid #f5b8b8', borderRadius:'3px', fontSize:'12px', letterSpacing:'1.5px', textTransform:'uppercase', cursor:'pointer', fontFamily:'inherit' }}>
            Decline
          </button>
        </div>
      )}
    </div>
  )
}

/* ─── Main ──────────────────────────────────────────────────── */
export default function AdminPage() {
  const [user, setUser]       = useState<any>(null)
  const [ready, setReady]     = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving]   = useState(false)
  const [saveMsg, setSaveMsg] = useState('')
  const [tab, setTab]         = useState<'pricing'|'addons'|'settings'|'calendar'>('pricing')

  // Content
  const [services,  setServices]  = useState<FileState<ServicesData>|null>(null)
  const [addons,    setAddons]    = useState<FileState<AddonsData>|null>(null)
  const [settings,  setSettings]  = useState<FileState<Settings>|null>(null)
  const [calData,   setCalData]   = useState<FileState<CalendarData>|null>(null)
  const [bookings,  setBookings]  = useState<FileState<BookingsData>|null>(null)

  // Calendar UI state
  const [adminMonth, setAdminMonth] = useState(() => { const d = new Date(); d.setDate(1); return d })
  const [selDay, setSelDay]         = useState<string|null>(null)
  const [calSaving, setCalSaving]   = useState(false)
  const [calMsg, setCalMsg]         = useState('')
  const [bookingsTab, setBookingsTab] = useState<'pending'|'all'>('pending')

  /* Auth */
  useEffect(() => {
    const ni = (window as any).netlifyIdentity
    if (!ni) return
    ni.on('init',   (u: any) => { setUser(u); setReady(true) })
    ni.on('login',  (u: any) => { setUser(u); ni.close() })
    ni.on('logout', () => setUser(null))
    ni.init()
  }, [])

  /* Load */
  const loadContent = useCallback(async (token: string) => {
    setLoading(true)
    try {
      const [svc, adn, cfg, cal, bks] = await Promise.all([
        readGitFile<ServicesData>('content/services.json', token),
        readGitFile<AddonsData>('content/addons.json', token),
        readGitFile<Settings>('content/settings.json', token),
        readGitFile<CalendarData>('content/calendar.json', token),
        readGitFile<BookingsData>('content/bookings.json', token),
      ])
      setServices(svc); setAddons(adn); setSettings(cfg); setCalData(cal); setBookings(bks)
    } catch (e) { console.error('Load error:', e) }
    setLoading(false)
  }, [])

  useEffect(() => {
    if (user?.token?.access_token) loadContent(user.token.access_token)
  }, [user, loadContent])

  /* Save pricing/addons/settings */
  const handleSave = async () => {
    if (!user?.token?.access_token || !services || !addons || !settings) return
    setSaving(true); setSaveMsg('')
    const token = user.token.access_token
    try {
      await Promise.all([
        writeGitFile('content/services.json', services.data, services.sha, token, 'Update services & pricing'),
        writeGitFile('content/addons.json',   addons.data,   addons.sha,   token, 'Update add-ons'),
        writeGitFile('content/settings.json', settings.data, settings.sha, token, 'Update settings'),
      ])
      setSaveMsg('✓ Saved! Site updates in ~1 minute.')
      await loadContent(token)
    } catch { setSaveMsg('Something went wrong. Please try again.') }
    setSaving(false)
  }

  /* Save calendar */
  const saveCalendar = async (data: CalendarData) => {
    if (!user?.token?.access_token || !calData) return
    setCalSaving(true); setCalMsg('')
    try {
      const result = await writeGitFile('content/calendar.json', data, calData.sha, user.token.access_token, 'Update blocked dates')
      setCalData({ data, sha: result.content.sha })
      setCalMsg('✓ Saved')
      setTimeout(() => setCalMsg(''), 2500)
    } catch { setCalMsg('Error saving') }
    setCalSaving(false)
  }

  /* Toggle block entire day */
  const toggleBlockDay = (iso: string) => {
    if (!calData) return
    const cur = calData.data.blockedDates
    const next = cur.includes(iso) ? cur.filter(d => d !== iso) : [...cur, iso]
    const newData = { ...calData.data, blockedDates: next }
    setCalData({ ...calData, data: newData })
    saveCalendar(newData)
  }

  /* Toggle block a specific time slot */
  const toggleBlockTime = (iso: string, slot: string) => {
    if (!calData) return
    const cur = calData.data.blockedTimes[iso] ?? []
    const next = cur.includes(slot) ? cur.filter(s => s !== slot) : [...cur, slot]
    const newTimes = { ...calData.data.blockedTimes, [iso]: next }
    if (next.length === 0) delete newTimes[iso]
    const newData = { ...calData.data, blockedTimes: newTimes }
    setCalData({ ...calData, data: newData })
    saveCalendar(newData)
  }

  /* Update booking status */
  const updateBookingStatus = async (id: string, status: 'confirmed'|'declined') => {
    if (!user?.token?.access_token || !bookings) return
    const updated = bookings.data.bookings.map(b => b.id === id ? { ...b, status } : b)
    const newData = { bookings: updated }
    try {
      const result = await writeGitFile('content/bookings.json', newData, bookings.sha, user.token.access_token, `Booking ${status}: ${id}`)
      setBookings({ data: newData, sha: result.content.sha })

      // If confirming, also block that time slot
      if (status === 'confirmed') {
        const bk = bookings.data.bookings.find(b => b.id === id)
        if (bk && calData) {
          const cur = calData.data.blockedTimes[bk.date] ?? []
          if (!cur.includes(bk.time)) {
            const newTimes = { ...calData.data.blockedTimes, [bk.date]: [...cur, bk.time] }
            const newCal = { ...calData.data, blockedTimes: newTimes }
            await writeGitFile('content/calendar.json', newCal, calData.sha, user.token.access_token, `Block confirmed slot ${bk.date} ${bk.time}`)
            setCalData({ ...calData, data: newCal })
          }
        }
      }
    } catch (e) { console.error(e) }
  }

  /* Calendar grid builder */
  const buildAdminCalDays = () => {
    const y = adminMonth.getFullYear(), m = adminMonth.getMonth()
    const firstDay = new Date(y, m, 1).getDay()
    const daysInMonth = new Date(y, m+1, 0).getDate()
    const today = new Date(); today.setHours(0,0,0,0)
    const days: Array<{ iso: string; day: number; past: boolean; unavailable: boolean; blocked: boolean; hasBooking: boolean }|null> = []
    for (let i = 0; i < firstDay; i++) days.push(null)
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(y, m, d)
      const dow  = date.getDay()
      const iso  = toISO(date)
      const unavailable = dow === 0 || dow === 1
      const blocked = calData?.data.blockedDates.includes(iso) ?? false
      const hasBooking = bookings?.data.bookings.some(b => b.date === iso && b.status !== 'declined') ?? false
      days.push({ iso, day: d, past: date < today, unavailable, blocked, hasBooking })
    }
    return days
  }

  /* Updaters */
  const setFacialPrice = (id: string, price: number) =>
    setServices(s => s && { ...s, data: { ...s.data, facials: s.data.facials.map(f => f.id===id ? {...f,price} : f) } })
  const setWaxingPrice = (id: string, price: number) =>
    setServices(s => s && { ...s, data: { ...s.data, waxing: s.data.waxing.map(w => w.id===id ? {...w,price} : w) } })
  const setAddonPrice  = (id: string, price: number) =>
    setAddons(s => s && { ...s, data: { addons: s.data.addons.map(a => a.id===id ? {...a,price} : a) } })
  const setSetting = (key: keyof Settings, value: string) =>
    setSettings(s => s && { ...s, data: { ...s.data, [key]: value } })

  if (!ready) return null
  if (!user)  return <LoginScreen />

  const TABS = [
    { key: 'pricing',  label: 'Pricing'   },
    { key: 'addons',   label: 'Add-Ons'   },
    { key: 'settings', label: 'Settings'  },
    { key: 'calendar', label: 'Calendar'  },
  ] as const

  const pendingCount = bookings?.data.bookings.filter(b => b.status==='pending').length ?? 0
  const selDaySlots  = selDay ? slotsForDay(selDay) : []
  const selDayBlockedTimes = selDay ? (calData?.data.blockedTimes[selDay] ?? []) : []
  const selDayBlocked = selDay ? (calData?.data.blockedDates.includes(selDay) ?? false) : false
  const selDayBookings = selDay ? (bookings?.data.bookings.filter(b => b.date===selDay) ?? []) : []

  return (
    <div style={{ background:'#f5f1e8', minHeight:'100vh', fontFamily:'Inter,sans-serif' }}>

      {/* Header */}
      <div style={{ background:'#3d5240', color:'#faf7ef', padding:'14px 20px', display:'flex', justifyContent:'space-between', alignItems:'center', position:'sticky', top:0, zIndex:10 }}>
        <div>
          <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'22px', fontWeight:500 }}>
            Beautywell <span style={{ fontFamily:"'Great Vibes',cursive", color:'#8a6a4a', fontStyle:'normal', fontSize:'30px', verticalAlign:'middle', letterSpacing:0 }}>Esthetics</span>
          </span>
          <span style={{ fontSize:'11px', color:'rgba(197,207,190,0.75)', letterSpacing:'1.5px', textTransform:'uppercase', marginLeft:'10px' }}>Admin</span>
        </div>
        <button onClick={() => (window as any).netlifyIdentity?.logout()}
          style={{ background:'none', border:'1px solid rgba(197,207,190,0.35)', color:'rgba(197,207,190,0.8)', padding:'7px 13px', fontSize:'11px', letterSpacing:'1.5px', textTransform:'uppercase', cursor:'pointer', borderRadius:'3px', fontFamily:'inherit' }}>
          Log Out
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', background:'#fff', borderBottom:'2px solid #c5cfbe' }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{ flex:1, padding:'13px 2px', border:'none', background:'none', fontSize:'10px', letterSpacing:'1.8px', textTransform:'uppercase', cursor:'pointer', fontFamily:'inherit', fontWeight:tab===t.key ? 600 : 400, color:tab===t.key ? '#3d5240' : '#7a7268', borderBottom:tab===t.key ? '2px solid #3d5240' : '2px solid transparent', marginBottom:'-2px', transition:'all 0.15s', position:'relative' }}>
            {t.label}
            {t.key==='calendar' && pendingCount > 0 && (
              <span style={{ position:'absolute', top:'8px', right:'4px', background:'#6b4423', color:'#fff', borderRadius:'50%', width:'16px', height:'16px', fontSize:'9px', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700 }}>
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Body */}
      <div style={{ padding:'20px 16px', maxWidth:'560px', margin:'0 auto' }}>

        {loading && <div style={{ textAlign:'center', padding:'60px 0', color:'#7a7268', fontSize:'14px' }}>Loading…</div>}

        {/* ── PRICING ── */}
        {!loading && tab==='pricing' && services && (
          <>
            <Label>Facials</Label>
            {services.data.facials.map(f => <PriceCard key={f.id} name={f.name} sub={f.duration} price={f.price} onChange={p=>setFacialPrice(f.id,p)} />)}
            <Label style={{ marginTop:'24px' }}>Waxing Services</Label>
            {services.data.waxing.map(w => <PriceCard key={w.id} name={w.name} sub={w.duration} price={w.price} onChange={p=>setWaxingPrice(w.id,p)} />)}
          </>
        )}

        {/* ── ADD-ONS ── */}
        {!loading && tab==='addons' && addons && (
          <>
            <Label>Add-On Enhancements</Label>
            {addons.data.addons.map(a => <PriceCard key={a.id} name={a.name} price={a.price} onChange={p=>setAddonPrice(a.id,p)} />)}
          </>
        )}

        {/* ── SETTINGS ── */}
        {!loading && tab==='settings' && settings && (
          <>
            <Label>Business Info</Label>
            <Field label="Business Name"  value={settings.data.businessName}  onChange={v=>setSetting('businessName',v)} />
            <Field label="Tagline"        value={settings.data.tagline}        onChange={v=>setSetting('tagline',v)} />
            <Field label="Email"          value={settings.data.email}          onChange={v=>setSetting('email',v)} type="email" />
            <Field label="Phone"          value={settings.data.phone}          onChange={v=>setSetting('phone',v)} type="tel" />
            <Field label="Location"       value={settings.data.location}       onChange={v=>setSetting('location',v)} />
            <Field label="Location Note"  value={settings.data.locationNote}   onChange={v=>setSetting('locationNote',v)} />
            <Label style={{ marginTop:'24px' }}>Hours</Label>
            <Field label="Weekday Hours"  value={settings.data.hoursWeekday}   onChange={v=>setSetting('hoursWeekday',v)} />
            <Field label="Saturday Hours" value={settings.data.hoursSaturday}  onChange={v=>setSetting('hoursSaturday',v)} />
            <Field label="Closed Days"    value={settings.data.hoursClosed}    onChange={v=>setSetting('hoursClosed',v)} />
            <Label style={{ marginTop:'24px' }}>Website Copy</Label>
            <Field label="Hero Subtitle"      value={settings.data.heroSubtitle}  onChange={v=>setSetting('heroSubtitle',v)} multiline />
            <Field label="About — Paragraph 1" value={settings.data.aboutText1}   onChange={v=>setSetting('aboutText1',v)} multiline />
            <Field label="About — Paragraph 2" value={settings.data.aboutText2}   onChange={v=>setSetting('aboutText2',v)} multiline />
            <Field label="Booking Note"       value={settings.data.bookingNote}   onChange={v=>setSetting('bookingNote',v)} multiline />
            <Field label="Deposit & Cancellation Policy" value={settings.data.depositPolicy} onChange={v=>setSetting('depositPolicy',v)} multiline />
            <Label style={{ marginTop:'24px' }}>Calendar</Label>
            <Field label="Google Calendar Embed URL" value={settings.data.googleCalendarSrc||''} onChange={v=>setSetting('googleCalendarSrc',v)} />
          </>
        )}

        {/* ── CALENDAR ── */}
        {!loading && tab==='calendar' && calData && bookings && (
          <>
            {/* Month header */}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px' }}>
              <button onClick={() => setAdminMonth(m => { const n=new Date(m); n.setMonth(n.getMonth()-1); return n })}
                style={{ background:'none', border:'1px solid #c5cfbe', borderRadius:'3px', width:'36px', height:'36px', cursor:'pointer', fontSize:'18px', color:'#3d5240' }}>‹</button>
              <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'22px', color:'#3d5240', fontWeight:500 }}>
                {MONTH_NAMES[adminMonth.getMonth()]} {adminMonth.getFullYear()}
              </div>
              <button onClick={() => setAdminMonth(m => { const n=new Date(m); n.setMonth(n.getMonth()+1); return n })}
                style={{ background:'none', border:'1px solid #c5cfbe', borderRadius:'3px', width:'36px', height:'36px', cursor:'pointer', fontSize:'18px', color:'#3d5240' }}>›</button>
            </div>

            {/* Calendar grid */}
            <div style={{ background:'#fff', border:'1px solid #c5cfbe', borderRadius:'4px', padding:'16px', marginBottom:'16px' }}>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:'4px', marginBottom:'8px' }}>
                {['S','M','T','W','T','F','S'].map((d,i) => (
                  <div key={i} style={{ textAlign:'center', fontSize:'10px', letterSpacing:'1px', color:'#7a7268', padding:'4px 0', textTransform:'uppercase' }}>{d}</div>
                ))}
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:'4px' }}>
                {buildAdminCalDays().map((day, i) => {
                  if (!day) return <div key={i} />
                  const isSelected = selDay === day.iso
                  const bg = isSelected ? '#3d5240' : day.blocked ? 'rgba(107,68,35,0.12)' : day.unavailable || day.past ? 'transparent' : '#faf7ef'
                  const color = isSelected ? '#faf7ef' : day.unavailable || day.past ? '#c5cfbe' : day.blocked ? '#6b4423' : '#2a2620'
                  return (
                    <div key={i} onClick={() => !day.unavailable && !day.past && setSelDay(isSelected ? null : day.iso)}
                      style={{ aspectRatio:'1', display:'flex', alignItems:'center', justifyContent:'center', borderRadius:'3px', fontSize:'14px', fontWeight:500, cursor:day.unavailable||day.past ? 'default':'pointer', background:bg, color, border:isSelected?'none':'1px solid transparent', position:'relative', transition:'all 0.15s' }}>
                      {day.day}
                      {day.hasBooking && !isSelected && (
                        <div style={{ position:'absolute', bottom:'3px', left:'50%', transform:'translateX(-50%)', width:'4px', height:'4px', borderRadius:'50%', background:day.blocked?'#6b4423':'#6b4423' }} />
                      )}
                    </div>
                  )
                })}
              </div>
              {/* Legend */}
              <div style={{ display:'flex', gap:'16px', marginTop:'12px', paddingTop:'12px', borderTop:'1px solid #c5cfbe', flexWrap:'wrap' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'6px', fontSize:'11px', color:'#7a7268' }}>
                  <div style={{ width:'12px', height:'12px', background:'rgba(107,68,35,0.12)', borderRadius:'2px' }} /> Blocked
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:'6px', fontSize:'11px', color:'#7a7268' }}>
                  <div style={{ width:'8px', height:'8px', background:'#6b4423', borderRadius:'50%' }} /> Has booking
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:'6px', fontSize:'11px', color:'#7a7268' }}>
                  <div style={{ width:'12px', height:'12px', background:'#3d5240', borderRadius:'2px' }} /> Selected
                </div>
              </div>
            </div>

            {/* Selected day detail */}
            {selDay && (
              <div style={{ background:'#fff', border:'1px solid #c5cfbe', borderRadius:'4px', padding:'16px', marginBottom:'16px' }}>
                <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'20px', color:'#3d5240', marginBottom:'14px', fontWeight:500 }}>
                  {fmtDate(selDay)}
                </div>

                {/* Block entire day toggle */}
                <div onClick={() => toggleBlockDay(selDay)}
                  style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 14px', border:'1px solid #c5cfbe', borderRadius:'3px', cursor:'pointer', marginBottom:'12px', background: selDayBlocked ? 'rgba(107,68,35,0.06)' : '#faf7ef' }}>
                  <span style={{ fontSize:'14px', color:'#2a2620', fontWeight:500 }}>Block entire day</span>
                  <div style={{ width:'44px', height:'24px', borderRadius:'12px', background: selDayBlocked ? '#6b4423' : '#c5cfbe', position:'relative', transition:'background 0.2s' }}>
                    <div style={{ position:'absolute', top:'3px', left: selDayBlocked ? '23px' : '3px', width:'18px', height:'18px', borderRadius:'50%', background:'#fff', transition:'left 0.2s', boxShadow:'0 1px 3px rgba(0,0,0,0.2)' }} />
                  </div>
                </div>

                {/* Individual time slot blocking */}
                {!selDayBlocked && selDaySlots.length > 0 && (
                  <>
                    <div style={{ fontSize:'10px', letterSpacing:'2px', textTransform:'uppercase', color:'#7a7268', marginBottom:'10px' }}>Block specific times</div>
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'8px' }}>
                      {selDaySlots.map(slot => {
                        const isBlocked = selDayBlockedTimes.includes(slot)
                        const hasBookingAtSlot = selDayBookings.some(b => b.time===slot && b.status!=='declined')
                        return (
                          <div key={slot} onClick={() => toggleBlockTime(selDay, slot)}
                            style={{ padding:'10px 4px', textAlign:'center', fontSize:'13px', borderRadius:'3px', cursor:'pointer', border:`1px solid ${isBlocked ? '#6b4423' : '#c5cfbe'}`, background:isBlocked ? 'rgba(107,68,35,0.08)' : '#faf7ef', color:isBlocked ? '#6b4423' : '#2a2620', fontWeight:isBlocked?600:400, position:'relative' }}>
                            {slot}
                            {hasBookingAtSlot && <div style={{ position:'absolute', top:'4px', right:'4px', width:'5px', height:'5px', borderRadius:'50%', background:'#6b4423' }} />}
                          </div>
                        )
                      })}
                    </div>
                  </>
                )}

                {/* Bookings for this day */}
                {selDayBookings.length > 0 && (
                  <>
                    <div style={{ fontSize:'10px', letterSpacing:'2px', textTransform:'uppercase', color:'#7a7268', margin:'16px 0 10px' }}>Bookings this day</div>
                    {selDayBookings.map(b => (
                      <BookingCard key={b.id} booking={b} onStatusChange={updateBookingStatus} />
                    ))}
                  </>
                )}

                {calSaving && <div style={{ fontSize:'12px', color:'#7a7268', marginTop:'10px', textAlign:'center' }}>Saving…</div>}
                {calMsg && <div style={{ fontSize:'12px', color:'#3d5240', marginTop:'10px', textAlign:'center' }}>{calMsg}</div>}
              </div>
            )}

            {/* Booking requests */}
            <Label style={{ marginTop:'8px' }}>
              Booking Requests {pendingCount > 0 && `(${pendingCount} pending)`}
            </Label>
            <div style={{ display:'flex', gap:'8px', marginBottom:'14px' }}>
              {(['pending','all'] as const).map(t => (
                <button key={t} onClick={() => setBookingsTab(t)}
                  style={{ padding:'7px 16px', border:'none', borderRadius:'20px', fontSize:'12px', letterSpacing:'1.5px', textTransform:'uppercase', cursor:'pointer', fontFamily:'inherit', background:bookingsTab===t ? '#3d5240' : '#e8ede3', color:bookingsTab===t ? '#faf7ef' : '#7a7268', fontWeight:bookingsTab===t ? 600 : 400 }}>
                  {t === 'pending' ? 'Pending' : 'All'}
                </button>
              ))}
            </div>
            {(() => {
              const bks = bookings.data.bookings
                .filter(b => bookingsTab==='pending' ? b.status==='pending' : true)
                .sort((a,b) => a.date.localeCompare(b.date))
              if (bks.length === 0)
                return <div style={{ textAlign:'center', padding:'32px', color:'#7a7268', fontSize:'14px', fontStyle:'italic' }}>No {bookingsTab==='pending'?'pending ':''}bookings.</div>
              return bks.map(b => <BookingCard key={b.id} booking={b} onStatusChange={updateBookingStatus} />)
            })()}

            {/* Google Calendar embed */}
            {settings?.data.googleCalendarSrc && (
              <>
                <Label style={{ marginTop:'24px' }}>Your Google Calendar</Label>
                <div style={{ borderRadius:'4px', overflow:'hidden', border:'1px solid #c5cfbe' }}>
                  <iframe src={settings.data.googleCalendarSrc} title="Calendar" style={{ width:'100%', height:'400px', border:'none', display:'block' }} />
                </div>
              </>
            )}

            <div style={{ paddingBottom:'48px' }} />
          </>
        )}

        {/* Save button (Pricing / Add-Ons / Settings) */}
        {!loading && tab !== 'calendar' && (
          <div style={{ marginTop:'28px', paddingBottom:'48px' }}>
            {saveMsg && (
              <div style={{ padding:'12px 16px', borderRadius:'3px', marginBottom:'12px', fontSize:'13px', textAlign:'center', background:saveMsg.startsWith('✓')?'#e8ede3':'#fde8e8', color:saveMsg.startsWith('✓')?'#3d5240':'#7a2020', border:`1px solid ${saveMsg.startsWith('✓')?'#c5cfbe':'#f5b8b8'}` }}>
                {saveMsg}
              </div>
            )}
            <button onClick={handleSave} disabled={saving}
              style={{ width:'100%', padding:'18px', background:saving?'#869a7e':'#3d5240', color:'#faf7ef', border:'none', borderRadius:'3px', fontSize:'13px', letterSpacing:'2px', textTransform:'uppercase', cursor:saving?'not-allowed':'pointer', fontFamily:'inherit', fontWeight:500, transition:'background 0.2s' }}>
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
            <p style={{ textAlign:'center', fontSize:'12px', color:'#7a7268', marginTop:'10px', lineHeight:1.5 }}>Changes go live in ~1 minute after saving.</p>
          </div>
        )}
      </div>
    </div>
  )
}
