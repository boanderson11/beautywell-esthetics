'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ServicesData, AddonsData } from './types';

const MANUAL_ENTRIES_KEY = 'bw_manual_prep_entries';

type ManualEntry = {
  id: string;
  clientName: string;
  serviceId: string;
  serviceName: string;
  servicePrice: number;
  addons: Array<{ id: string; name: string; price: number }>;
  date: string | null;
  time: string | null;
  notes: string | null;
  prepCompletedAt: string | null;
  createdAt: string;
};

function appendManualEntry(entry: ManualEntry): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = window.localStorage.getItem(MANUAL_ENTRIES_KEY);
    const list = raw ? (JSON.parse(raw) as ManualEntry[]) : [];
    list.push(entry);
    window.localStorage.setItem(MANUAL_ENTRIES_KEY, JSON.stringify(list));
  } catch {
    // ignore quota / private mode
  }
}

export default function ManualPrepForm({
  services,
  addons,
  onCancel,
}: {
  services: ServicesData;
  addons: AddonsData;
  onCancel: () => void;
}) {
  const router = useRouter();
  const allServices = [...services.facials, ...services.waxing];

  const [clientName, setClientName] = useState('');
  const [serviceId, setServiceId] = useState(allServices[0]?.id ?? '');
  const [pickedAddons, setPickedAddons] = useState<Set<string>>(new Set());
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const toggleAddon = (id: string) => {
    setPickedAddons((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !serviceId) return;
    setSubmitting(true);

    const service = allServices.find((s) => s.id === serviceId);
    if (!service) {
      setSubmitting(false);
      return;
    }
    const selectedAddons = addons.addons
      .filter((a) => pickedAddons.has(a.id))
      .map((a) => ({ id: a.id, name: a.name, price: a.price }));

    const entry: ManualEntry = {
      id: `manual-${Date.now()}`,
      clientName: clientName.trim(),
      serviceId: service.id,
      serviceName: service.name,
      servicePrice: service.price,
      addons: selectedAddons,
      date: date || null,
      time: time.trim() || null,
      notes: notes.trim() || null,
      prepCompletedAt: null,
      createdAt: new Date().toISOString(),
    };

    appendManualEntry(entry);
    router.push(`/admin/prep/${entry.id}`);
  };

  const inputStyle: React.CSSProperties = {
    padding: '8px 10px',
    border: '1px solid #c5cfbe',
    borderRadius: '3px',
    fontSize: '14px',
    fontFamily: 'inherit',
    background: '#fff',
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        background: '#fff',
        border: '1px solid #c5cfbe',
        borderRadius: '4px',
        padding: '16px',
        marginBottom: '16px',
      }}
    >
      <div
        style={{
          fontFamily: "'Cormorant Garamond',serif",
          fontSize: '20px',
          color: '#3d5240',
          fontWeight: 500,
          marginBottom: '12px',
        }}
      >
        Manual prep entry
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <label style={{ fontSize: '11px', letterSpacing: '1.5px', textTransform: 'uppercase', color: '#7a7268' }}>
          Client name
          <input
            type="text"
            required
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            style={{ ...inputStyle, marginTop: '4px', width: '100%' }}
            placeholder="e.g. Sarah M."
          />
        </label>

        <label style={{ fontSize: '11px', letterSpacing: '1.5px', textTransform: 'uppercase', color: '#7a7268' }}>
          Service
          <select
            value={serviceId}
            onChange={(e) => {
              setServiceId(e.target.value);
              setPickedAddons(new Set());
            }}
            style={{ ...inputStyle, marginTop: '4px', width: '100%' }}
          >
            <optgroup label="Facials">
              {services.facials.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} — ${f.price}
                </option>
              ))}
            </optgroup>
            <optgroup label="Waxing">
              {services.waxing.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} — ${w.price}
                </option>
              ))}
            </optgroup>
          </select>
        </label>

        <div>
          <div style={{ fontSize: '11px', letterSpacing: '1.5px', textTransform: 'uppercase', color: '#7a7268', marginBottom: '6px' }}>
            Add-ons (optional)
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {addons.addons.map((a) => {
              const on = pickedAddons.has(a.id);
              return (
                <button
                  type="button"
                  key={a.id}
                  onClick={() => toggleAddon(a.id)}
                  style={{
                    padding: '6px 12px',
                    fontSize: '12px',
                    borderRadius: '20px',
                    border: '1px solid ' + (on ? '#3d5240' : '#c5cfbe'),
                    background: on ? '#3d5240' : '#fff',
                    color: on ? '#faf7ef' : '#3d5240',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  {a.name} +${a.price}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <label style={{ fontSize: '11px', letterSpacing: '1.5px', textTransform: 'uppercase', color: '#7a7268' }}>
            Date
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={{ ...inputStyle, marginTop: '4px', width: '100%' }}
            />
          </label>
          <label style={{ fontSize: '11px', letterSpacing: '1.5px', textTransform: 'uppercase', color: '#7a7268' }}>
            Time
            <input
              type="text"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              placeholder="e.g. 5:30 PM"
              style={{ ...inputStyle, marginTop: '4px', width: '100%' }}
            />
          </label>
        </div>

        <label style={{ fontSize: '11px', letterSpacing: '1.5px', textTransform: 'uppercase', color: '#7a7268' }}>
          Notes (optional)
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            style={{ ...inputStyle, marginTop: '4px', width: '100%', resize: 'vertical' }}
            placeholder="Any sensitivities, requests, recent treatments…"
          />
        </label>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
        <button
          type="submit"
          disabled={submitting || !clientName.trim() || !serviceId}
          style={{
            padding: '8px 14px',
            background: '#3d5240',
            color: '#faf7ef',
            border: 'none',
            borderRadius: '3px',
            fontSize: '11px',
            letterSpacing: '1.5px',
            textTransform: 'uppercase',
            cursor: submitting ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit',
          }}
        >
          {submitting ? 'Creating…' : 'Start Prep Sheet'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          style={{
            padding: '8px 14px',
            background: 'none',
            color: '#7a7268',
            border: '1px solid #c5cfbe',
            borderRadius: '3px',
            fontSize: '11px',
            letterSpacing: '1.5px',
            textTransform: 'uppercase',
            cursor: submitting ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit',
          }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
