'use client';

import { useState } from 'react';

export default function ContactForm() {
  const [submitted, setSubmitted] = useState(false);
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitted(true);
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
            I&apos;ll reply within one business day.
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
          />
        </div>
        <div className="form-group">
          <label>Email</label>
          <input type="email" name="email" required />
        </div>
      </div>
      <div className="form-group">
        <label>Subject</label>
        <select name="subject">
          <option>General Question</option>
          <option>Booking Inquiry</option>
          <option>Skin Consultation</option>
          <option>Gift Card</option>
          <option>Other</option>
        </select>
      </div>
      <div className="form-group" style={{ marginTop: 16 }}>
        <label>Message</label>
        <textarea
          name="message"
          required
          placeholder="Tell me what you're looking for..."
        />
      </div>
      <button type="submit" className="btn-submit">
        Send Message
      </button>
    </form>
  );
}
