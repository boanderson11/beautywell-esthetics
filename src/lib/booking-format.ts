// Formatting helpers shared across emails, success page, and admin.

export function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatMoney(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}
