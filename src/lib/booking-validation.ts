import { z } from 'zod';
import { slotsForDay, todayISO } from './slots';
import { getContent } from './content-store';

export const bookingInputSchema = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  email: z.string().trim().toLowerCase().email().max(200),
  phone: z.string().trim().min(7).max(40),
  notes: z.string().trim().max(2000).optional().default(''),
  serviceId: z.string().trim().min(1).max(80),
  addonIds: z.array(z.string().trim().min(1).max(80)).max(10).default([]),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD'),
  time: z.string().min(1).max(20),
  policyAgreed: z.literal(true, {
    errorMap: () => ({ message: 'You must accept the deposit policy.' }),
  }),
  // Honeypot. Real users leave it blank; bots fill it.
  website: z.string().max(0).optional().default(''),
});

export type BookingInput = z.infer<typeof bookingInputSchema>;

type Calendar = { blockedDates: string[]; blockedTimes: Record<string, string[]> };

export async function validateSlot(
  date: string,
  time: string,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  if (date < todayISO()) return { ok: false, reason: 'Date is in the past.' };

  const allowedSlots = slotsForDay(date);
  if (allowedSlots.length === 0) return { ok: false, reason: 'Studio is closed on this day.' };
  if (!allowedSlots.includes(time)) return { ok: false, reason: 'Time is not a valid slot for this day.' };

  const cal = await getContent<Calendar>('calendar');
  if (cal.blockedDates.includes(date)) return { ok: false, reason: 'This date is unavailable.' };
  if ((cal.blockedTimes[date] ?? []).includes(time)) {
    return { ok: false, reason: 'This time slot is unavailable.' };
  }
  return { ok: true };
}
