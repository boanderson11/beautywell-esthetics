export const WEEKDAY_SLOTS = ['5:30 PM', '6:30 PM', '7:30 PM']
export const SATURDAY_SLOTS = ['9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM']
export const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December']

export function toISO(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function fmtDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

export function slotsForDay(iso: string) {
  const dow = new Date(iso + 'T12:00:00').getDay()
  if (dow >= 2 && dow <= 5) return WEEKDAY_SLOTS
  if (dow === 6) return SATURDAY_SLOTS
  return []
}
