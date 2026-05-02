export type Facial = {
  id: string; name: string; tag?: string; duration: string;
  price: number; description: string; benefits?: string[];
};
export type Waxing = {
  id: string; name: string; tag?: string; duration: string;
  price: number; description: string;
};
export type Addon = {
  id: string; name: string; price: number; description: string;
};
export type ServicesData = { facials: Facial[]; waxing: Waxing[] };
export type AddonsData = { addons: Addon[] };
export type Settings = {
  businessName: string; tagline: string; heroSubtitle: string;
  aboutText1: string; aboutText2: string; email: string; phone: string;
  location: string; locationNote: string; hoursWeekday: string;
  hoursSaturday: string; hoursClosed: string; bookingNote: string;
  depositPolicy: string; googleCalendarSrc: string;
};
export type CalendarData = {
  blockedDates: string[];
  blockedTimes: Record<string, string[]>;
};

export type BookingStatus = 'pending_payment' | 'confirmed' | 'expired' | 'cancelled';
export type Booking = {
  id: string;
  status: BookingStatus;
  created_at: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  service_id: string;
  service_name: string;
  addons: Array<{ id: string; name: string; price: number }>;
  date: string;
  time_slot: string;
  total_cents: number;
  deposit_cents: number;
  notes: string | null;
  paid_at: string | null;
  intake_completed_at: string | null;
  prep_completed_at: string | null;
};
