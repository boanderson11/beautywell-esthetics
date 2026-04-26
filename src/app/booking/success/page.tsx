import Link from 'next/link';
import Nav from '@/components/Nav';
import BookingCalendarExports from '@/components/BookingCalendarExports';
import { fetchBookingForDisplay } from '@/lib/booking-fetch';
import { formatDate, formatMoney } from '@/lib/booking-format';

export const dynamic = 'force-dynamic';

type SearchParams = { id?: string };

export default async function BookingSuccessPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const id = searchParams.id;

  if (!id) {
    return <NotFound />;
  }

  let booking;
  try {
    booking = await fetchBookingForDisplay(id);
  } catch (err) {
    console.error('[booking/success] db read failed', err);
    return <Pending id={id} />;
  }

  if (!booking) return <NotFound />;

  // The webhook may not have fired yet — the user just got redirected back from
  // Stripe. Show a "processing" state for pending; only show full confirmation
  // for confirmed bookings.
  if (booking.status === 'pending_payment') {
    return <Pending id={booking.id} />;
  }

  if (booking.status !== 'confirmed') {
    return <NotFound />;
  }

  return (
    <>
      <Nav />
      <section className="booking" id="booking">
        <div className="booking-container">
          <div className="booking-form" style={{ marginTop: 24 }}>
            <div className="booking-step active">
              <div className="booking-confirmation">
                <div className="confirmation-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="confirmation-title">
                  Booking <em>confirmed.</em>
                </h3>
                <p className="confirmation-text">
                  Thank you, {booking.firstName}. Your <strong>{booking.serviceName}</strong> appointment is held for{' '}
                  <em>{formatDate(booking.date)} at {booking.time}</em>. A confirmation email is on its way to you, and the
                  remaining balance of <strong>{formatMoney(booking.totalCents - booking.depositCents)}</strong> will be due
                  at your appointment.
                </p>

                <p className="confirmation-text" style={{ marginTop: -4 }}>
                  <strong>First-time client?</strong> Please complete your{' '}
                  <Link href="/intake" style={{ color: 'var(--terracotta)', textDecoration: 'underline' }}>
                    intake &amp; consent form
                  </Link>{' '}
                  before your appointment.
                </p>

                <BookingCalendarExports
                  serviceName={booking.serviceName}
                  serviceDuration={booking.serviceDuration}
                  date={booking.date}
                  time={booking.time}
                  totalCents={booking.totalCents}
                  depositCents={booking.depositCents}
                />

                <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 24 }}>
                  Booking reference: <code>{booking.id}</code>
                </p>

                <Link href="/" className="btn-primary" style={{ marginTop: 16, textDecoration: 'none' }}>
                  Return home
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function Pending({ id }: { id: string }) {
  return (
    <>
      <Nav />
      <section className="booking" id="booking">
        <div className="booking-container">
          <div className="booking-form" style={{ marginTop: 24 }}>
            <div className="booking-step active">
              <div className="booking-confirmation">
                <h3 className="confirmation-title">
                  Finalizing your <em>booking…</em>
                </h3>
                <p className="confirmation-text">
                  Your payment is being processed. This page will update shortly — feel free to refresh in a few seconds.
                  You&apos;ll also receive a confirmation email once it&apos;s complete.
                </p>
                <p style={{ fontSize: 12, color: 'var(--muted)' }}>
                  Reference: <code>{id}</code>
                </p>
                <Link href="/" className="btn-primary" style={{ marginTop: 16, textDecoration: 'none' }}>
                  Return home
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function NotFound() {
  return (
    <>
      <Nav />
      <section className="booking" id="booking">
        <div className="booking-container">
          <div className="booking-form" style={{ marginTop: 24 }}>
            <div className="booking-step active">
              <div className="booking-confirmation">
                <h3 className="confirmation-title">Booking not found</h3>
                <p className="confirmation-text">
                  We couldn&apos;t locate that booking. If you believe this is an error, please reach out and we&apos;ll sort it out.
                </p>
                <Link href="/#booking" className="btn-primary" style={{ marginTop: 16, textDecoration: 'none' }}>
                  Back to booking
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
