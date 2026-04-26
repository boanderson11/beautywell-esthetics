// Plain HTML reminder templates. Same dependency-free pattern as booking-emails.ts
// so the cron handler stays fast and predictable.

import { formatDate } from '@/lib/booking-format';
import { env } from '@/lib/env';

export type ReminderEmailData = {
  id: string;
  firstName: string;
  serviceName: string;
  date: string;
  time: string;
  intakeCompleted: boolean;
};

export type IntakeReminderEmailData = {
  id: string;
  firstName: string;
  serviceName: string;
  date: string;
  time: string;
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

const buttonStyle = `
  display: inline-block;
  background: #3d5240;
  color: #faf7ef;
  text-decoration: none;
  padding: 12px 24px;
  border-radius: 4px;
  font-size: 14px;
  letter-spacing: 1px;
  margin: 8px 0;
`;

export function appointmentReminderEmail(
  data: ReminderEmailData,
): { subject: string; html: string; text: string } {
  const subject = `Reminder: your Beautywell appointment is tomorrow at ${data.time}`;

  const intakeBlock = data.intakeCompleted
    ? ''
    : `<p style="background:#fdf6e3; border-left:3px solid #d4a35a; padding:12px 16px; margin:16px 0;">
         <strong>Heads up:</strong> we don't have your intake form on file yet.
         Please <a href="${env.SITE_URL}/intake" style="color:#6b4423;">complete it now</a>
         so we can make the most of our time together.
       </p>`;

  const html = `<!doctype html>
<html>
  <body style="background:#faf7ef; margin:0;">
    <div style="${baseStyles}">
      <p style="${labelStyle}">Beautywell Esthetics</p>
      <h1 style="font-family: 'Cormorant Garamond', Georgia, serif; font-weight: 400; font-size: 28px; color: #3d5240; margin: 8px 0 24px 0;">
        See you <em>tomorrow</em>.
      </h1>
      <p>Hi ${escape(data.firstName)},</p>
      <p>This is a friendly reminder of your upcoming appointment.</p>

      <div style="border:1px solid #c5cfbe; border-radius:4px; padding:20px; margin:24px 0;">
        <p style="${labelStyle}">Service</p>
        <p style="margin:4px 0 16px 0; font-size:18px;">${escape(data.serviceName)}</p>
        <p style="${labelStyle}">When</p>
        <p style="margin:4px 0 16px 0; font-size:18px;">${formatDate(data.date)} at ${escape(data.time)}</p>
        <p style="${labelStyle}">Where</p>
        <p style="margin:4px 0;">Cypress, CA — exact address sent separately.</p>
      </div>

      ${intakeBlock}

      <p style="font-size:13px; color:#7a7268; margin-top:24px;">
        <strong>Need to reschedule?</strong> Reply to this email as soon as possible.
        Cancellations within 48 hours of your appointment forfeit the deposit.
      </p>

      <p style="font-size:13px; color:#7a7268;">
        <strong>A few tips for your visit:</strong> arrive with clean skin if possible,
        skip retinols and exfoliants for 48 hours beforehand, and bring a list of any
        new medications or skincare products.
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
    `This is a reminder of your Beautywell appointment tomorrow.`,
    '',
    `Service: ${data.serviceName}`,
    `When: ${formatDate(data.date)} at ${data.time}`,
    `Where: Cypress, CA — exact address sent separately.`,
    '',
    ...(data.intakeCompleted
      ? []
      : [
          `Heads up: we don't have your intake form on file yet.`,
          `Please complete it now: ${env.SITE_URL}/intake`,
          '',
        ]),
    `Need to reschedule? Reply to this email as soon as possible.`,
    `Cancellations within 48 hours forfeit the deposit.`,
    '',
    `Booking reference: ${data.id}`,
  ].join('\n');

  return { subject, html, text };
}

export function intakeReminderEmail(
  data: IntakeReminderEmailData,
): { subject: string; html: string; text: string } {
  const subject = `Action needed: complete your intake form before your Beautywell appointment`;

  const html = `<!doctype html>
<html>
  <body style="background:#faf7ef; margin:0;">
    <div style="${baseStyles}">
      <p style="${labelStyle}">Beautywell Esthetics</p>
      <h1 style="font-family: 'Cormorant Garamond', Georgia, serif; font-weight: 400; font-size: 28px; color: #3d5240; margin: 8px 0 24px 0;">
        One quick step before your <em>${escape(data.serviceName)}</em>.
      </h1>
      <p>Hi ${escape(data.firstName)},</p>
      <p>
        We're looking forward to seeing you on
        <strong>${formatDate(data.date)} at ${escape(data.time)}</strong>.
        Before you arrive, please take a few minutes to complete your intake &amp;
        consent form. It covers your skin history, allergies, and the consents we need
        to perform your treatment safely.
      </p>

      <p style="text-align:center; margin:28px 0;">
        <a href="${env.SITE_URL}/intake" style="${buttonStyle}">
          Complete your intake form
        </a>
      </p>

      <p style="font-size:13px; color:#7a7268;">
        It takes about 5 minutes and saves us valuable treatment time when you arrive.
        If you've already submitted it, please disregard this reminder.
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
    `Before your Beautywell appointment on ${formatDate(data.date)} at ${data.time},`,
    `please complete your intake & consent form:`,
    '',
    `${env.SITE_URL}/intake`,
    '',
    `It takes about 5 minutes. If you've already submitted it, please disregard.`,
    '',
    `Booking reference: ${data.id}`,
  ].join('\n');

  return { subject, html, text };
}
