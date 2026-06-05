'use client';

import { useState } from 'react';

const SUBJECTS = [
  'General Question',
  'Booking Inquiry',
  'Skin Consultation',
  'Gift Card',
  'Other',
] as const;

export default function ContactForm() {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState('');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState<(typeof SUBJECTS)[number]>('General Question');
  const [message, setMessage] = useState('');
  // Honeypot — hidden from real users, bots fill it in.
  const [website, setWebsite] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setErr('');

    try {
      const res = await fetch('/api/submit-contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, subject, message, website }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Could not send your message. Please try again.');
      }
      setSubmitted(true);
    } catch (e) {
      setErr((e as Error).message);
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="contact-form">
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div
            style={{
              width: 56, height: 56, margin: '0 auto 20px',
              background: 'var(--sage-wash)', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--sage-deep)',
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: 28, fontWeight: 400,
            color: 'var(--sage-deep)', marginBottom: 10,
          }}>
            Thank you, {name}.
          </h3>
          <p style={{ color: 'var(--earth-soft)', fontSize: 14 }}>
            Your message is on its way. I&apos;ll reply within one business day.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form className="contact-form" onSubmit={handleSubmit}>
      <div className="form-row">
        <div className="form-group">
          <label>Name</label>
          <input
            type="text"
            name="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={submitting}
          />
        </div>
        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            name="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={submitting}
          />
        </div>
      </div>
      <div className="form-group">
        <label>Subject</label>
        <select
          name="subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value as (typeof SUBJECTS)[number])}
          disabled={submitting}
        >
          {SUBJECTS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>
      <div className="form-group" style={{ marginTop: 16 }}>
        <label>Message</label>
        <textarea
          name="message"
          required
          placeholder="Tell me what you're looking for..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={submitting}
        />
      </div>
      {/* Honeypot: tucked off-screen, hidden from screen readers. */}
      <div
        aria-hidden="true"
        style={{ position: 'absolute', left: '-10000px', top: 'auto', width: 1, height: 1, overflow: 'hidden' }}
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
      {err && (
        <div
          style={{
            marginTop: 12,
            padding: '10px 14px',
            background: '#fde8e8',
            color: '#7a2020',
            border: '1px solid #f5b8b8',
            borderRadius: 3,
            fontSize: 13,
          }}
        >
          {err}
        </div>
      )}
      <button type="submit" className="btn-submit" disabled={submitting}>
        {submitting ? 'Sending…' : 'Send Message'}
      </button>
    </form>
  );
}
