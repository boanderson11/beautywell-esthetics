// Plain HTML email templates. Kept dependency-free so the webhook stays fast.

import { formatDate, formatMoney } from '@/lib/booking-format';
import { env } from '@/lib/env';

export type BookingEmailData = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  serviceName: string;
  addons: Array<{ name: string; price: number }>;
  date: string;
  time: string;
  totalCents: number;
  depositCents: number;
  notes?: string | null;
};

function escape(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const baseStyles = `
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  color: #2a2620;
  line-height: 1.6;
  max-width: 560px;
  margin: 0 auto;
  padding: 32px 24px;
`;

const labelStyle = `
  font-size: 11px;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: #6b4423;
`;

export function customerEmail(data: BookingEmailData): { subject: string; html: string; text: string } {
  const balanceCents = data.totalCents - data.depositCents;
  const subject = `Your Beautywell appointment is confirmed — ${formatDate(data.date)} at ${data.time}`;

  const addonsHtml = data.addons.length
    ? `<p style="${labelStyle}">Add-ons</p><ul style="margin: 4px 0 16px 20px; padding: 0;">${data.addons
        .map((a) => `<li>${escape(a.name)} — ${formatMoney(Math.round(a.price * 100))}</li>`)
        .join('')}</ul>`
    : '';

  const html = `<!doctype html>
<html>
  <body style="background:#faf7ef; margin:0;">
    <div style="${baseStyles}">
      <p style="${labelStyle}">Beautywell Esthetics</p>
      <h1 style="font-family: 'Cormorant Garamond', Georgia, serif; font-weight: 400; font-size: 28px; color: #3d5240; margin: 8px 0 24px 0;">
        Your appointment is <em>confirmed</em>.
      </h1>
      <p>Hi ${escape(data.firstName)},</p>
      <p>Thank you — your deposit has been received and your appointment is held.</p>

      <div style="border:1px solid #c5cfbe; border-radius:4px; padding:20px; margin:24px 0;">
        <p style="${labelStyle}">Service</p>
        <p style="margin:4px 0 16px 0; font-size:18px;">${escape(data.serviceName)}</p>
        ${addonsHtml}
        <p style="${labelStyle}">When</p>
        <p style="margin:4px 0 16px 0; font-size:18px;">${formatDate(data.date)} at ${escape(data.time)}</p>
        <p style="${labelStyle}">Where</p>
        <p style="margin:4px 0 16px 0;">Cypress, CA — exact address sent separately.</p>
        <hr style="border:none; border-top:1px solid #e8e0d0; margin:16px 0;" />
        <p style="display:flex; justify-content:space-between; margin:4px 0;">
          <span>Total</span><span>${formatMoney(data.totalCents)}</span>
        </p>
        <p style="display:flex; justify-content:space-between; margin:4px 0; color:#6b4423;">
          <span>Deposit paid</span><span>${formatMoney(data.depositCents)}</span>
        </p>
        <p style="display:flex; justify-content:space-between; margin:4px 0; font-weight:600;">
          <span>Balance due at appointment</span><span>${formatMoney(balanceCents)}</span>
        </p>
      </div>

      <p><strong>First-time client?</strong> Please complete your <a href="${env.SITE_URL}/intake" style="color:#6b4423;">intake & consent form</a> before your appointment.</p>

      <p style="font-size:13px; color:#7a7268; margin-top:32px;">
        <strong>Cancellation policy:</strong> Your deposit is non-refundable if you cancel within 48 hours of your appointment.
        To reschedule or cancel, reply to this email.
      </p>

      <p style="font-size:12px; color:#7a7268; margin-top:24px;">
        Booking reference: <code>${escape(data.id)}</code>
      </p>
    </div>
  </body>
</html>`;

  const text = [
    `Hi ${data.firstName},`,
    '',
    'Your Beautywell appointment is confirmed.',
    '',
    `Service: ${data.serviceName}`,
    ...(data.addons.length ? [`Add-ons: ${data.addons.map((a) => a.name).join(', ')}`] : []),
    `When: ${formatDate(data.date)} at ${data.time}`,
    '',
    `Total: ${formatMoney(data.totalCents)}`,
    `Deposit paid: ${formatMoney(data.depositCents)}`,
    `Balance due at appointment: ${formatMoney(balanceCents)}`,
    '',
    `First-time? Please complete your intake form: ${env.SITE_URL}/intake`,
    '',
    `Booking reference: ${data.id}`,
  ].join('\n');

  return { subject, html, text };
}

export type RescheduleEmailData = BookingEmailData & {
  previousDate: string;
  previousTime: string;
};

export function customerRescheduledEmail(data: RescheduleEmailData): { subject: string; html: string; text: string } {
  const subject = `Your Beautywell appointment has been rescheduled — ${formatDate(data.date)} at ${data.time}`;

  const html = `<!doctype html>
<html>
  <body style="background:#faf7ef; margin:0;">
    <div style="${baseStyles}">
      <p style="${labelStyle}">Beautywell Esthetics</p>
      <h1 style="font-family: 'Cormorant Garamond', Georgia, serif; font-weight: 400; font-size: 28px; color: #3d5240; margin: 8px 0 24px 0;">
        Your appointment has been <em>rescheduled</em>.
      </h1>
      <p>Hi ${escape(data.firstName)},</p>
      <p>Your Beautywell appointment has been moved. Please update your calendar.</p>

      <div style="border:1px solid #c5cfbe; border-radius:4px; padding:20px; margin:24px 0;">
        <p style="${labelStyle}">Previously</p>
        <p style="margin:4px 0 16px 0; color:#7a7268; text-decoration: line-through;">${formatDate(data.previousDate)} at ${escape(data.previousTime)}</p>
        <p style="${labelStyle}">New time</p>
        <p style="margin:4px 0 16px 0; font-size:18px; color:#3d5240;">${formatDate(data.date)} at ${escape(data.time)}</p>
        <p style="${labelStyle}">Service</p>
        <p style="margin:4px 0 0 0;">${escape(data.serviceName)}</p>
      </div>

      <p style="font-size:13px; color:#7a7268; margin-top:32px;">
        Your deposit is still applied to this appointment — no further action needed.
        If this new time doesn&rsquo;t work, reply to this email and we&rsquo;ll find another.
      </p>

      <p style="font-size:12px; color:#7a7268; margin-top:24px;">
        Booking reference: <code>${escape(data.id)}</code>
      </p>
    </div>
  </body>
</html>`;

  const text = [
    `Hi ${data.firstName},`,
    '',
    'Your Beautywell appointment has been rescheduled.',
    '',
    `Previously: ${formatDate(data.previousDate)} at ${data.previousTime}`,
    `New time:   ${formatDate(data.date)} at ${data.time}`,
    `Service:    ${data.serviceName}`,
    '',
    'Your deposit is still applied to this appointment.',
    'If this new time doesn\'t work, reply to this email.',
    '',
    `Booking reference: ${data.id}`,
  ].join('\n');

  return { subject, html, text };
}

export function ownerRescheduledEmail(data: RescheduleEmailData): { subject: string; html: string; text: string } {
  const subject = `Rescheduled — ${data.firstName} ${data.lastName} · now ${formatDate(data.date)} ${data.time}`;

  const html = `<!doctype html>
<html>
  <body style="background:#faf7ef; margin:0;">
    <div style="${baseStyles}">
      <p style="${labelStyle}">Booking Rescheduled</p>
      <h1 style="font-family: 'Cormorant Garamond', Georgia, serif; font-weight:400; font-size:26px; color:#3d5240; margin:8px 0 20px 0;">
        ${escape(data.firstName)} ${escape(data.lastName)}
      </h1>
      <ul style="line-height:1.9; padding-left:20px;">
        <li><strong>Was:</strong> <span style="color:#7a7268; text-decoration: line-through;">${formatDate(data.previousDate)} at ${escape(data.previousTime)}</span></li>
        <li><strong>Now:</strong> ${formatDate(data.date)} at ${escape(data.time)}</li>
        <li><strong>Service:</strong> ${escape(data.serviceName)}</li>
        <li><strong>Email:</strong> <a href="mailto:${escape(data.email)}">${escape(data.email)}</a></li>
        <li><strong>Phone:</strong> <a href="tel:${escape(data.phone)}">${escape(data.phone)}</a></li>
      </ul>
      <p style="font-size:12px; color:#7a7268; margin-top:24px;">
        Reference: <code>${escape(data.id)}</code>
      </p>
    </div>
  </body>
</html>`;

  const text = [
    `Booking rescheduled.`,
    '',
    `Client: ${data.firstName} ${data.lastName}`,
    `Was: ${formatDate(data.previousDate)} at ${data.previousTime}`,
    `Now: ${formatDate(data.date)} at ${data.time}`,
    `Service: ${data.serviceName}`,
    `Email: ${data.email}`,
    `Phone: ${data.phone}`,
    '',
    `Reference: ${data.id}`,
  ].join('\n');

  return { subject, html, text };
}

export function ownerEmail(data: BookingEmailData): { subject: string; html: string; text: string } {
  const subject = `New booking — ${data.firstName} ${data.lastName} · ${formatDate(data.date)} ${data.time}`;
  const addonsHtml = data.addons.length
    ? `<li><strong>Add-ons:</strong> ${data.addons.map((a) => escape(a.name)).join(', ')}</li>`
    : '';
  const notesHtml = data.notes
    ? `<p style="margin-top:16px;"><strong>Notes from client:</strong><br/>${escape(data.notes).replace(/\n/g, '<br/>')}</p>`
    : '';

  const html = `<!doctype html>
<html>
  <body style="background:#faf7ef; margin:0;">
    <div style="${baseStyles}">
      <p style="${labelStyle}">New Booking · Deposit Paid</p>
      <h1 style="font-family: 'Cormorant Garamond', Georgia, serif; font-weight:400; font-size:26px; color:#3d5240; margin:8px 0 20px 0;">
        ${escape(data.firstName)} ${escape(data.lastName)}
      </h1>
      <ul style="line-height:1.9; padding-left:20px;">
        <li><strong>When:</strong> ${formatDate(data.date)} at ${escape(data.time)}</li>
        <li><strong>Service:</strong> ${escape(data.serviceName)}</li>
        ${addonsHtml}
        <li><strong>Total:</strong> ${formatMoney(data.totalCents)} · <strong>Deposit:</strong> ${formatMoney(data.depositCents)}</li>
        <li><strong>Email:</strong> <a href="mailto:${escape(data.email)}">${escape(data.email)}</a></li>
        <li><strong>Phone:</strong> <a href="tel:${escape(data.phone)}">${escape(data.phone)}</a></li>
      </ul>
      ${notesHtml}
      <p style="font-size:12px; color:#7a7268; margin-top:24px;">
        Reference: <code>${escape(data.id)}</code>
      </p>
    </div>
  </body>
</html>`;

  const text = [
    `New booking — deposit paid.`,
    '',
    `Client: ${data.firstName} ${data.lastName}`,
    `When: ${formatDate(data.date)} at ${data.time}`,
    `Service: ${data.serviceName}`,
    ...(data.addons.length ? [`Add-ons: ${data.addons.map((a) => a.name).join(', ')}`] : []),
    `Total: ${formatMoney(data.totalCents)} | Deposit: ${formatMoney(data.depositCents)}`,
    `Email: ${data.email}`,
    `Phone: ${data.phone}`,
    ...(data.notes ? ['', `Notes: ${data.notes}`] : []),
    '',
    `Reference: ${data.id}`,
  ].join('\n');

  return { subject, html, text };
}
