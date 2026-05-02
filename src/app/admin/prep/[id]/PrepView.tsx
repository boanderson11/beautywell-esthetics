'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ROOM_SETUP,
  EQUIPMENT,
  PRODUCTS,
  DISPOSABLES,
  BRAND_LABEL,
  selectItems,
  protocolFor,
  type ChecklistItem,
} from '@/lib/prep-mapping';
import type { PrepBooking } from './page';

const PREP_STATE_KEY = 'bw_prep_state';
const MANUAL_ENTRIES_KEY = 'bw_manual_prep_entries';

type PrepStateMap = Record<
  string,
  { checked: Record<string, boolean>; updatedAt: string }
>;

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

function readPrepState(): PrepStateMap {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(PREP_STATE_KEY);
    return raw ? (JSON.parse(raw) as PrepStateMap) : {};
  } catch {
    return {};
  }
}

function writePrepState(state: PrepStateMap): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(PREP_STATE_KEY, JSON.stringify(state));
  } catch {
    // out of quota or private mode — checkbox state simply won't persist
  }
}

function readManualEntry(id: string): ManualEntry | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(MANUAL_ENTRIES_KEY);
    if (!raw) return null;
    const list = JSON.parse(raw) as ManualEntry[];
    return list.find((e) => e.id === id) ?? null;
  } catch {
    return null;
  }
}

function writeManualEntry(updated: ManualEntry): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = window.localStorage.getItem(MANUAL_ENTRIES_KEY);
    const list = raw ? (JSON.parse(raw) as ManualEntry[]) : [];
    const idx = list.findIndex((e) => e.id === updated.id);
    if (idx >= 0) list[idx] = updated;
    else list.push(updated);
    window.localStorage.setItem(MANUAL_ENTRIES_KEY, JSON.stringify(list));
  } catch {
    // ignore
  }
}

