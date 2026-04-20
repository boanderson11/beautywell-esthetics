import type { Metadata } from 'next';
import Link from 'next/link';
import IntakeForm from '@/components/IntakeForm';

export const metadata: Metadata = {
  title: 'Client Intake & Consent — Beautywell Esthetics',
  description:
    'Complete your intake, health history, and consent form before your first appointment at Beautywell Esthetics.',
};

export default function IntakePage() {
  return (
    <div className="intake-page">
      <header className="intake-nav">
        <Link href="/" className="logo">
          Beautywell <em>Esthetics</em>
        </Link>
        <Link href="/" className="intake-nav-back">
          ← Back to site
        </Link>
      </header>

      <section className="intake-hero">
        <div className="section-label">Client Intake</div>
        <h1>
          Welcome, and <em>thank you.</em>
        </h1>
        <p>
          Please complete this intake and consent form before your first appointment. Your
          responses help me tailor your treatment safely and thoughtfully. All information is
          kept strictly confidential.
        </p>
      </section>

      <div className="intake-container">
        <IntakeForm />
      </div>

      <p className="intake-footer-note">
        This form is for informational and consent purposes. Consult a licensed attorney for
        legal guidance specific to your practice.
      </p>
    </div>
  );
}
