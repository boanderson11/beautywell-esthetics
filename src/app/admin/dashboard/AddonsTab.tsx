'use client'

import { Label, SaveBar } from './ui'
import { AddonEditor, AddRowButton, newId } from './editors'
import type { AddonsData, Addon } from './types'

const blankAddon = (): Addon => ({
  id: newId('add'), name: '', price: 0, description: '',
})

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
  const updateAddon = (id: string, next: Addon) =>
    setAddons(a => ({ addons: a.addons.map(x => x.id === id ? next : x) }))
  const deleteAddon = (id: string) =>
    setAddons(a => ({ addons: a.addons.filter(x => x.id !== id) }))
  const addAddon = () =>
    setAddons(a => ({ addons: [...a.addons, blankAddon()] }))

  return (
    <>
      <Label>Add-On Enhancements</Label>
      {addons.addons.map(a => (
        <AddonEditor
          key={a.id}
          addon={a}
          onChange={next => updateAddon(a.id, next)}
          onDelete={() => deleteAddon(a.id)}
        />
      ))}
      <AddRowButton onClick={addAddon} label="Add Add-On" />

      <SaveBar onSave={onSave} saving={saving} message={message} />
    </>
  )
}
