// Thin wrapper around the /api/admin/* endpoints used by the dashboard tabs.

export async function loadContent<T>(key: string): Promise<T> {
  const res = await fetch(`/api/admin/content/${key}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Load failed: ${key}`);
  const body = await res.json();
  return body.value as T;
}

export async function saveContent(key: string, value: unknown): Promise<void> {
  const res = await fetch(`/api/admin/content/${key}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(value),
  });
  if (!res.ok) throw new Error(`Save failed: ${key}`);
}

export async function loadBookings<T>(): Promise<T> {
  const res = await fetch('/api/admin/bookings', { cache: 'no-store' });
  if (!res.ok) throw new Error('Load bookings failed');
  const body = await res.json();
  return body.bookings as T;
}

export async function cancelBooking(id: string): Promise<void> {
  const res = await fetch(`/api/admin/bookings/${encodeURIComponent(id)}/cancel`, {
    method: 'POST',
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || 'Cancel failed');
  }
}
