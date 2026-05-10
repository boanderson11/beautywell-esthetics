'use client'

import { useMemo, useState } from 'react'
import {
  BRAND_KEYS,
  BRAND_LABEL,
  type Brand,
  type Product,
  type Trigger,
} from '@/lib/prep-mapping'
import type { ServicesData, AddonsData } from './types'
import { Label, SaveBar } from './ui'

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  border: '1px solid #c5cfbe',
  borderRadius: '3px',
  fontSize: '14px',
  fontFamily: 'inherit',
  background: '#fff',
  boxSizing: 'border-box',
}

function newProductId(): string {
  return 'p-' + Math.random().toString(36).slice(2, 9)
}

// ── Trigger helpers ────────────────────────────────────────────────────────
// Triggers are heterogeneous: { service: 'x' } | { addon: 'y' } | { anyFacial }
// | { anyWaxing } | { anyBrowWax }. The UI flattens them to chip keys like
// "svc:signature", "add:dermaplaning", "any:facial".

type ChipKey = `svc:${string}` | `add:${string}` | `any:facial` | `any:waxing` | `any:browwax`

function triggerToChipKey(t: Trigger): ChipKey | null {
  if ('anyFacial' in t && t.anyFacial) return 'any:facial'
  if ('anyWaxing' in t && t.anyWaxing) return 'any:waxing'
  if ('anyBrowWax' in t && t.anyBrowWax) return 'any:browwax'
  if ('service' in t && t.service) return `svc:${t.service}`
  if ('addon' in t && t.addon) return `add:${t.addon}`
  return null
}

function chipKeyToTrigger(key: ChipKey): Trigger {
  if (key === 'any:facial') return { anyFacial: true }
  if (key === 'any:waxing') return { anyWaxing: true }
  if (key === 'any:browwax') return { anyBrowWax: true }
  if (key.startsWith('svc:')) return { service: key.slice(4) }
  return { addon: key.slice(4) }
}

function triggersToChipKeys(triggers: Trigger[]): Set<ChipKey> {
  const s = new Set<ChipKey>()
  for (const t of triggers) {
    const k = triggerToChipKey(t)
    if (k) s.add(k)
  }
  return s
}

function chipKeysToTriggers(keys: Set<ChipKey>): Trigger[] {
  return Array.from(keys).map(chipKeyToTrigger)
}

