'use client'

import { Label, SaveBar } from './ui'
import { ServiceEditor, AddRowButton, newId } from './editors'
import type { ServicesData, Facial, Waxing } from './types'

const blankFacial = (): Facial => ({
  id: newId('svc'), name: '', duration: '', price: 0,
  description: '', tag: '', benefits: [],
})

const blankWaxing = (): Waxing => ({
  id: newId('svc'), name: '', duration: '', price: 0,
  description: '', tag: '',
})

export default function PricingTab({
  services,
  setServices,
  onSave,
  saving,
  message,
}: {
  services: ServicesData;
  setServices: (updater: (s: ServicesData) => ServicesData) => void;
  onSave: () => void;
  saving: boolean;
  message: string;
}) {
  const updateFacial = (id: string, next: Facial | Waxing) =>
    setServices(s => ({ ...s, facials: s.facials.map(f => f.id === id ? next as Facial : f) }))
  const deleteFacial = (id: string) =>
    setServices(s => ({ ...s, facials: s.facials.filter(f => f.id !== id) }))
  const addFacial = () =>
    setServices(s => ({ ...s, facials: [...s.facials, blankFacial()] }))

  const updateWaxing = (id: string, next: Facial | Waxing) =>
    setServices(s => ({ ...s, waxing: s.waxing.map(w => w.id === id ? next as Waxing : w) }))
  const deleteWaxing = (id: string) =>
    setServices(s => ({ ...s, waxing: s.waxing.filter(w => w.id !== id) }))
  const addWaxing = () =>
    setServices(s => ({ ...s, waxing: [...s.waxing, blankWaxing()] }))

  return (
    <>
      <Label>Facials</Label>
      {services.facials.map(f => (
        <ServiceEditor
          key={f.id}
          service={f}
          hasBenefits
          onChange={next => updateFacial(f.id, next)}
          onDelete={() => deleteFacial(f.id)}
        />
      ))}
      <AddRowButton onClick={addFacial} label="Add Facial" />

      <Label style={{ marginTop: '24px' }}>Waxing Services</Label>
      {services.waxing.map(w => (
        <ServiceEditor
          key={w.id}
          service={w}
          hasBenefits={false}
          onChange={next => updateWaxing(w.id, next)}
          onDelete={() => deleteWaxing(w.id)}
        />
      ))}
      <AddRowButton onClick={addWaxing} label="Add Waxing Service" />

      <SaveBar onSave={onSave} saving={saving} message={message} />
    </>
  )
}
