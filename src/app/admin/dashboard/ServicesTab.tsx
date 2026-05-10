'use client'

import { useState } from 'react'
import { Label, SaveBar } from './ui'
import { ServiceEditor, AddonEditor, AddRowButton, newId } from './editors'
import type { ServicesData, AddonsData, Facial, Waxing, Addon } from './types'
import type { Product, ProtocolStep } from '@/lib/prep-mapping'
import ProtocolEditorModal from './ProtocolEditorModal'

const blankFacial = (): Facial => ({
  id: newId('svc'), name: '', duration: '', price: 0,
  description: '', tag: '', benefits: [],
})

const blankWaxing = (): Waxing => ({
  id: newId('svc'), name: '', duration: '', price: 0,
  description: '', tag: '',
})

const blankAddon = (): Addon => ({
  id: newId('add'), name: '', price: 0, description: '',
})

// ── EditProtocolButton: small button rendered on each service/addon card ───
function EditProtocolButton({
  onClick,
  stepCount,
}: {
  onClick: () => void
  stepCount: number
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '8px 14px',
        background: '#fff',
        color: '#3d5240',
        border: '1px solid #c5cfbe',
        borderRadius: '3px',
        fontSize: '11px',
        letterSpacing: '1.5px',
        textTransform: 'uppercase',
        cursor: 'pointer',
        fontFamily: 'inherit',
        fontWeight: 500,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        alignSelf: 'flex-start',
      }}
    >
      Edit Protocol
      <span style={{ fontSize: '10px', color: '#7a7268', fontWeight: 400 }}>
        {stepCount === 0 ? '(empty)' : `${stepCount} step${stepCount === 1 ? '' : 's'}`}
      </span>
    </button>
  )
}

// ── Group section header ──────────────────────────────────────────────────
function GroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: 'italic', fontSize: '22px', color: '#3d5240', marginTop: '24px', marginBottom: '10px' }}>
      {children}
    </div>
  )
}

