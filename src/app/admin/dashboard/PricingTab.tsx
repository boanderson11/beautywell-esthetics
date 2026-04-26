'use client'

import { Label, PriceCard, SaveBar } from './ui'
import type { ServicesData } from './types'

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
  const setFacialPrice = (id: string, price: number) =>
    setServices(s => ({ ...s, facials: s.facials.map(f => f.id === id ? { ...f, price } : f) }))
  const setWaxingPrice = (id: string, price: number) =>
    setServices(s => ({ ...s, waxing: s.waxing.map(w => w.id === id ? { ...w, price } : w) }))

  return (
    <>
      <Label>Facials</Label>
      {services.facials.map(f => (
        <PriceCard key={f.id} name={f.name} sub={f.duration} price={f.price} onChange={p => setFacialPrice(f.id, p)} />
      ))}
      <Label style={{ marginTop: '24px' }}>Waxing Services</Label>
      {services.waxing.map(w => (
        <PriceCard key={w.id} name={w.name} sub={w.duration} price={w.price} onChange={p => setWaxingPrice(w.id, p)} />
      ))}
      <SaveBar onSave={onSave} saving={saving} message={message} />
    </>
  )
}
