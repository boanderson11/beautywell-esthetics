'use client'

import { useMemo, useState } from 'react'
import {
  DndContext,
  type DragEndEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  BRAND_LABEL,
  indexProducts,
  renderStep,
  type Product,
  type ProtocolStep,
} from '@/lib/prep-mapping'
import type { ServicesData, AddonsData } from './types'
import { Label, SaveBar } from './ui'
import { QuickAddProductModal } from './ProductsTab'

const inputStyle: React.CSSProperties = {
  padding: '8px 10px',
  border: '1px solid #c5cfbe',
  borderRadius: '3px',
  fontSize: '13px',
  fontFamily: 'inherit',
  background: '#fff',
  boxSizing: 'border-box',
}

function newStepId(): string {
  return 's-' + Math.random().toString(36).slice(2, 9)
}

const FACIAL_ORDER: Array<{ id: string; fallback: string }> = [
  { id: 'signature', fallback: 'The Beautywell Signature' },
  { id: 'hydralux', fallback: 'HydraLux Infusion' },
  { id: 'liquidfacelift', fallback: 'The Liquid Facelift' },
  { id: 'lumin', fallback: 'Lumin LED Therapy' },
]

// ── Product picker (dropdown shown next to a step) ─────────────────────────
function ProductPickerDropdown({
  products,
  excludeIds,
  onPick,
  onCreateNew,
  onClose,
}: {
  products: Product[]
  excludeIds: string[]
  onPick: (id: string) => void
  onCreateNew: () => void
  onClose: () => void
}) {
  const [query, setQuery] = useState('')
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const remaining = products.filter((p) => !excludeIds.includes(p.id))
    if (!q) return remaining
    return remaining.filter((p) => p.label.toLowerCase().includes(q))
  }, [products, excludeIds, query])

  // Group filtered by brand for visual grouping.
  const grouped = useMemo(() => {
    const map = new Map<string, Product[]>()
    for (const p of filtered) {
      const key = p.brand ?? 'generic'
      const arr = map.get(key) ?? []
      arr.push(p)
      map.set(key, arr)
    }
    return map
  }, [filtered])

  return (
    <div
      style={{
        position: 'absolute',
        zIndex: 50,
        top: 'calc(100% + 4px)',
        left: 0,
        right: 0,
        background: '#fff',
        border: '1px solid #c5cfbe',
        borderRadius: '4px',
        boxShadow: '0 6px 24px rgba(42,38,32,0.18)',
        maxHeight: '340px',
        overflowY: 'auto',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div style={{ padding: '8px', borderBottom: '1px solid #e8ede3', background: '#faf7ef' }}>
        <input
          type="text"
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search products…"
          style={{ ...inputStyle, width: '100%' }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') onClose()
          }}
        />
      </div>
      <div style={{ padding: '4px 0' }}>
        {Array.from(grouped.entries()).map(([brand, list]) => (
          <div key={brand}>
            {BRAND_LABEL[brand as keyof typeof BRAND_LABEL] && (
              <div style={{ fontSize: '10px', letterSpacing: '1.5px', textTransform: 'uppercase', color: '#7a7268', padding: '6px 12px 2px' }}>
                {BRAND_LABEL[brand as keyof typeof BRAND_LABEL]}
              </div>
            )}
            {list.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => onPick(p.id)}
                style={{ width: '100%', textAlign: 'left', padding: '8px 14px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color: '#2a2620', fontFamily: 'inherit' }}
                onMouseDown={(e) => e.preventDefault()}
              >
                {p.label}
              </button>
            ))}
          </div>
        ))}
        {filtered.length === 0 && (
          <div style={{ padding: '14px', fontSize: '12px', color: '#7a7268', fontStyle: 'italic', textAlign: 'center' }}>
            No matching products.
          </div>
        )}
      </div>
      <div style={{ borderTop: '1px solid #e8ede3' }}>
        <button
          type="button"
          onClick={onCreateNew}
          style={{ width: '100%', padding: '10px 14px', background: '#e8ede3', color: '#3d5240', border: 'none', textAlign: 'left', fontSize: '12px', letterSpacing: '1.5px', textTransform: 'uppercase', cursor: 'pointer', fontFamily: 'inherit' }}
        >
          + Add new product…
        </button>
      </div>
    </div>
  )
}