// ── Main ServicesTab ──────────────────────────────────────────────────────
export default function ServicesTab({
  services,
  setServices,
  addons,
  setAddons,
  protocols,
  setProtocols,
  products,
  setProducts,
  onSave,
  saving,
  message,
}: {
  services: ServicesData
  setServices: (updater: (s: ServicesData) => ServicesData) => void
  addons: AddonsData
  setAddons: (updater: (a: AddonsData) => AddonsData) => void
  protocols: Record<string, ProtocolStep[]>
  setProtocols: (updater: (p: Record<string, ProtocolStep[]>) => Record<string, ProtocolStep[]>) => void
  products: Product[]
  setProducts: (updater: (p: Product[]) => Product[]) => void
  onSave: () => void
  saving: boolean
  message: string
}) {
  // The id of the service or addon currently being protocol-edited (modal open
  // iff this is non-null). Stored as a single source of truth so only one modal
  // is ever open.
  const [protocolEditFor, setProtocolEditFor] = useState<{ id: string; name: string } | null>(null)

  // ── Facial CRUD ────────────────────────────────────────────────────────
  const updateFacial = (id: string, next: Facial | Waxing) =>
    setServices(s => ({ ...s, facials: s.facials.map(f => f.id === id ? next as Facial : f) }))
  const deleteFacial = (id: string) => {
    setServices(s => ({ ...s, facials: s.facials.filter(f => f.id !== id) }))
    setProtocols(p => {
      const next = { ...p }
      delete next[id]
      return next
    })
  }
  const addFacial = () =>
    setServices(s => ({ ...s, facials: [...s.facials, blankFacial()] }))

  // ── Waxing CRUD ────────────────────────────────────────────────────────
  const updateWaxing = (id: string, next: Facial | Waxing) =>
    setServices(s => ({ ...s, waxing: s.waxing.map(w => w.id === id ? next as Waxing : w) }))
  const deleteWaxing = (id: string) => {
    setServices(s => ({ ...s, waxing: s.waxing.filter(w => w.id !== id) }))
    setProtocols(p => {
      const next = { ...p }
      delete next[id]
      return next
    })
  }
  const addWaxing = () =>
    setServices(s => ({ ...s, waxing: [...s.waxing, blankWaxing()] }))

  // ── Add-on CRUD ────────────────────────────────────────────────────────
  const updateAddon = (id: string, next: Addon) =>
    setAddons(a => ({ addons: a.addons.map(x => x.id === id ? next : x) }))
  const deleteAddon = (id: string) => {
    setAddons(a => ({ addons: a.addons.filter(x => x.id !== id) }))
    setProtocols(p => {
      const next = { ...p }
      delete next[id]
      return next
    })
  }
  const addAddon = () =>
    setAddons(a => ({ addons: [...a.addons, blankAddon()] }))

  // ── Open protocol editor for a given service/addon id ──────────────────
  const openProtocolEditor = (id: string, name: string) => {
    // Ensure an entry exists in protocols for this id; otherwise the editor
    // would have no array to mutate and "Add step" would fail.
    setProtocols(p => (p[id] === undefined ? { ...p, [id]: [] } : p))
    setProtocolEditFor({ id, name })
  }

  const stepCountFor = (id: string): number => protocols[id]?.length ?? 0

  return (
    <>
      <Label>Services</Label>
      <p style={{ fontSize: '12px', color: '#7a7268', marginBottom: '14px', lineHeight: 1.6 }}>
        Pricing, descriptions, and the per-service treatment protocol. Click <strong>Edit Protocol</strong> on any service to open its drag-and-drop step editor.
      </p>

      {/* ── Facials ── */}
      <GroupLabel>Facials</GroupLabel>
      {services.facials.map(f => (
        <div key={f.id}>
          <ServiceEditor
            service={f}
            hasBenefits
            onChange={next => updateFacial(f.id, next)}
            onDelete={() => deleteFacial(f.id)}
          />
          <div style={{ marginTop: '-6px', marginBottom: '12px' }}>
            <EditProtocolButton
              onClick={() => openProtocolEditor(f.id, f.name || 'Untitled facial')}
              stepCount={stepCountFor(f.id)}
            />
          </div>
        </div>
      ))}
      <AddRowButton onClick={addFacial} label="Add Facial" />

      {/* ── Waxing ── */}
      <GroupLabel>Waxing Services</GroupLabel>
      {services.waxing.map(w => (
        <div key={w.id}>
          <ServiceEditor
            service={w}
            hasBenefits={false}
            onChange={next => updateWaxing(w.id, next)}
            onDelete={() => deleteWaxing(w.id)}
          />
          <div style={{ marginTop: '-6px', marginBottom: '12px' }}>
            <EditProtocolButton
              onClick={() => openProtocolEditor(w.id, w.name || 'Untitled waxing service')}
              stepCount={stepCountFor(w.id)}
            />
          </div>
        </div>
      ))}
      <AddRowButton onClick={addWaxing} label="Add Waxing Service" />

      {/* ── Add-Ons ── */}
      <GroupLabel>Add-On Enhancements</GroupLabel>
      {addons.addons.map(a => (
        <div key={a.id}>
          <AddonEditor
            addon={a}
            onChange={next => updateAddon(a.id, next)}
            onDelete={() => deleteAddon(a.id)}
          />
          <div style={{ marginTop: '-6px', marginBottom: '12px' }}>
            <EditProtocolButton
              onClick={() => openProtocolEditor(a.id, a.name || 'Untitled add-on')}
              stepCount={stepCountFor(a.id)}
            />
          </div>
        </div>
      ))}
      <AddRowButton onClick={addAddon} label="Add Add-On" />

      <SaveBar onSave={onSave} saving={saving} message={message} />

      {protocolEditFor && (
        <ProtocolEditorModal
          serviceName={protocolEditFor.name}
          steps={protocols[protocolEditFor.id] ?? []}
          onChangeSteps={(next) =>
            setProtocols((all) => ({ ...all, [protocolEditFor.id]: next }))
          }
          products={products}
          setProducts={setProducts}
          services={services}
          addons={addons}
          onClose={() => setProtocolEditFor(null)}
        />
      )}
    </>
  )
}
