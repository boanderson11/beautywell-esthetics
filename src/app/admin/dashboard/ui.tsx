'use client'

import type { ReactNode, CSSProperties } from 'react'

export function Label({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div style={{ fontSize: '10px', letterSpacing: '2.5px', textTransform: 'uppercase', color: '#6b4423', marginBottom: '10px', paddingBottom: '8px', borderBottom: '1px solid #c5cfbe', ...style }}>
      {children}
    </div>
  )
}

export function PriceCard({ name, sub, price, onChange }: { name: string; sub?: string; price: number; onChange: (p: number) => void }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #c5cfbe', borderRadius: '4px', padding: '14px 16px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '18px', color: '#3d5240', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
        {sub && <div style={{ fontSize: '12px', color: '#7a7268', marginTop: '2px' }}>{sub}</div>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '2px', flexShrink: 0 }}>
        <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '20px', color: '#6b4423' }}>$</span>
        <input
          type="number"
          inputMode="numeric"
          value={price}
          onChange={e => onChange(Number(e.target.value))}
          style={{ width: '76px', padding: '10px 6px', border: '1px solid #c5cfbe', borderRadius: '3px', fontSize: '20px', fontFamily: "'Cormorant Garamond',serif", color: '#6b4423', textAlign: 'center', background: '#faf7ef' }}
        />
      </div>
    </div>
  )
}

export function Field({ label, value, onChange, type = 'text', multiline }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  multiline?: boolean;
}) {
  const base: CSSProperties = { width: '100%', padding: '12px 14px', border: '1px solid #c5cfbe', borderRadius: '3px', fontSize: '15px', fontFamily: 'Inter,sans-serif', color: '#2a2620', background: '#fff', boxSizing: 'border-box' }
  return (
    <div style={{ marginBottom: '16px' }}>
      <label style={{ fontSize: '10px', letterSpacing: '1.5px', textTransform: 'uppercase', color: '#7a7268', display: 'block', marginBottom: '6px' }}>{label}</label>
      {multiline
        ? <textarea value={value} onChange={e => onChange(e.target.value)} rows={3} style={{ ...base, resize: 'vertical', minHeight: '80px', lineHeight: 1.6 }} />
        : <input type={type} value={value} onChange={e => onChange(e.target.value)} style={base} />}
    </div>
  )
}

export function SaveBar({ onSave, saving, message }: { onSave: () => void; saving: boolean; message: string }) {
  const ok = message.startsWith('✓')
  return (
    <div style={{ marginTop: '28px', paddingBottom: '48px' }}>
      {message && (
        <div style={{ padding: '12px 16px', borderRadius: '3px', marginBottom: '12px', fontSize: '13px', textAlign: 'center', background: ok ? '#e8ede3' : '#fde8e8', color: ok ? '#3d5240' : '#7a2020', border: `1px solid ${ok ? '#c5cfbe' : '#f5b8b8'}` }}>
          {message}
        </div>
      )}
      <button
        onClick={onSave}
        disabled={saving}
        style={{ width: '100%', padding: '18px', background: saving ? '#869a7e' : '#3d5240', color: '#faf7ef', border: 'none', borderRadius: '3px', fontSize: '13px', letterSpacing: '2px', textTransform: 'uppercase', cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit', fontWeight: 500, transition: 'background 0.2s' }}
      >
        {saving ? 'Saving…' : 'Save Changes'}
      </button>
      <p style={{ textAlign: 'center', fontSize: '12px', color: '#7a7268', marginTop: '10px', lineHeight: 1.5 }}>
        Changes go live instantly.
      </p>
    </div>
  )
}
