// Single source of truth for booking slot rules. Imported by both client and server,
// so the form can render slots and the server can validate them with identical logic.

export const WEEKDAY_SLOTS = ['5:30 PM', '6:30 PM', '7:30 PM'];
export const SATURDAY_SLOTS = [
  '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
  '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM',
];

export function slotsForDay(isoDate: string): string[] {
  // Parse as local date at noon to avoid timezone edge cases shifting the day-of-week.
  const dow = new Date(isoDate + 'T12:00:00').getDay();
  if (dow >= 2 && dow <= 5) return WEEKDAY_SLOTS;
  if (dow === 6) return SATURDAY_SLOTS;
  return [];
}

export function isOpenDay(isoDate: string): boolean {
  return slotsForDay(isoDate).length > 0;
}

export function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