// ── A single sortable step row ────────────────────────────────────────────
function SortableStep({
  step,
  index,
  products,
  onChange,
  onDelete,
  onOpenProductPicker,
}: {
  step: ProtocolStep
  index: number
  products: Product[]
  onChange: (next: ProtocolStep) => void
  onDelete: () => void
  onOpenProductPicker: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: step.id })

  const productsById = useMemo(() => indexProducts(products), [products])

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    background: '#fff',
    border: '1px solid #c5cfbe',
    borderRadius: '4px',
    padding: '10px',
    marginBottom: '6px',
  }

  const removeProduct = (productId: string) => {
    onChange({
      ...step,
      productIds: step.productIds.filter((id) => id !== productId),
    })
  }

  const showCombinator = step.productIds.length >= 2
  const preview = renderStep(step, productsById)

  return (
    <div ref={setNodeRef} style={style}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
        <button
          type="button"
          {...attributes}
          {...listeners}
          style={{ background: 'none', border: 'none', cursor: 'grab', touchAction: 'none', padding: '4px 6px', color: '#7a7268', fontSize: '16px', lineHeight: 1, fontFamily: 'inherit' }}
          aria-label="Drag to reorder"
        >
          ⋮⋮
        </button>
        <span style={{ width: '20px', textAlign: 'center', fontSize: '12px', color: '#7a7268', paddingTop: '8px', fontWeight: 600 }}>
          {index + 1}.
        </span>

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Action input + step preview */}
          <input
            type="text"
            value={step.action}
            onChange={(e) => onChange({ ...step, action: e.target.value })}
            placeholder="Action (e.g. First cleanse) — leave blank if step is just a product"
            style={{ ...inputStyle, width: '100%' }}
          />

          {/* Selected products as chips */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '8px', alignItems: 'center', position: 'relative' }}>
            {step.productIds.map((pid) => {
              const p = productsById.get(pid)
              return (
                <span
                  key={pid}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', background: '#e8ede3', color: '#3d5240', borderRadius: '20px', fontSize: '12px' }}
                >
                  {p?.label ?? <em style={{ color: '#7a2020' }}>missing: {pid}</em>}
                  <button
                    type="button"
                    onClick={() => removeProduct(pid)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: '#7a7268', padding: 0, lineHeight: 1, fontFamily: 'inherit' }}
                    aria-label={`Remove ${p?.label ?? pid}`}
                  >
                    ×
                  </button>
                </span>
              )
            })}
            <button
              type="button"
              onClick={onOpenProductPicker}
              style={{ padding: '4px 10px', background: 'none', color: '#3d5240', border: '1px dashed #c5cfbe', borderRadius: '20px', fontSize: '11px', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              + product
            </button>
          </div>

          {/* Combinator + suffix row */}
          <div style={{ display: 'flex', gap: '6px', marginTop: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            {showCombinator && (
              <label style={{ fontSize: '10px', letterSpacing: '1.2px', textTransform: 'uppercase', color: '#7a7268', display: 'flex', alignItems: 'center', gap: '4px' }}>
                Join:
                <select
                  value={step.combinator}
                  onChange={(e) => onChange({ ...step, combinator: e.target.value as 'or' | '+' })}
                  style={{ ...inputStyle, padding: '4px 6px', fontSize: '12px' }}
                >
                  <option value="+">+ (and)</option>
                  <option value="or">or</option>
                </select>
              </label>
            )}
            <input
              type="text"
              value={step.suffix}
              onChange={(e) => onChange({ ...step, suffix: e.target.value })}
              placeholder="Suffix (e.g. (10–15 min))"
              style={{ ...inputStyle, flex: 1, minWidth: '160px' }}
            />
          </div>

          {/* Preview */}
          {preview && (
            <div style={{ marginTop: '8px', padding: '6px 10px', background: '#f5f1e8', borderRadius: '3px', fontSize: '12px', color: '#5c4638', fontStyle: 'italic' }}>
              → {preview}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onDelete}
          style={{ background: 'none', border: '1px solid #f5b8b8', color: '#7a2020', padding: '6px 10px', borderRadius: '3px', fontSize: '11px', cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}
          aria-label="Delete step"
        >
          ✕
        </button>
      </div>
    </div>
  )
}

// ── Per-facial protocol editor ──────────────────────────────────────────────
function FacialProtocolEditor({
  facialId,
  facialName,
  steps,
  products,
  setProducts,
  onChangeSteps,
  services,
  addons,
}: {
  facialId: string
  facialName: string
  steps: ProtocolStep[]
  products: Product[]
  setProducts: (updater: (p: Product[]) => Product[]) => void
  onChangeSteps: (next: ProtocolStep[]) => void
  services: ServicesData
  addons: AddonsData
}) {
  const [collapsed, setCollapsed] = useState(false)
  const [pickerForStep, setPickerForStep] = useState<string | null>(null)
  const [quickAddForStep, setQuickAddForStep] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
  )

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e
    if (!over || active.id === over.id) return
    const oldIdx = steps.findIndex((s) => s.id === active.id)
    const newIdx = steps.findIndex((s) => s.id === over.id)
    if (oldIdx < 0 || newIdx < 0) return
    onChangeSteps(arrayMove(steps, oldIdx, newIdx))
  }

  const updateStep = (id: string, next: ProtocolStep) =>
    onChangeSteps(steps.map((s) => (s.id === id ? next : s)))
  const deleteStep = (id: string) =>
    onChangeSteps(steps.filter((s) => s.id !== id))
  const addStep = () =>
    onChangeSteps([
      ...steps,
      { id: newStepId(), action: '', productIds: [], combinator: '+', suffix: '' },
    ])

  const addProductToStep = (stepId: string, productId: string) => {
    const step = steps.find((s) => s.id === stepId)
    if (!step) return
    if (step.productIds.includes(productId)) return
    updateStep(stepId, { ...step, productIds: [...step.productIds, productId] })
  }

  const handleNewProductFromStep = (stepId: string, product: Product) => {
    setProducts((list) => [...list, product])
    addProductToStep(stepId, product.id)
    setQuickAddForStep(null)
  }

  return (
    <div style={{ background: '#faf7ef', border: '1px solid #c5cfbe', borderRadius: '6px', padding: '12px', marginBottom: '14px' }}>
      <button
        type="button"
        onClick={() => setCollapsed((v) => !v)}
        style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '4px 0', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}
      >
        <span style={{ fontSize: '12px', color: '#7a7268' }}>{collapsed ? '▸' : '▾'}</span>
        <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: '20px', color: '#3d5240', fontStyle: 'italic', flex: 1 }}>
          {facialName}
        </span>
        <span style={{ fontSize: '11px', color: '#7a7268' }}>
          {steps.length} step{steps.length === 1 ? '' : 's'}
        </span>
      </button>

      {!collapsed && (
        <div style={{ marginTop: '12px' }}>
          <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
            <SortableContext items={steps.map((s) => s.id)} strategy={verticalListSortingStrategy}>
              {steps.map((step, idx) => (
                <div key={step.id} style={{ position: 'relative' }}>
                  <SortableStep
                    step={step}
                    index={idx}
                    products={products}
                    onChange={(next) => updateStep(step.id, next)}
                    onDelete={() => {
                      if (steps.length === 1 || confirm('Delete this step?')) deleteStep(step.id)
                    }}
                    onOpenProductPicker={() => setPickerForStep(step.id)}
                  />
                  {pickerForStep === step.id && (
                    <ProductPickerDropdown
                      products={products}
                      excludeIds={step.productIds}
                      onPick={(pid) => {
                        addProductToStep(step.id, pid)
                        setPickerForStep(null)
                      }}
                      onCreateNew={() => {
                        setPickerForStep(null)
                        setQuickAddForStep(step.id)
                      }}
                      onClose={() => setPickerForStep(null)}
                    />
                  )}
                </div>
              ))}
            </SortableContext>
          </DndContext>

          <button
            type="button"
            onClick={addStep}
            style={{ width: '100%', padding: '10px', background: 'none', color: '#3d5240', border: '1px dashed #c5cfbe', borderRadius: '3px', fontSize: '11px', letterSpacing: '1.5px', textTransform: 'uppercase', cursor: 'pointer', fontFamily: 'inherit', marginTop: '6px' }}
          >
            + Add step
          </button>
        </div>
      )}

      {quickAddForStep !== null && (
        <QuickAddProductModal
          onClose={() => setQuickAddForStep(null)}
          onCreate={(p) => handleNewProductFromStep(quickAddForStep, p)}
          services={services}
          addons={addons}
        />
      )}
    </div>
  )
}

