'use client';

import { useState, useEffect, useRef } from 'react';
import { WEEKDAY_SLOTS, SATURDAY_SLOTS } from '@/lib/slots';

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

export default function BookingForm({
  facials,
  waxing,
  addons,
  depositPolicy,
}: BookingFormProps) {
  const formRef = useRef<HTMLDivElement>(null);
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
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [website, setWebsite] = useState(''); // honeypot
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [blockedDates, setBlockedDates] = useState<string[]>([]);
  const [blockedTimes, setBlockedTimes] = useState<Record<string, string[]>>({});

  // Fetch live availability so taken slots from other customers are reflected.
  useEffect(() => {
    let cancelled = false;
    fetch('/api/booking/availability')
      .then((r) => (r.ok ? r.json() : { blockedDates: [], blockedTimes: {} }))
      .then((data) => {
        if (cancelled) return;
        setBlockedDates(Array.isArray(data.blockedDates) ? data.blockedDates : []);
        setBlockedTimes(data.blockedTimes && typeof data.blockedTimes === 'object' ? data.blockedTimes : {});
      })
      .catch(() => {
        // Soft-fail: form still works, the server will reject invalid slots.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Scroll form into view when step changes
  useEffect(() => {
    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [step]);

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
    const days: Array<{ day: number | null; date: Date | null; disabled: boolean; blocked: boolean }> = [];
    for (let i = 0; i < firstDay; i++) days.push({ day: null, date: null, disabled: true, blocked: false });
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(y, m, d);
      const dow = date.getDay();
      const iso = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const isBlocked = blockedDates.includes(iso);
      days.push({ day: d, date, disabled: date < today || dow === 0 || dow === 1 || isBlocked, blocked: isBlocked });
    }
    return days;
  };

  const toISO = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const timeSlots = () => {
    if (!selectedDate) return [];
    const dow = selectedDate.getDay();
    const iso = toISO(selectedDate);
    const blocked = blockedTimes[iso] ?? [];
    let slots: string[] = [];
    if (dow >= 2 && dow <= 5) slots = WEEKDAY_SLOTS;
    else if (dow === 6) slots = SATURDAY_SLOTS;
    return slots.filter((s) => !blocked.includes(s));
  };

  const goToStep = (n: number) => setStep(n);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!policyAgreed || !selectedService || !selectedDate || !selectedTime) return;
    setSubmitError(null);
    setSubmitting(true);

    try {
      const res = await fetch('/api/booking/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          phone,
          notes,
          serviceId: selectedService.id,
          addonIds: selectedAddons.map((a) => a.id),
          date: toISO(selectedDate),
          time: selectedTime,
          policyAgreed,
          website,
        }),
      });

      const data = (await res.json().catch(() => null)) as { checkoutUrl?: string; error?: string } | null;

      if (!res.ok || !data?.checkoutUrl) {
        setSubmitError(data?.error || 'Something went wrong. Please try again.');
        setSubmitting(false);
        return;
      }

      // Redirect to Stripe Checkout. Do NOT show a confirmation — payment isn't done yet.
      window.location.assign(data.checkoutUrl);
    } catch {
      setSubmitError('Network error. Please check your connection and try again.');
      setSubmitting(false);
    }
  };

  const dateStr = selectedDate
    ? selectedDate.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      })
    : '';

  return (
    <div className="booking-form" ref={formRef}>
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
          Tuesday – Friday evenings and Saturdays. Your slot is held the moment your deposit clears.
        </p>
        <div className="datetime-grid">
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
              {calDays().map(({ day, date, disabled, blocked }, i) => (
                <div
                  key={i}
                  className={`cal-day${day === null ? ' empty' : ''}${disabled ? ' disabled' : ''}${blocked ? ' blocked' : ''}${
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

          <div>
            <div className="addon-section-title" style={{ marginBottom: 16 }}>
              Available Times
            </div>
            <div className="time-slots">
              {!selectedDate ? (
                <p className="time-slots-empty">Select a date to see available times.</p>
              ) : timeSlots().length === 0 ? (
                <p className="time-slots-empty">No times available on this day.</p>
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
        <p className="step-subtitle">
          One last step — we&apos;ll collect your 50% deposit on the next page to lock in your slot.
        </p>

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
            <span>Deposit due now (50%)</span>
            <span>${deposit}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Honeypot — hidden from real users via aria + position. */}
          <div
            aria-hidden="true"
            style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, overflow: 'hidden' }}
          >
            <label>
              Website
              <input
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
              />
            </label>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>First Name</label>
              <input type="text" required value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Last Name</label>
              <input type="text" required value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Email</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group full">
              <label>First time? Tell me about your skin (optional)</label>
              <textarea
                placeholder="Any concerns, allergies, recent treatments, or goals I should know about..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
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

          {submitError && (
            <div
              role="alert"
              style={{
                background: '#f9e4dc',
                border: '1px solid #d97757',
                color: '#7a3818',
                padding: '12px 16px',
                borderRadius: 4,
                margin: '16px 0',
                fontSize: 14,
              }}
            >
              {submitError}
            </div>
          )}

          <div className="booking-nav">
            <button type="button" className="booking-btn back" onClick={() => goToStep(2)}>
              Back
            </button>
            <button
              type="submit"
              className="booking-btn next"
              disabled={!policyAgreed || submitting}
            >
              {submitting ? 'Redirecting to checkout…' : `Pay $${deposit} deposit & book`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