// ── Trigger chip picker ────────────────────────────────────────────────────
export function TriggerChips({
  selected,
  onToggle,
  services,
  addons,
}: {
  selected: Set<ChipKey>
  onToggle: (key: ChipKey) => void
  services: ServicesData
  addons: AddonsData
}) {
  const groups: Array<{ label: string; chips: Array<{ key: ChipKey; label: string }> }> = [
    {
      label: 'Any',
      chips: [
        { key: 'any:facial', label: 'Any Facial' },
        { key: 'any:waxing', label: 'Any Waxing' },
        { key: 'any:browwax', label: 'Any Brow Wax' },
      ],
    },
    {
      label: 'Facials',
      chips: services.facials.map((f) => ({
        key: `svc:${f.id}` as ChipKey,
        label: f.name,
      })),
    },
    {
      label: 'Waxing',
      chips: services.waxing.map((w) => ({
        key: `svc:${w.id}` as ChipKey,
        label: w.name,
      })),
    },
    {
      label: 'Add-ons',
      chips: addons.addons.map((a) => ({
        key: `add:${a.id}` as ChipKey,
        label: a.name,
      })),
    },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {groups.map((g) => (
        <div key={g.label}>
          <div style={{ fontSize: '10px', letterSpacing: '1.5px', textTransform: 'uppercase', color: '#7a7268', marginBottom: '4px' }}>
            {g.label}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {g.chips.map((c) => {
              const on = selected.has(c.key)
              return (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => onToggle(c.key)}
                  style={{
                    padding: '4px 10px',
                    fontSize: '11px',
                    borderRadius: '20px',
                    border: '1px solid ' + (on ? '#3d5240' : '#c5cfbe'),
                    background: on ? '#3d5240' : '#fff',
                    color: on ? '#faf7ef' : '#3d5240',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  {c.label}
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── ProductEditor: a single product row, expanded for editing ─────────────
function ProductEditor({
  product,
  onChange,
  onDelete,
  services,
  addons,
}: {
  product: Product
  onChange: (next: Product) => void
  onDelete: () => void
  services: ServicesData
  addons: AddonsData
}) {
  const [expanded, setExpanded] = useState(false)
  const selectedTriggerKeys = useMemo(() => triggersToChipKeys(product.triggers), [product.triggers])

  const toggleTrigger = (key: ChipKey) => {
    const next = new Set(selectedTriggerKeys)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    onChange({ ...product, triggers: chipKeysToTriggers(next) })
  }

  return (
    <div style={{ background: '#fff', border: '1px solid #c5cfbe', borderRadius: '4px', padding: '12px 14px', marginBottom: '8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color: '#7a7268', padding: 0, width: '20px' }}
          aria-label={expanded ? 'Collapse' : 'Expand'}
        >
          {expanded ? '▾' : '▸'}
        </button>
        <input
          type="text"
          value={product.label}
          onChange={(e) => onChange({ ...product, label: e.target.value })}
          style={{ ...inputStyle, flex: 1, padding: '8px 10px', fontSize: '14px' }}
          placeholder="Product name"
        />
        <select
          value={product.brand ?? 'generic'}
          onChange={(e) => onChange({ ...product, brand: e.target.value as Brand })}
          style={{ ...inputStyle, width: '140px', padding: '8px 10px', fontSize: '12px' }}
        >
          {BRAND_KEYS.map((b) => (
            <option key={b} value={b}>
              {BRAND_LABEL[b] || '(no brand)'}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={onDelete}
          style={{ background: 'none', border: '1px solid #f5b8b8', color: '#7a2020', padding: '6px 10px', borderRadius: '3px', fontSize: '11px', cursor: 'pointer', fontFamily: 'inherit' }}
          aria-label="Delete product"
        >
          ✕
        </button>
      </div>

      {expanded && (
        <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e8ede3' }}>
          <div style={{ fontSize: '10px', letterSpacing: '1.5px', textTransform: 'uppercase', color: '#7a7268', marginBottom: '8px' }}>
            Show this product when booked services / add-ons include:
          </div>
          <TriggerChips
            selected={selectedTriggerKeys}
            onToggle={toggleTrigger}
            services={services}
            addons={addons}
          />
        </div>
      )}
    </div>
  )
}

// ── Quick-add modal — used both standalone and by the protocol editor ────
export function QuickAddProductModal({
  onClose,
  onCreate,
  services,
  addons,
  initialLabel,
}: {
  onClose: () => void
  onCreate: (p: Product) => void
  services: ServicesData
  addons: AddonsData
  initialLabel?: string
}) {
  const [label, setLabel] = useState(initialLabel ?? '')
  const [brand, setBrand] = useState<Brand>('generic')
  const [triggerKeys, setTriggerKeys] = useState<Set<ChipKey>>(new Set())

  const toggleTrigger = (key: ChipKey) => {
    setTriggerKeys((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const submit = () => {
    const trimmed = label.trim()
    if (!trimmed) return
    onCreate({
      id: newProductId(),
      label: trimmed,
      brand,
      triggers: chipKeysToTriggers(triggerKeys),
    })
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(42, 38, 32, 0.4)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#faf7ef',
          border: '1px solid #c5cfbe',
          borderRadius: '6px',
          padding: '20px',
          maxWidth: '480px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '22px', color: '#3d5240', marginBottom: '12px', fontStyle: 'italic' }}>
          New product
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '14px' }}>
          <label style={{ fontSize: '10px', letterSpacing: '1.5px', textTransform: 'uppercase', color: '#7a7268' }}>
            Name
            <input
              type="text"
              autoFocus
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. PreCleanse Balm"
              style={{ ...inputStyle, marginTop: '4px' }}
            />
          </label>
          <label style={{ fontSize: '10px', letterSpacing: '1.5px', textTransform: 'uppercase', color: '#7a7268' }}>
            Brand
            <select
              value={brand}
              onChange={(e) => setBrand(e.target.value as Brand)}
              style={{ ...inputStyle, marginTop: '4px' }}
            >
              {BRAND_KEYS.map((b) => (
                <option key={b} value={b}>
                  {BRAND_LABEL[b] || '(no brand)'}
                </option>
              ))}
            </select>
          </label>
          <div>
            <div style={{ fontSize: '10px', letterSpacing: '1.5px', textTransform: 'uppercase', color: '#7a7268', marginBottom: '6px' }}>
              Show when booked includes
            </div>
            <TriggerChips
              selected={triggerKeys}
              onToggle={toggleTrigger}
              services={services}
              addons={addons}
            />
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onClose}
            style={{ padding: '10px 16px', background: 'none', color: '#7a7268', border: '1px solid #c5cfbe', borderRadius: '3px', fontSize: '11px', letterSpacing: '1.5px', textTransform: 'uppercase', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={!label.trim()}
            style={{ padding: '10px 16px', background: '#3d5240', color: '#faf7ef', border: 'none', borderRadius: '3px', fontSize: '11px', letterSpacing: '1.5px', textTransform: 'uppercase', cursor: label.trim() ? 'pointer' : 'not-allowed', fontFamily: 'inherit' }}
          >
            Create product
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main ProductsTab ──────────────────────────────────────────────────────
export default function ProductsTab({
  products,
  setProducts,
  onSave,
  saving,
  message,
  services,
  addons,
}: {
  products: Product[]
  setProducts: (updater: (p: Product[]) => Product[]) => void
  onSave: () => void
  saving: boolean
  message: string
  services: ServicesData
  addons: AddonsData
}) {
  const [showQuickAdd, setShowQuickAdd] = useState(false)

  const update = (id: string, next: Product) =>
    setProducts((list) => list.map((p) => (p.id === id ? next : p)))
  const del = (id: string) =>
    setProducts((list) => list.filter((p) => p.id !== id))

  const create = (p: Product) => {
    setProducts((list) => [...list, p])
    setShowQuickAdd(false)
  }

  return (
    <>
      <Label>Products</Label>
      <p style={{ fontSize: '12px', color: '#7a7268', marginBottom: '14px', lineHeight: 1.6 }}>
        The full product library. Click the chevron to expand a row and pick which services or add-ons make a product show up on the prep sheet.
      </p>

      {products.map((p) => (
        <ProductEditor
          key={p.id}
          product={p}
          onChange={(next) => update(p.id, next)}
          onDelete={() => {
            if (confirm(`Delete "${p.label}"? It may be referenced by protocol steps — those references will become "${p.id}" until you fix them.`)) {
              del(p.id)
            }
          }}
          services={services}
          addons={addons}
        />
      ))}

      <button
        type="button"
        onClick={() => setShowQuickAdd(true)}
        style={{ width: '100%', padding: '12px', background: 'none', color: '#3d5240', border: '1px dashed #c5cfbe', borderRadius: '3px', fontSize: '12px', letterSpacing: '1.5px', textTransform: 'uppercase', cursor: 'pointer', fontFamily: 'inherit', marginTop: '8px' }}
      >
        + Add product
      </button>

      {showQuickAdd && (
        <QuickAddProductModal
          onClose={() => setShowQuickAdd(false)}
          onCreate={create}
          services={services}
          addons={addons}
        />
      )}

      <SaveBar onSave={onSave} saving={saving} message={message} />
    </>
  )
}