// ── Main ProtocolsTab ──────────────────────────────────────────────────────
export default function ProtocolsTab({
  protocols,
  setProtocols,
  products,
  setProducts,
  onSave,
  saving,
  message,
  services,
  addons,
}: {
  protocols: Record<string, ProtocolStep[]>
  setProtocols: (updater: (p: Record<string, ProtocolStep[]>) => Record<string, ProtocolStep[]>) => void
  products: Product[]
  setProducts: (updater: (p: Product[]) => Product[]) => void
  onSave: () => void
  saving: boolean
  message: string
  services: ServicesData
  addons: AddonsData
}) {
  const facialNameById = useMemo(() => {
    const m = new Map<string, string>()
    for (const f of services.facials) m.set(f.id, f.name)
    return m
  }, [services])

  return (
    <>
      <Label>Treatment Protocols</Label>
      <p style={{ fontSize: '12px', color: '#7a7268', marginBottom: '14px', lineHeight: 1.6 }}>
        The validated step-by-step order for each facial. Drag the ⋮⋮ handle to reorder; click a step to edit. Products link to the editable Products library — new products created here are added there too.
      </p>

      {FACIAL_ORDER.map(({ id, fallback }) => {
        const steps = protocols[id] ?? []
        const name = facialNameById.get(id) ?? fallback
        return (
          <FacialProtocolEditor
            key={id}
            facialId={id}
            facialName={name}
            steps={steps}
            products={products}
            setProducts={setProducts}
            onChangeSteps={(next) =>
              setProtocols((all) => ({ ...all, [id]: next }))
            }
            services={services}
            addons={addons}
          />
        )
      })}

      <SaveBar onSave={onSave} saving={saving} message={message} />
    </>
  )
}
