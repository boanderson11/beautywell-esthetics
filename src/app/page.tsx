import Nav from '@/components/Nav';
import BookingForm from '@/components/BookingForm';
import ContactForm from '@/components/ContactForm';
import { getContent } from '@/lib/content-store';

// Reads from Postgres via content-store, falling back to the on-disk JSON
// in content/ when no DB row exists yet (fresh install). Forces a dynamic
// render so admin saves are reflected immediately.
export const dynamic = 'force-dynamic';

type Settings = {
  businessName: string; tagline: string; heroSubtitle: string;
  aboutText1: string; aboutText2: string; email: string; phone: string;
  location: string; locationNote: string; hoursWeekday: string;
  hoursSaturday: string; hoursClosed: string; bookingNote: string;
  depositPolicy: string; googleCalendarSrc: string;
};
type Facial = { id: string; name: string; tag?: string; duration: string; price: number; description: string; benefits?: string[] };
type Waxing = { id: string; name: string; tag?: string; duration: string; price: number; description: string };
type Addon  = { id: string; name: string; price: number; description: string };

export default async function Home() {
  const [services, addonsData, settings] = await Promise.all([
    getContent<{ facials: Facial[]; waxing: Waxing[] }>('services'),
    getContent<{ addons: Addon[] }>('addons'),
    getContent<Settings>('settings'),
  ]);
  const facials = services.facials;
  const waxing = services.waxing;
  const addons = addonsData.addons;
  const {
    businessName,
    tagline,
    heroSubtitle,
    aboutText1,
    aboutText2,
    email,
    phone,
    location,
    locationNote,
    hoursWeekday,
    hoursSaturday,
    hoursClosed,
    bookingNote,
    depositPolicy,
    googleCalendarSrc,
  } = settings;

  return (
    <>
      <Nav />

      {/* ── HERO ────────────────────────────────────────────────── */}
      <header className="hero">
        <img className="hero-botanical top-right" src="/hero-logo.jpg" alt="" aria-hidden="true" />
        <svg className="hero-botanical bottom-left" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <circle cx="100" cy="100" r="60" fill="none" stroke="#6b4423" strokeWidth="1"/>
          <circle cx="100" cy="100" r="80" fill="none" stroke="#6b4423" strokeWidth="0.5"/>
          <path d="M40 100 L 160 100 M 100 40 L 100 160 M 58 58 L 142 142 M 142 58 L 58 142" stroke="#6b4423" strokeWidth="0.5"/>
        </svg>
        <div className="hero-grid">
          <div>
            <div className="hero-label">Est. 2024 · A Private Skin Studio</div>
            <h1>
              Skincare, <em>rooted</em>
              <br />
              in ritual.
            </h1>
            <p className="hero-text">{heroSubtitle}</p>
            <div className="hero-cta-group">
              <a href="#booking" className="btn-primary">
                Book an Appointment
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M1 8h14M9 2l6 6-6 6" stroke="currentColor" strokeWidth="1.5"/>
                </svg>
              </a>
              <a href="#booking" className="btn-secondary">
                View the Menu
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* ── ABOUT ────────────────────────────────────────────────── */}
      <section className="about" id="about">
        <div className="about-grid">
          <div className="about-visual reveal">
            <div className="image-block main">
              <img src="/about-facial.jpg" alt="Esthetician applying a facial mask with a fan brush" />
            </div>
          </div>
          <div className="about-content reveal">
            <div className="section-label">The Studio</div>
            <h2>
              An elevated <em>skincare</em> experience.
            </h2>
            <p>{aboutText1}</p>
            <p>{aboutText2}</p>
            <div className="about-credentials">
              <div className="credential">
                <small>Licensed</small>
                <p>Certified Esthetician</p>
              </div>
              <div className="credential">
                <small>Specialization</small>
                <p>Anti-Aging &amp; Hydration</p>
              </div>
              <div className="credential">
                <small>Technology</small>
                <p>Microcurrent · LED · Infusion</p>
              </div>
              <div className="credential">
                <small>Philosophy</small>
                <p>Less but better</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── BOOKING ──────────────────────────────────────────────── */}
      <section className="booking" id="booking">
        <div className="booking-container">
          <div className="section-header reveal">
            <div>
              <div className="section-label">Book Online</div>
              <h2 className="section-title">
                Book your <em>ritual.</em>
              </h2>
            </div>
            <p className="section-intro">
              {bookingNote}
              {' '}
              <a
                href="/intake"
                style={{
                  color: 'var(--terracotta-soft)',
                  textDecoration: 'underline',
                  textUnderlineOffset: 3,
                  fontWeight: 500,
                }}
              >
                New client? Complete your intake &amp; consent form →
              </a>
            </p>
          </div>
          <BookingForm
            facials={facials}
            waxing={waxing}
            addons={addons}
            depositPolicy={depositPolicy}
            bookingNote={bookingNote}
          />
        </div>
      </section>

      {/* ── AVAILABILITY / GOOGLE CALENDAR ───────────────────────── */}
      <section className="calendar-embed" id="availability">
        <div className="section-header reveal">
          <div>
            <div className="section-label">Availability</div>
            <h2 className="section-title">
              Check <em>open times.</em>
            </h2>
          </div>
          <p className="section-intro">
            View live availability below. Studio hours are Tuesday–Friday evenings and all day Saturday.
          </p>
        </div>
        <div className="calendar-embed-inner reveal">
          {googleCalendarSrc ? (
            <iframe
              src={googleCalendarSrc}
              title="Beautywell Availability Calendar"
              frameBorder="0"
              scrolling="no"
              style={{ border: 'none' }}
            />
          ) : (
            <div className="calendar-placeholder">
              <p>Google Calendar coming soon</p>
              <small>
                Add your Google Calendar embed URL in the CMS under Settings → Google Calendar URL
              </small>
            </div>
          )}
        </div>
      </section>

      {/* ── CONTACT ──────────────────────────────────────────────── */}
      <section className="contact" id="contact">
        <div className="section-header reveal">
          <div>
            <div className="section-label">Get in Touch</div>
            <h2 className="section-title">
              Questions, <em>always welcome.</em>
            </h2>
          </div>
          <p className="section-intro">
            Not ready to book, or have something specific to ask? Send a note and I&apos;ll get back
            to you within one business day.
          </p>
        </div>
        <div className="contact-grid">
          <div className="contact-info reveal">
            <div className="contact-detail">
              <small>Email</small>
              <p>{email}</p>
            </div>
            <div className="contact-detail">
              <small>Phone</small>
              <p>{phone}</p>
            </div>
            <div className="contact-detail">
              <small>Location</small>
              <p>
                {location}
                <br />
                <em
                  style={{
                    fontSize: 15,
                    color: 'var(--earth-soft)',
                    fontFamily: "'Inter', sans-serif",
                    fontStyle: 'normal',
                  }}
                >
                  {locationNote}
                </em>
              </p>
            </div>
            <div className="contact-detail">
              <small>Studio Hours</small>
              <p className="contact-hours">
                {hoursWeekday}
                <br />
                {hoursSaturday}
                <br />
                {hoursClosed}
              </p>
            </div>
          </div>
          <ContactForm />
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────── */}
      <footer>
        <a href="#" className="logo">
          Beautywell <em>Esthetics</em>
        </a>
        <p className="footer-tagline">{tagline}</p>
        <ul className="footer-links">
          <li><a href="#about">About</a></li>
          <li><a href="#booking">Services</a></li>
          <li><a href="#booking">Book</a></li>
          <li><a href="/intake">Intake Form</a></li>
          <li><a href="#contact">Contact</a></li>
        </ul>
        <div className="footer-bottom">
          © {new Date().getFullYear()} {businessName} · Licensed Esthetician · By Appointment Only
        </div>
      </footer>
    </>
  );
}
