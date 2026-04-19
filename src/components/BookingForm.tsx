'use client';

import { useState, useEffect } from 'react';

interface Service {
  id: string;
  name: string;
  tag?: string;
  duration: string;
  price: number;
  description: string;
  benefits?: string[];
}

interface Addon {
  id: string;
  name: string;
  price: number;
  description: string;
}

interface BookingFormProps {
  facials: Service[];
  waxing: Service[];
  addons: Addon[];
  depositPolicy: string;
  bookingNote: string;
}

interface SelectedAddon {
  id: string;
  name: string;
  price: number;
}

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];
const WEEKDAY_SLOTS = ['5:30 PM', '6:30 PM', '7:30 PM'];
const SATURDAY_SLOTS = [
  '9:00 AM','10:00 AM','11:00 AM','12:00 PM',
  '1:00 PM','2:00 PM','3:00 PM','4:00 PM',
];

export default function BookingForm({
  facials,
  waxing,
  addons,
  depositPolicy,
  bookingNote,
}: BookingFormProps) {
  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedAddons, setSelectedAddons] = useState<SelectedAddon[]>([]);
  const [calView, setCalView] = useState<Date>(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [policyAgreed, setPolicyAgreed] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [confirmed, setConfirmed] = useState(false);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const totalPrice =
    (selectedService?.price ?? 0) +
    selectedAddons.reduce((s, a) => s + a.price, 0);
  const deposit = Math.round(totalPrice * 0.5);

  const toggleAddon = (addon: Addon) => {
    setSelectedAddons((prev) => {
      const exists = prev.find((a) => a.id === addon.id);
      if (exists) return prev.filter((a) => a.id !== addon.id);
      return [...prev, { id: addon.id, name: addon.name, price: addon.price }];
    });
  };

  // Calendar navigation
  const prevMonth = () => {
    const now = new Date();
    setCalView((v) => {
      const next = new Date(v);
      next.setMonth(next.getMonth() - 1);
      if (
        next.getFullYear() < now.getFullYear() ||
        (next.getFullYear() === now.getFullYear() && next.getMonth() < now.getMonth())
      ) {
        return new Date(now.getFullYear(), now.getMonth(), 1);
      }
      return next;
    });
  };
  const nextMonth = () => {
    setCalView((v) => {
      const next = new Date(v);
      next.setMonth(next.getMonth() + 1);
      return next;
    });
  };

  const calDays = () => {
    const y = calView.getFullYear();
    const m = calView.getMonth();
    const firstDay = new Date(y, m, 1).getDay();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const days: Array<{ day: number | null; date: Date | null; disabled: boolean }> = [];
    for (let i = 0; i < firstDay; i++) days.push({ day: null, date: null, disabled: true });
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(y, m, d);
      const dow = date.getDay();
      days.push({ day: d, date, disabled: date < today || dow === 0 || dow === 1 });
    }
    return days;
  };

  const timeSlots = () => {
    if (!selectedDate) return [];
    const dow = selectedDate.getDay();
    if (dow >= 2 && dow <= 5) return WEEKDAY_SLOTS;
    if (dow === 6) return SATURDAY_SLOTS;
    return [];
  };

  const goToStep = (n: number) => setStep(n);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!policyAgreed) return;
    setConfirmed(true);
    setStep(4);
  };

  const reset = () => {
    setStep(1);
    setSelectedService(null);
    setSelectedAddons([]);
    setSelectedDate(null);
    setSelectedTime(null);
    setPolicyAgreed(false);
    setFirstName('');
    setConfirmed(false);
    setCalView(() => {
      const d = new Date();
      d.setDate(1);
      return d;
    });
  };

  const dateStr = selectedDate
    ? selectedDate.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      })
    : '';

  return (
    <div className="booking-form">
      {/* Progress */}
      <div className="booking-progress">
        {[
          { n: 1, label: 'Service' },
          { n: 2, label: 'Date & Time' },
          { n: 3, label: 'Details' },
        ].map(({ n, label }) => (
          <div
            key={n}
            className={`progress-step${step === n ? ' active' : ''}${step > n ? ' completed' : ''}`}
          >
            <div className="progress-circle">
              {step > n ? '✓' : n}
            </div>
            <div className="progress-label">{label}</div>
          </div>
        ))}
      </div>

      {/* Step 1: Service */}
      <div className={`booking-step${step === 1 ? ' active' : ''}`}>
        <h3 className="step-title">Choose your ritual</h3>
        <p className="step-subtitle">
          Every treatment is 60 minutes (unless noted), performed one-on-one, and tailored just for you.
        </p>

        <div className="service-group-label">Facials</div>
        <div className="service-options">
          {facials.map((svc) => (
            <div
              key={svc.id}
              className={`service-option rich${selectedService?.id === svc.id ? ' selected' : ''}`}
              onClick={() => setSelectedService(svc)}
            >
              <div className="service-option-header">
                <div className="service-option-meta">
                  {svc.tag && <span className="service-option-tag">{svc.tag}</span>}
                  <span className="service-option-duration">{svc.duration}</span>
                </div>
                <div className="service-option-price">${svc.price}</div>
              </div>
              <h4 className="service-option-name">{svc.name}</h4>
              <p className="service-option-desc">{svc.description}</p>
              {svc.benefits && (
                <div className="service-option-benefits">
                  {svc.benefits.map((b) => (
                    <span key={b} className="service-benefit">{b}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="service-group-label service-group-label-secondary">Waxing (Standalone)</div>
        <div className="service-options">
          {waxing.map((svc) => (
            <div
              key={svc.id}
              className={`service-option rich compact${selectedService?.id === svc.id ? ' selected' : ''}`}
              onClick={() => setSelectedService(svc)}
            >
              <div className="service-option-header">
                <div className="service-option-meta">
                  {svc.tag && <span className="service-option-tag">{svc.tag}</span>}
                  <span className="service-option-duration">{svc.duration}</span>
                </div>
                <div className="service-option-price">${svc.price}</div>
              </div>
              <h4 className="service-option-name">{svc.name}</h4>
              <p className="service-option-desc">{svc.description}</p>
            </div>
          ))}
        </div>

        <p className="service-group-consult">
          Not sure which one?{' '}
          <a href="#contact">Request a complimentary 15-minute consultation →</a>
        </p>

        <div className="addon-section">
          <div className="addon-section-title">Add-ons (optional)</div>
          <p className="addon-intro">
            Enhancements designed to layer into any facial without extending your appointment.
          </p>
          <div className="addon-checks addon-checks-rich">
            {addons.map((addon) => {
              const isSelected = selectedAddons.some((a) => a.id === addon.id);
              return (
                <div
                  key={addon.id}
                  className={`addon-check rich${isSelected ? ' selected' : ''}`}
                  onClick={() => toggleAddon(addon)}
                >
                  <div className="addon-check-head">
                    <span className="addon-check-name">{addon.name}</span>
                    <span className="addon-check-price">+${addon.price}</span>
                  </div>
                  <p className="addon-check-note">{addon.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="booking-nav">
          <button
            type="button"
            className="booking-btn next"
            disabled={!selectedService}
            onClick={() => goToStep(2)}
          >
            Continue
          </button>
        </div>
      </div>

      {/* Step 2: Date & Time */}
      <div className={`booking-step${step === 2 ? ' active' : ''}`}>
        <h3 className="step-title">Pick a time</h3>
        <p className="step-subtitle">
          Tuesday – Friday evenings and Saturdays. I&apos;ll confirm your slot within a few hours.
        </p>
        <div className="datetime-grid">
          {/* Calendar */}
          <div className="calendar">
            <div className="cal-header">
              <div className="cal-month">
                {MONTH_NAMES[calView.getMonth()]} {calView.getFullYear()}
              </div>
              <div className="cal-nav">
                <button type="button" onClick={prevMonth}>‹</button>
                <button type="button" onClick={nextMonth}>›</button>
              </div>
            </div>
            <div className="cal-grid">
              {['S','M','T','W','T','F','S'].map((d, i) => (
                <div key={i} className="cal-dow">{d}</div>
              ))}
              {calDays().map(({ day, date, disabled }, i) => (
                <div
                  key={i}
                  className={`cal-day${day === null ? ' empty' : ''}${disabled ? ' disabled' : ''}${
                    date && selectedDate && date.toDateString() === selectedDate.toDateString()
                      ? ' selected'
                      : ''
                  }`}
                  onClick={() => {
                    if (!disabled && date) {
                      setSelectedDate(date);
                      setSelectedTime(null);
                    }
                  }}
                >
                  {day ?? ''}
                </div>
              ))}
            </div>
          </div>

          {/* Time slots */}
          <div>
            <div className="addon-section-title" style={{ marginBottom: 16 }}>
              Available Times
            </div>
            <div className="time-slots">
              {!selectedDate ? (
                <p className="time-slots-empty">Select a date to see available times.</p>
              ) : timeSlots().length === 0 ? (
                <p className="time-slots-empty">Closed on this day.</p>
              ) : (
                timeSlots().map((time) => (
                  <button
                    key={time}
                    type="button"
                    className={`time-slot${selectedTime === time ? ' selected' : ''}`}
                    onClick={() => setSelectedTime(time)}
                  >
                    {time}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="booking-nav">
          <button type="button" className="booking-btn back" onClick={() => goToStep(1)}>
            Back
          </button>
          <button
            type="button"
            className="booking-btn next"
            disabled={!selectedDate || !selectedTime}
            onClick={() => goToStep(3)}
          >
            Continue
          </button>
        </div>
      </div>

      {/* Step 3: Details */}
      <div className={`booking-step${step === 3 ? ' active' : ''}`}>
        <h3 className="step-title">Your details</h3>
        <p className="step-subtitle">One last step — we&apos;ll use this to confirm your appointment.</p>

        {/* Summary */}
        <div className="booking-summary">
          <div className="summary-line">
            <span>{selectedService?.name}</span>
            <span>${selectedService?.price}</span>
          </div>
          {selectedAddons.map((a) => (
            <div key={a.id} className="summary-line">
              <span style={{ fontStyle: 'italic' }}>+ {a.name}</span>
              <span>${a.price}</span>
            </div>
          ))}
          <div className="summary-line divider">
            <span>{dateStr}</span>
            <span>{selectedTime}</span>
          </div>
          <div className="summary-line" style={{ paddingTop: 8 }}>
            <span className="summary-total">Total</span>
            <span className="summary-total summary-total-price">${totalPrice}</span>
          </div>
          <div className="summary-line" style={{ paddingTop: 4, fontSize: 13, color: 'var(--muted)' }}>
            <span>Deposit due to hold (50%)</span>
            <span>${deposit}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>First Name</label>
              <input
                type="text"
                name="firstName"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Last Name</label>
              <input type="text" name="lastName" required />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Email</label>
              <input type="email" name="email" required />
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input type="tel" name="phone" required />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group full">
              <label>First time? Tell me about your skin (optional)</label>
              <textarea
                name="notes"
                placeholder="Any concerns, allergies, recent treatments, or goals I should know about..."
              />
            </div>
          </div>

          <div className="booking-policy">
            <div className="booking-policy-title">
              <span>Deposit &amp; Cancellation Policy</span>
              <span className="booking-policy-deposit">${deposit} deposit</span>
            </div>
            <p className="booking-policy-text">{depositPolicy}</p>
            <label className="booking-policy-checkbox">
              <input
                type="checkbox"
                checked={policyAgreed}
                onChange={(e) => setPolicyAgreed(e.target.checked)}
                required
              />
              <span>I understand the deposit is non-refundable if I cancel within 48 hours.</span>
            </label>
          </div>

          <div className="booking-nav">
            <button type="button" className="booking-btn back" onClick={() => goToStep(2)}>
              Back
            </button>
            <button
              type="submit"
              className="booking-btn next"
              disabled={!policyAgreed}
            >
              Request Appointment
            </button>
          </div>
        </form>
      </div>

      {/* Step 4: Confirmation */}
      <div className={`booking-step${step === 4 ? ' active' : ''}`}>
        <div className="booking-confirmation">
          <div className="confirmation-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="confirmation-title">
            Request <em>received.</em>
          </h3>
          <p className="confirmation-text">
            Thank you, {firstName}. I&apos;ll be in touch within a few hours to confirm your
            appointment on{' '}
            <em>
              {dateStr} at {selectedTime}
            </em>{' '}
            and send payment instructions for your <strong>${deposit}</strong> deposit. Your
            spot will be held once the deposit clears.
          </p>

          {/* Add to Calendar buttons */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 20 }}>
            <button
              className="booking-btn back"
              style={{ padding: '12px 20px', fontSize: 11 }}
              onClick={() => downloadICS()}
            >
              🍎 Add to Apple Calendar
            </button>
            <a
              className="booking-btn back"
              style={{ padding: '12px 20px', fontSize: 11, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
              href={buildGoogleCalUrl()}
              target="_blank"
              rel="noopener noreferrer"
            >
              📅 Add to Google Calendar
            </a>
          </div>

          <button className="btn-primary" style={{ border: 'none', cursor: 'pointer' }} onClick={reset}>
            Start Another Booking
          </button>
        </div>
      </div>
    </div>
  );

  // ── Calendar export helpers ──────────────────────────────────────────────
  function buildEventTimes() {
    if (!selectedDate || !selectedTime) return { start: '', end: '' };

    // Parse time string like "5:30 PM" or "10:00 AM"
    const [timePart, meridiem] = selectedTime.split(' ');
    const [hoursRaw, minutes] = timePart.split(':').map(Number);
    let hours = hoursRaw;
    if (meridiem === 'PM' && hours !== 12) hours += 12;
    if (meridiem === 'AM' && hours === 12) hours = 0;

    const durationMins = selectedService?.duration?.includes('45') ? 45 : 60;

    const start = new Date(selectedDate);
    start.setHours(hours, minutes, 0, 0);
    const end = new Date(start.getTime() + durationMins * 60 * 1000);

    const fmt = (d: Date) =>
      d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    return { start: fmt(start), end: fmt(end) };
  }

  function buildGoogleCalUrl() {
    const { start, end } = buildEventTimes();
    if (!start) return '#';
    const title = encodeURIComponent(`Beautywell Esthetics – ${selectedService?.name ?? 'Appointment'}`);
    const details = encodeURIComponent(
      `Your appointment at Beautywell Esthetics in Cypress, CA.\n\nService: ${selectedService?.name}\nTotal: $${totalPrice} (50% deposit: $${deposit})`
    );
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${details}`;
  }

  function downloadICS() {
    const { start, end } = buildEventTimes();
    if (!start) return;
    const title = `Beautywell Esthetics – ${selectedService?.name ?? 'Appointment'}`;
    const description = `Your appointment at Beautywell Esthetics in Cypress, CA.\\nService: ${selectedService?.name}\\nTotal: $${totalPrice} (50% deposit: $${deposit})`;
    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Beautywell Esthetics//Booking//EN',
      'BEGIN:VEVENT',
      `DTSTART:${start}`,
      `DTEND:${end}`,
      `SUMMARY:${title}`,
      `DESCRIPTION:${description}`,
      'STATUS:TENTATIVE',
      'BEGIN:VALARM',
      'TRIGGER:-PT1H',
      'ACTION:DISPLAY',
      'DESCRIPTION:Reminder: Beautywell appointment in 1 hour',
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'beautywell-appointment.ics';
    a.click();
    URL.revokeObjectURL(url);
  }
}
