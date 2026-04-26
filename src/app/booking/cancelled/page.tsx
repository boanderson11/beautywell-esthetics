import Link from 'next/link';
import Nav from '@/components/Nav';

export const dynamic = 'force-dynamic';

export default function BookingCancelledPage() {
  return (
    <>
      <Nav />
      <section className="booking" id="booking">
        <div className="booking-container">
          <div className="booking-form" style={{ marginTop: 24 }}>
            <div className="booking-step active">
              <div className="booking-confirmation">
                <h3 className="confirmation-title">
                  Checkout <em>cancelled.</em>
                </h3>
                <p className="confirmation-text">
                  No problem — your slot has been released and no payment was taken. Whenever you&apos;re ready, head back
                  to the booking form to pick a time.
                </p>
                <Link href="/#booking" className="btn-primary" style={{ textDecoration: 'none' }}>
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
