'use client'

import { Label, PriceCard, SaveBar } from './ui'
import type { AddonsData } from './types'

export default function AddonsTab({
  addons,
  setAddons,
  onSave,
  saving,
  message,
}: {
  addons: AddonsData;
  setAddons: (updater: (a: AddonsData) => AddonsData) => void;
  onSave: () => void;
  saving: boolean;
  message: string;
}) {
  const setAddonPrice = (id: string, price: number) =>
    setAddons(a => ({ addons: a.addons.map(x => x.id === id ? { ...x, price } : x) }))

  return (
    <>
      <Label>Add-On Enhancements</Label>
      {addons.addons.map(a => (
        <PriceCard key={a.id} name={a.name} price={a.price} onChange={p => setAddonPrice(a.id, p)} />
      ))}
      <SaveBar onSave={onSave} saving={saving} message={message} />
    </>
  )
}
