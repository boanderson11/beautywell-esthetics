'use client'

import type { CSSProperties } from 'react'
import type { Facial, Waxing, Addon } from './types'

const card: CSSProperties = {
  background: '#fff', border: '1px solid #c5cfbe', borderRadius: '4px',
  padding: '16px', marginBottom: '12px', display: 'flex', flexDirection: 'column', gap: '12px',
}
const labelStyle: CSSProperties = {
  fontSize: '10px', letterSpacing: '1.5px', textTransform: 'uppercase',
  color: '#7a7268', display: 'block', marginBottom: '4px',
}
const inputStyle: CSSProperties = {
  width: '100%', padding: '10px 12px', border: '1px solid #c5cfbe', borderRadius: '3px',
  fontSize: '14px', fontFamily: 'Inter,sans-serif', color: '#2a2620',
  background: '#faf7ef', boxSizing: 'border-box',
}
const textareaStyle: CSSProperties = {
  ...inputStyle, resize: 'vertical', minHeight: '70px', lineHeight: 1.5,
}

export function newId(prefix: 'svc' | 'add'): string {
  const t = Date.now().toString(36)
  const r = Math.random().toString(36).slice(2, 6)
  return `${prefix}_${t}${r}`
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  )
}

function DeleteButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={() => { if (confirm(`Delete "${label || 'this item'}"? This cannot be undone.`)) onClick() }}
      style={{
        padding: '8px 12px', background: 'none', color: '#7a2020',
        border: '1px solid #f5b8b8', borderRadius: '3px', fontSize: '11px',
        letterSpacing: '1.5px', textTransform: 'uppercase', cursor: 'pointer',
        fontFamily: 'inherit', alignSelf: 'flex-end',
      }}
    >
      Delete
    </button>
  )
}

export function ServiceEditor({
  service,
  hasBenefits,
  onChange,
  onDelete,
}: {
  service: Facial | Waxing;
  hasBenefits: boolean;
  onChange: (next: Facial | Waxing) => void;
  onDelete: () => void;
}) {
  const set = <K extends keyof (Facial & Waxing)>(key: K, value: (Facial & Waxing)[K]) =>
    onChange({ ...service, [key]: value } as Facial | Waxing)

  const benefitsText = hasBenefits
    ? ((service as Facial).benefits ?? []).join(', ')
    : ''

  return (
    <div style={card}>
      <FieldRow label="Service Name">
        <input style={inputStyle} value={service.name} onChange={e => set('name', e.target.value)} />
      </FieldRow>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
        <FieldRow label="Duration">
          <input style={inputStyle} value={service.duration} onChange={e => set('duration', e.target.value)} placeholder="60 Minutes" />
        </FieldRow>
        <FieldRow label="Price ($)">
          <input
            style={inputStyle}
            type="number"
            inputMode="numeric"
            value={service.price}
            onChange={e => set('price', Number(e.target.value))}
          />
        </FieldRow>
        <FieldRow label="Tag (optional)">
          <input style={inputStyle} value={service.tag ?? ''} onChange={e => set('tag', e.target.value)} placeholder="Most Popular" />
        </FieldRow>
      </div>

      <FieldRow label="Description">
        <textarea style={textareaStyle} value={service.description} onChange={e => set('description', e.target.value)} />
      </FieldRow>

      {hasBenefits && (
        <FieldRow label="Benefits (comma-separated)">
          <input
            style={inputStyle}
            value={benefitsText}
            onChange={e => {
              const list = e.target.value.split(',').map(s => s.trim()).filter(Boolean)
              onChange({ ...(service as Facial), benefits: list } as Facial)
            }}
            placeholder="Deep Cleansing, Hydrating, Anti-Aging"
          />
        </FieldRow>
      )}

      <DeleteButton onClick={onDelete} label={service.name} />
    </div>
  )
}

export function AddonEditor({
  addon,
  onChange,
  onDelete,
}: {
  addon: Addon;
  onChange: (next: Addon) => void;
  onDelete: () => void;
}) {
  const set = <K extends keyof Addon>(key: K, value: Addon[K]) =>
    onChange({ ...addon, [key]: value })

  return (
    <div style={card}>
      <FieldRow label="Add-On Name">
        <input style={inputStyle} value={addon.name} onChange={e => set('name', e.target.value)} />
      </FieldRow>

      <FieldRow label="Price ($)">
        <input
          style={{ ...inputStyle, width: '120px' }}
          type="number"
          inputMode="numeric"
          value={addon.price}
          onChange={e => set('price', Number(e.target.value))}
        />
      </FieldRow>

      <FieldRow label="Description">
        <textarea style={textareaStyle} value={addon.description} onChange={e => set('description', e.target.value)} />
      </FieldRow>

      <DeleteButton onClick={onDelete} label={addon.name} />
    </div>
  )
}

export function AddRowButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: '100%', padding: '12px', background: '#faf7ef', color: '#3d5240',
        border: '1px dashed #c5cfbe', borderRadius: '3px', fontSize: '12px',
        letterSpacing: '1.5px', textTransform: 'uppercase', cursor: 'pointer',
        fontFamily: 'inherit', fontWeight: 500, marginBottom: '12px',
      }}
    >
      + {label}
    </button>
  )
}
