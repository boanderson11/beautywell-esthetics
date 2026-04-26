'use client'

import { Label, Field, SaveBar } from './ui'
import type { Settings } from './types'

export default function SettingsTab({
  settings,
  setSettings,
  onSave,
  saving,
  message,
}: {
  settings: Settings;
  setSettings: (updater: (s: Settings) => Settings) => void;
  onSave: () => void;
  saving: boolean;
  message: string;
}) {
  const set = (key: keyof Settings, value: string) =>
    setSettings(s => ({ ...s, [key]: value }))

  return (
    <>
      <Label>Business Info</Label>
      <Field label="Business Name" value={settings.businessName} onChange={v => set('businessName', v)} />
      <Field label="Tagline"       value={settings.tagline}      onChange={v => set('tagline', v)} />
      <Field label="Email"         value={settings.email}        onChange={v => set('email', v)} type="email" />
      <Field label="Phone"         value={settings.phone}        onChange={v => set('phone', v)} type="tel" />
      <Field label="Location"      value={settings.location}     onChange={v => set('location', v)} />
      <Field label="Location Note" value={settings.locationNote} onChange={v => set('locationNote', v)} />

      <Label style={{ marginTop: '24px' }}>Hours</Label>
      <Field label="Weekday Hours"  value={settings.hoursWeekday}  onChange={v => set('hoursWeekday', v)} />
      <Field label="Saturday Hours" value={settings.hoursSaturday} onChange={v => set('hoursSaturday', v)} />
      <Field label="Closed Days"    value={settings.hoursClosed}   onChange={v => set('hoursClosed', v)} />

      <Label style={{ marginTop: '24px' }}>Website Copy</Label>
      <Field label="Hero Subtitle"      value={settings.heroSubtitle} onChange={v => set('heroSubtitle', v)} multiline />
      <Field label="About — Paragraph 1" value={settings.aboutText1}   onChange={v => set('aboutText1', v)} multiline />
      <Field label="About — Paragraph 2" value={settings.aboutText2}   onChange={v => set('aboutText2', v)} multiline />
      <Field label="Booking Note"       value={settings.bookingNote}  onChange={v => set('bookingNote', v)} multiline />
      <Field label="Deposit & Cancellation Policy" value={settings.depositPolicy} onChange={v => set('depositPolicy', v)} multiline />

      <Label style={{ marginTop: '24px' }}>Calendar</Label>
      <Field label="Google Calendar Embed URL" value={settings.googleCalendarSrc || ''} onChange={v => set('googleCalendarSrc', v)} />

      <SaveBar onSave={onSave} saving={saving} message={message} />
    </>
  )
}
