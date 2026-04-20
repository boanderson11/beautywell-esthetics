'use client';

import { useState } from 'react';

interface FormData {
  firstName: string;
  lastName: string;
  dob: string;
  email: string;
  phone: string;
  emergencyName: string;
  emergencyPhone: string;
  referral: string;
  firstFacial: string;
  medical: string[];
  medications: string;
  allergies: string;
  recentProcedures: string[];
  skinConcerns: string[];
  skincareRoutine: string;
  consents: Record<string, boolean>;
  photoRelease: boolean;
  signature: string;
  signatureConfirm: boolean;
}

const EMPTY: FormData = {
  firstName: '', lastName: '', dob: '', email: '', phone: '',
  emergencyName: '', emergencyPhone: '',
  referral: '', firstFacial: '',
  medical: [], medications: '', allergies: '',
  recentProcedures: [], skinConcerns: [], skincareRoutine: '',
  consents: {}, photoRelease: false,
  signature: '', signatureConfirm: false,
};

export default function IntakeForm() {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<FormData>(EMPTY);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const update = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setData((d) => ({ ...d, [key]: value }));
  };

  const toggleArray = (key: 'medical' | 'recentProcedures' | 'skinConcerns', value: string) => {
    setData((d) => {
      const arr = d[key];
      const has = arr.includes(value);
      let next = has ? arr.filter((v) => v !== value) : [...arr, value];
      if (key === 'medical') {
        if (!has && value === 'None of the above') next = ['None of the above'];
        else if (!has) next = next.filter((v) => v !== 'None of the above');
      }
      if (key === 'recentProcedures') {
        if (!has && value === 'None') next = ['None'];
        else if (!has) next = next.filter((v) => v !== 'None');
      }
      return { ...d, [key]: next };
    });
  };

  const toggleConsent = (key: string) => {
    setData((d) => ({ ...d, consents: { ...d.consents, [key]: !d.consents[key] } }));
  };

  const isMinor = (() => {
    if (!data.dob) return false;
    const dob = new Date(data.dob);
    if (isNaN(dob.getTime())) return false;
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
    return age < 18;
  })();

  const validEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
  const validPhone = (s: string) => s.replace(/\D/g, '').length >= 10;

  const CONSENT_KEYS = ['facial', 'peel', 'device', 'led', 'dermaplane', 'wax', 'cancellation', 'liability'];

  const validateStep = (n: number): string => {
    if (n === 1) {
      if (!data.firstName.trim()) return 'First name is required.';
      if (!data.lastName.trim()) return 'Last name is required.';
      if (!data.dob) return 'Date of birth is required.';
      if (!validEmail(data.email)) return 'Please enter a valid email address.';
      if (!validPhone(data.phone)) return 'Please enter a valid phone number.';
      if (!data.emergencyName.trim()) return 'Emergency contact name is required.';
      if (!validPhone(data.emergencyPhone)) return 'Please enter a valid emergency contact phone.';
      if (!data.firstFacial) return 'Please indicate whether this is your first professional facial.';
    }
    if (n === 2) {
      if (data.skinConcerns.length === 0) return 'Please select at least one skin concern (or choose "General maintenance / glow").';
    }
    if (n === 3) {
      const required = ['facial', 'peel', 'device', 'led', 'dermaplane', 'wax'];
      for (const k of required) {
        if (!data.consents[k]) return 'Please acknowledge all treatment consents to continue.';
      }
    }
    if (n === 4) {
      if (!data.consents.cancellation) return 'Please agree to the cancellation policy.';
      if (!data.consents.liability) return 'Please agree to the liability release.';
      if (!data.signature.trim()) return 'Please type your full legal name as your signature.';
      if (!data.signatureConfirm) return 'Please confirm that your information is accurate.';
    }
    return '';
  };

  const next = () => {
    const err = validateStep(step);
    if (err) { setError(err); return; }
    setError('');
    setStep(step + 1);
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const back = () => {
    setError('');
    setStep(step - 1);
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async () => {
    const err = validateStep(4);
    if (err) { setError(err); return; }
    setError('');
    setSubmitting(true);
    const payload = {
      ...data,
      signedAt: new Date().toISOString(),
      isMinor,
    };
    console.log('[Intake] submission payload:', payload);
    try {
      // TODO: plug in a real submission endpoint (Formspree, EmailJS, or backend).
      // This fires a request to /api/submit-intake which stores the payload in
      // content/intakes.json via GitHub when GITHUB_TOKEN is configured.
      await fetch('/api/submit-intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch {
      // Still show confirmation — Paulina can follow up if we didn't capture it server-side
    }
    setSubmitting(false);
    setSubmitted(true);
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const todayStr = new Date().toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  if (submitted) {
    return (
      <div className="intake-form">
        <div className="intake-confirmation">
          <div className="confirmation-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="confirmation-title">
            Thank you, <em>{data.firstName}.</em>
          </h3>
          <p className="confirmation-text">
            Your intake form has been received. You&apos;re all set for your appointment. If
            anything changes with your health or medications before your visit, please let me
            know so we can update your file.
          </p>
          <a href="/" className="btn-primary" style={{ display: 'inline-flex' }}>
            Return to Main Site
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="intake-form">
      <div className="booking-progress">
        {[
          { n: 1, label: 'Personal' },
          { n: 2, label: 'Health' },
          { n: 3, label: 'Consent' },
          { n: 4, label: 'Sign' },
        ].map(({ n, label }) => (
          <div
            key={n}
            className={`progress-step${step === n ? ' active' : ''}${step > n ? ' completed' : ''}`}
          >
            <div className="progress-circle">{step > n ? '✓' : n}</div>
            <div className="progress-label">{label}</div>
          </div>
        ))}
      </div>

      {/* Step 1: Personal Information */}
      <div className={`intake-step${step === 1 ? ' active' : ''}`}>
        <h3 className="step-title">Personal Information</h3>
        <p className="step-subtitle">A few details so I can reach you and keep your file accurate.</p>

        <div className="form-row">
          <div className="form-group">
            <label>First Name</label>
            <input type="text" required value={data.firstName} onChange={(e) => update('firstName', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Last Name</label>
            <input type="text" required value={data.lastName} onChange={(e) => update('lastName', e.target.value)} />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Date of Birth</label>
            <input type="date" required value={data.dob} onChange={(e) => update('dob', e.target.value)} />
            {isMinor && (
              <div className="intake-notice">
                Clients under 18 must be accompanied by a parent or guardian who will co-sign this
                form at the time of the appointment.
              </div>
            )}
          </div>
          <div className="form-group">
            <label>How did you hear about us? (optional)</label>
            <select value={data.referral} onChange={(e) => update('referral', e.target.value)}>
              <option value="">Select one…</option>
              <option>Instagram</option>
              <option>Google</option>
              <option>Friend / Referral</option>
              <option>Other</option>
            </select>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Email</label>
            <input type="email" required value={data.email} onChange={(e) => update('email', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Phone</label>
            <input type="tel" required value={data.phone} onChange={(e) => update('phone', e.target.value)} />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Emergency Contact Name</label>
            <input type="text" required value={data.emergencyName} onChange={(e) => update('emergencyName', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Emergency Contact Phone</label>
            <input type="tel" required value={data.emergencyPhone} onChange={(e) => update('emergencyPhone', e.target.value)} />
          </div>
        </div>

        <fieldset className="intake-fieldset" style={{ marginTop: 8 }}>
          <legend>Is this your first professional facial?</legend>
          <div className="intake-radio-row">
            {['Yes', 'No'].map((opt) => (
              <label key={opt} className={data.firstFacial === opt ? 'checked' : ''}>
                <input
                  type="radio"
                  name="firstFacial"
                  value={opt}
                  checked={data.firstFacial === opt}
                  onChange={() => update('firstFacial', opt)}
                />
                {opt}
              </label>
            ))}
          </div>
        </fieldset>
      </div>

      {/* Step 2: Health & Skin History */}
      <div className={`intake-step${step === 2 ? ' active' : ''}`}>
        <h3 className="step-title">Health &amp; Skin History</h3>
        <p className="step-subtitle">This helps me treat your skin safely. Please be as accurate as possible.</p>

        <fieldset className="intake-fieldset">
          <legend>Medical history — check all that apply</legend>
          <div className="intake-check-grid">
            {[
              'Currently pregnant or breastfeeding',
              'Diabetes',
              'Autoimmune disorder (lupus, eczema, psoriasis)',
              'Epilepsy or seizure disorder',
              'Heart condition or pacemaker',
              'Cancer (current or recent treatment)',
              'Hepatitis or blood-borne conditions',
              'History of cold sores / herpes simplex',
              'History of keloid scarring',
              'Rosacea',
              'Active acne (cystic or inflamed)',
              'Skin cancer or suspicious moles',
              'Recent sunburn (within past 2 weeks)',
              'None of the above',
            ].map((item) => (
              <label
                key={item}
                className={`intake-check-item${data.medical.includes(item) ? ' checked' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={data.medical.includes(item)}
                  onChange={() => toggleArray('medical', item)}
                />
                <span>{item}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="form-group" style={{ marginBottom: 24 }}>
          <label>
            List any medications, supplements, or topical prescriptions you currently use
            (including Accutane, retinoids, blood thinners, antibiotics, birth control).
          </label>
          <textarea
            placeholder="e.g., tretinoin 0.05% nightly, oral birth control, vitamin D…"
            value={data.medications}
            onChange={(e) => update('medications', e.target.value)}
          />
        </div>

        <div className="form-group" style={{ marginBottom: 24 }}>
          <label>
            List any known allergies (ingredients, latex, adhesives, nuts, aspirin, fragrances, etc.)
          </label>
          <textarea
            placeholder="e.g., latex, tree nuts, salicylic acid…"
            value={data.allergies}
            onChange={(e) => update('allergies', e.target.value)}
          />
        </div>

        <fieldset className="intake-fieldset">
          <legend>Recent procedures — within the past 4 weeks</legend>
          <div className="intake-check-grid">
            {[
              'Botox or filler injections',
              'Laser treatment',
              'Microneedling',
              'Chemical peel (at another provider)',
              'Cosmetic surgery',
              'Waxing in the treatment area',
              'None',
            ].map((item) => (
              <label
                key={item}
                className={`intake-check-item${data.recentProcedures.includes(item) ? ' checked' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={data.recentProcedures.includes(item)}
                  onChange={() => toggleArray('recentProcedures', item)}
                />
                <span>{item}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="intake-fieldset">
          <legend>Skin concerns — check your top priorities</legend>
          <div className="intake-check-grid">
            {[
              'Acne / breakouts',
              'Hyperpigmentation / dark spots',
              'Fine lines / wrinkles',
              'Dullness / uneven texture',
              'Dehydration / dryness',
              'Redness / sensitivity',
              'Large pores / congestion',
              'Sun damage',
              'General maintenance / glow',
            ].map((item) => (
              <label
                key={item}
                className={`intake-check-item${data.skinConcerns.includes(item) ? ' checked' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={data.skinConcerns.includes(item)}
                  onChange={() => toggleArray('skinConcerns', item)}
                />
                <span>{item}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="form-group">
          <label>Briefly describe your current at-home skincare routine (optional but helpful)</label>
          <textarea
            placeholder="e.g., cleanser + moisturizer AM, double cleanse + retinol PM…"
            value={data.skincareRoutine}
            onChange={(e) => update('skincareRoutine', e.target.value)}
          />
        </div>
      </div>

      {/* Step 3: Treatment Consent & Risk Acknowledgment */}
      <div className={`intake-step${step === 3 ? ' active' : ''}`}>
        <h3 className="step-title">Treatment Consent &amp; Risk Acknowledgment</h3>
        <p className="step-subtitle">
          Please read each section carefully. You must acknowledge all treatment types, as any
          may be incorporated into your personalized session.
        </p>

        {[
          {
            key: 'facial',
            title: 'General Facial Consent',
            body: [
              'I understand that skincare treatments including facials, exfoliation, extractions, and mask application may result in temporary redness, sensitivity, irritation, breakouts (purging), or mild discomfort. I understand that results vary by individual and are not guaranteed.',
            ],
            ack: 'I have read and understand the above.',
          },
          {
            key: 'peel',
            title: 'Chemical Peel Consent',
            body: [
              'I understand that chemical peel treatments use professional-grade acids (AHA, BHA, and/or botanical blends) and may result in: redness, stinging or warming sensation during treatment, skin peeling or flaking for 3–7 days, temporary sun sensitivity, temporary pigmentation changes (lightening or darkening), and in rare cases, scarring or infection.',
              'I understand that I must avoid direct sun exposure and use SPF 30+ daily following treatment. I understand that I must disclose use of retinoids, Accutane (isotretinoin), or any prescription skin treatments, as these may be contraindicated. I understand this treatment is NOT suitable during pregnancy or breastfeeding.',
            ],
            ack: 'I have read and understand the risks associated with chemical peel treatments.',
          },
          {
            key: 'device',
            title: 'Microcurrent / Device Consent',
            body: [
              'I understand that device-assisted treatments including microcurrent lifting and infusion technology use low-level electrical currents and/or pressure-based delivery systems. These treatments are contraindicated for individuals with pacemakers, implanted defibrillators, epilepsy, active cancer, pregnancy, or metal implants in the treatment area. I understand I must disclose any of these conditions.',
            ],
            ack: 'I have read and understand the risks associated with device-assisted treatments.',
          },
          {
            key: 'led',
            title: 'LED Light Therapy Consent',
            body: [
              'I understand that LED light therapy uses specific wavelengths of light (red, blue, and/or near-infrared) to stimulate cellular activity. Protective eyewear will be provided and must be worn during treatment. LED therapy is contraindicated for individuals currently taking photosensitizing medications, those with a history of light-triggered seizures, and during pregnancy. Side effects are rare but may include temporary warmth or redness.',
            ],
            ack: 'I have read and understand the risks associated with LED light therapy.',
          },
          {
            key: 'dermaplane',
            title: 'Dermaplaning Consent',
            body: [
              'I understand that dermaplaning uses a sterile surgical blade to remove dead skin cells and fine facial hair (vellus hair). Temporary redness and sensitivity are common. This treatment is not recommended for active acne, inflamed skin, or if I am currently using isotretinoin (Accutane). I understand that hair will grow back at its normal rate and texture.',
            ],
            ack: 'I have read and understand the risks associated with dermaplaning.',
          },
          {
            key: 'wax',
            title: 'Waxing Consent',
            body: [
              'I understand that facial waxing may result in temporary redness, irritation, bumps, or in rare cases, bruising, burns, or ingrown hairs. Waxing should not be performed on skin that has been treated with retinoids, chemical peels, or Accutane within the past 7–14 days, or on sunburned, broken, or irritated skin.',
            ],
            ack: 'I have read and understand the risks associated with waxing.',
          },
        ].map(({ key, title, body, ack }) => (
          <div key={key} className="intake-consent-block">
            <h4>{title}</h4>
            {body.map((para, i) => (
              <p key={i} className="intake-consent-text">{para}</p>
            ))}
            <label className={`intake-consent-check${data.consents[key] ? ' checked' : ''}`}>
              <input
                type="checkbox"
                checked={!!data.consents[key]}
                onChange={() => toggleConsent(key)}
              />
              <span>{ack}</span>
            </label>
          </div>
        ))}
      </div>

      {/* Step 4: Policies, Liability Release & Signature */}
      <div className={`intake-step${step === 4 ? ' active' : ''}`}>
        <h3 className="step-title">Policies, Liability &amp; Signature</h3>
        <p className="step-subtitle">Please review and sign to complete your intake.</p>

        <div className="intake-consent-block">
          <h4>Cancellation &amp; Deposit Policy</h4>
          <p className="intake-consent-text">
            Beautywell Esthetics requires a 50% deposit at the time of booking. Deposits are
            non-refundable if cancelled within 48 hours of the appointment. No-shows will
            forfeit the full deposit. Late arrivals may result in a shortened treatment to
            respect subsequent bookings.
          </p>
          <label className={`intake-consent-check${data.consents.cancellation ? ' checked' : ''}`}>
            <input
              type="checkbox"
              checked={!!data.consents.cancellation}
              onChange={() => toggleConsent('cancellation')}
            />
            <span>I understand and agree to the cancellation and deposit policy.</span>
          </label>
        </div>

        <div className="intake-consent-block">
          <h4>Liability Release &amp; Hold Harmless</h4>
          <p className="intake-consent-text">
            I confirm that I have accurately and completely disclosed all relevant medical
            history, medications, allergies, and skin conditions on this form. I understand that
            withholding or providing inaccurate information may result in adverse reactions for
            which Beautywell Esthetics cannot be held responsible.
          </p>
          <p className="intake-consent-text">
            I voluntarily consent to the skincare treatment(s) selected during my appointment. I
            understand that all treatments carry inherent risks, including but not limited to
            redness, irritation, allergic reaction, pigmentation changes, breakouts, and in rare
            cases, scarring or infection.
          </p>
          <p className="intake-consent-text">
            I release and hold harmless Beautywell Esthetics, its owner, and its staff from any
            and all liability, claims, or damages arising from treatments performed, except in
            cases of gross negligence.
          </p>
          <p className="intake-consent-text">
            I understand that results are not guaranteed and may vary based on individual skin
            type, condition, lifestyle, and adherence to post-care instructions.
          </p>
          <label className={`intake-consent-check${data.consents.liability ? ' checked' : ''}`}>
            <input
              type="checkbox"
              checked={!!data.consents.liability}
              onChange={() => toggleConsent('liability')}
            />
            <span>I have read, understand, and agree to the liability release above.</span>
          </label>
        </div>

        <div className="intake-consent-block">
          <h4>Photo &amp; Video Release (optional)</h4>
          <p className="intake-consent-text">
            I grant Beautywell Esthetics permission to take before-and-after photographs of my
            treatment results for use in marketing materials, social media, and the studio
            portfolio. My full name will not be used without additional written consent. I
            understand I may revoke this permission at any time.
          </p>
          <label className={`intake-consent-check${data.photoRelease ? ' checked' : ''}`}>
            <input
              type="checkbox"
              checked={data.photoRelease}
              onChange={(e) => update('photoRelease', e.target.checked)}
            />
            <span>I consent to the photo &amp; video release.</span>
          </label>
        </div>

        <div className="intake-consent-block">
          <h4>Confidentiality</h4>
          <p className="intake-consent-text">
            I understand that all personal and medical information provided in this form will be
            kept strictly confidential and will not be shared with third parties except as
            required by law.
          </p>
        </div>

        <div className="intake-signature-block">
          <p>
            By typing your full legal name below, you confirm that you have read, understood,
            and agree to all sections of this intake and consent form. This electronic signature
            carries the same legal weight as a handwritten signature.
          </p>
          <div className="form-row">
            <div className="form-group">
              <label>Full Legal Name</label>
              <input
                type="text"
                required
                value={data.signature}
                onChange={(e) => update('signature', e.target.value)}
                placeholder="Type your full legal name"
              />
            </div>
            <div className="form-group">
              <label>Today&apos;s Date</label>
              <input type="text" value={todayStr} readOnly />
            </div>
          </div>
          <label
            className={`intake-consent-check${data.signatureConfirm ? ' checked' : ''}`}
            style={{ marginTop: 12 }}
          >
            <input
              type="checkbox"
              checked={data.signatureConfirm}
              onChange={(e) => update('signatureConfirm', e.target.checked)}
            />
            <span>
              I confirm that all information provided is accurate and complete to the best of
              my knowledge.
            </span>
          </label>
        </div>
      </div>

      <div className="booking-nav">
        {step > 1 ? (
          <button type="button" className="booking-btn back" onClick={back}>Back</button>
        ) : <span />}
        {step < 4 ? (
          <button type="button" className="booking-btn next" onClick={next}>Continue</button>
        ) : (
          <button
            type="button"
            className="booking-btn next"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? 'Submitting…' : 'Submit Intake Form'}
          </button>
        )}
      </div>

      {error && <div className="intake-error">{error}</div>}

      <span style={{ display: 'none' }}>{todayStr}</span>
    </div>
  );
}