function formatDate(iso: string | null): string {
  if (!iso) return 'No date set';
  // iso may be 'YYYY-MM-DD' (DB date) or full ISO timestamp
  const dateOnly = iso.length >= 10 ? iso.slice(0, 10) : iso;
  const [y, m, d] = dateOnly.split('-').map(Number);
  if (!y || !m || !d) return iso;
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

function dollars(cents: number): string {
  return `$${Math.round(cents / 100)}`;
}

type SectionDef = {
  key: 'room' | 'equipment' | 'products' | 'disposables';
  icon: string;
  title: string;
  items: ChecklistItem[];
};

export default function PrepView({
  booking: dbBooking,
  bookingId,
  source,
}: {
  booking: PrepBooking | null;
  bookingId: string;
  source: 'db' | 'manual';
}) {
  const router = useRouter();
  const [hydratedBooking, setHydratedBooking] = useState<PrepBooking | null>(
    dbBooking,
  );
  const [hydrated, setHydrated] = useState(source === 'db');
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    room: true,
    equipment: true,
    products: true,
    disposables: true,
  });
  const [marking, setMarking] = useState(false);
  const [markErr, setMarkErr] = useState('');

  // Hydrate manual entry from localStorage on mount
  useEffect(() => {
    if (source !== 'manual') return;
    const entry = readManualEntry(bookingId);
    if (entry) {
      setHydratedBooking({
        id: entry.id,
        source: 'manual',
        clientName: entry.clientName,
        serviceId: entry.serviceId,
        serviceName: entry.serviceName,
        servicePrice: entry.servicePrice,
        addons: entry.addons,
        date: entry.date,
        time: entry.time,
        notes: entry.notes,
        totalCents:
          (entry.servicePrice + entry.addons.reduce((s, a) => s + a.price, 0)) *
          100,
        prepCompletedAt: entry.prepCompletedAt,
      });
    }
    setHydrated(true);
  }, [source, bookingId]);

  // Hydrate checkbox state from localStorage on mount
  useEffect(() => {
    const all = readPrepState();
    setChecked(all[bookingId]?.checked ?? {});
  }, [bookingId]);

  const booking = hydratedBooking;

  const sections = useMemo<SectionDef[]>(() => {
    if (!booking) return [];
    const addonIds = booking.addons.map((a) => a.id);
    return [
      {
        key: 'room',
        icon: '🛏️',
        title: 'Room Setup',
        items: selectItems(ROOM_SETUP, booking.serviceId, addonIds),
      },
      {
        key: 'equipment',
        icon: '⚡',
        title: 'Equipment',
        items: selectItems(EQUIPMENT, booking.serviceId, addonIds),
      },
      {
        key: 'products',
        icon: '🧴',
        title: 'Products to Pull',
        items: selectItems(PRODUCTS, booking.serviceId, addonIds),
      },
      {
        key: 'disposables',
        icon: '📦',
        title: 'Disposables',
        items: selectItems(DISPOSABLES, booking.serviceId, addonIds),
      },
    ];
  }, [booking]);

  const protocol = useMemo(
    () => (booking ? protocolFor(booking.serviceId) : null),
    [booking],
  );

  const totalItems = sections.reduce((s, sec) => s + sec.items.length, 0);
  const checkedCount = sections.reduce(
    (s, sec) => s + sec.items.filter((i) => checked[i.id]).length,
    0,
  );
  const allReady = totalItems > 0 && checkedCount === totalItems;

  const toggleItem = (itemId: string) => {
    setChecked((prev) => {
      const next = { ...prev, [itemId]: !prev[itemId] };
      const all = readPrepState();
      all[bookingId] = { checked: next, updatedAt: new Date().toISOString() };
      writePrepState(all);
      return next;
    });
  };

  const markComplete = async () => {
    if (!booking) return;
    setMarking(true);
    setMarkErr('');
    try {
      if (booking.source === 'manual') {
        const entry = readManualEntry(bookingId);
        if (entry) {
          writeManualEntry({
            ...entry,
            prepCompletedAt: new Date().toISOString(),
          });
        }
      } else {
        const res = await fetch(`/api/admin/bookings/${bookingId}/prep`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ completed: true }),
        });
        if (!res.ok) throw new Error((await res.json()).error ?? 'Failed');
      }
      router.push('/admin/dashboard');
    } catch (e) {
      setMarkErr((e as Error).message);
      setMarking(false);
    }
  };

  if (!hydrated) {
    return (
      <main className="prep-page">
        <div className="prep-container">
          <p className="prep-loading">Loading…</p>
        </div>
      </main>
    );
  }

  if (!booking) {
    return (
      <main className="prep-page">
        <div className="prep-container">
          <PrepHeader />
          <div className="prep-card prep-empty">
            <h2>Booking not found</h2>
            <p>
              That prep sheet doesn&apos;t exist anymore. It may have been
              cancelled, or — if it was a manual entry — cleared from this
              browser.
            </p>
            <Link href="/admin/dashboard" className="prep-btn prep-btn-primary">
              ← Back to dashboard
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="prep-page">
      <div className="prep-container">
        <PrepHeader />

        {/* Client banner */}
        <div className="prep-card prep-client-banner">
          <div className="prep-client-name">{booking.clientName}</div>
          <div className="prep-client-service">
            {booking.serviceName}
            {booking.addons.length > 0 && (
              <span className="prep-client-addons">
                {' + '}
                {booking.addons.map((a) => a.name).join(', ')}
              </span>
            )}
          </div>
          <div className="prep-client-meta">
            <span>
              📅 {formatDate(booking.date)}
              {booking.time ? ` · ${booking.time}` : ''}
            </span>
            {booking.totalCents != null && (
              <span className="prep-client-price">
                {dollars(booking.totalCents)}
              </span>
            )}
          </div>
          {booking.source === 'manual' && (
            <span className="prep-manual-badge">Manual entry</span>
          )}
          {booking.notes && <div className="prep-client-notes">“{booking.notes}”</div>}
        </div>

        {/* Progress */}
        <div className="prep-progress">
          <div className="prep-progress-track">
            <div
              className="prep-progress-fill"
              style={{
                width: totalItems === 0 ? '0%' : `${(checkedCount / totalItems) * 100}%`,
              }}
            />
          </div>
          <div className="prep-progress-meta">
            {allReady ? (
              <span className="prep-ready-badge">✓ STATION READY</span>
            ) : (
              <span>
                {checkedCount} of {totalItems} items ready
              </span>
            )}
          </div>
        </div>

        {/* Section cards */}
        {sections.map((section) =>
          section.items.length === 0 ? null : (
            <Section
              key={section.key}
              icon={section.icon}
              title={section.title}
              items={section.items}
              checked={checked}
              isOpen={openSections[section.key]}
              onToggleOpen={() =>
                setOpenSections((p) => ({ ...p, [section.key]: !p[section.key] }))
              }
              onToggleItem={toggleItem}
            />
          ),
        )}

        {/* Treatment protocol */}
        {protocol && (
          <div className="prep-card prep-protocol">
            <div className="prep-protocol-title">Treatment Order</div>
            <ol className="prep-protocol-steps">
              {protocol.map((step) => (
                <li key={step.n}>
                  <span className="prep-protocol-num">{step.n}</span>
                  <span className="prep-protocol-text">{step.text}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Mark complete */}
        {markErr && <div className="prep-error">{markErr}</div>}
        <div className="prep-actions">
          <button
            type="button"
            className="prep-btn prep-btn-primary"
            disabled={marking}
            onClick={markComplete}
          >
            {marking
              ? 'Marking…'
              : booking.prepCompletedAt
                ? 'Mark Complete (re-finalize)'
                : 'Mark Complete'}
          </button>
        </div>
      </div>
    </main>
  );
}

function PrepHeader() {
  return (
    <header className="prep-header">
      <div className="prep-eyebrow">Back of House</div>
      <h1 className="prep-title">
        Prep <em>Sheet</em>
      </h1>
      <Link href="/admin/dashboard" className="prep-back-link">
        ← Dashboard
      </Link>
    </header>
  );
}

function Section({
  icon,
  title,
  items,
  checked,
  isOpen,
  onToggleOpen,
  onToggleItem,
}: {
  icon: string;
  title: string;
  items: ChecklistItem[];
  checked: Record<string, boolean>;
  isOpen: boolean;
  onToggleOpen: () => void;
  onToggleItem: (id: string) => void;
}) {
  const total = items.length;
  const done = items.filter((i) => checked[i.id]).length;
  const allDone = total > 0 && done === total;

  return (
    <section className={`prep-card prep-section ${allDone ? 'prep-section-done' : ''}`}>
      <button
        type="button"
        className="prep-section-header"
        onClick={onToggleOpen}
        aria-expanded={isOpen}
      >
        <span className="prep-section-icon">{icon}</span>
        <span className="prep-section-title">{title}</span>
        <span className="prep-section-count">
          {done}/{total}
        </span>
        <span className="prep-section-chevron">{isOpen ? '▾' : '▸'}</span>
      </button>
      {isOpen && (
        <ul className="prep-check-list">
          {items.map((item) => {
            const isChecked = !!checked[item.id];
            return (
              <li key={item.id}>
                <button
                  type="button"
                  className={`prep-check-item ${isChecked ? 'prep-check-item-done' : ''}`}
                  onClick={() => onToggleItem(item.id)}
                  aria-pressed={isChecked}
                >
                  <span className={`prep-check-box ${isChecked ? 'prep-check-box-on' : ''}`}>
                    {isChecked ? '✓' : ''}
                  </span>
                  <span className="prep-check-label">{item.label}</span>
                  {item.brand && BRAND_LABEL[item.brand] && (
                    <span className={`prep-brand-badge prep-brand-${item.brand}`}>
                      {BRAND_LABEL[item.brand]}
                    </span>
                  )}
                  {item.qty && <span className="prep-qty-badge">{item.qty}</span>}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
