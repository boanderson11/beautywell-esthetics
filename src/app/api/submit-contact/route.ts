import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { resend } from '@/lib/resend';
import { env } from '@/lib/env';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ALLOWED_SUBJECTS = [
  'General Question',
  'Booking Inquiry',
  'Skin Consultation',
  'Gift Card',
  'Other',
] as const;

const schema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(200),
  subject: z.enum(ALLOWED_SUBJECTS),
  message: z.string().trim().min(1).max(4000),
  // Honeypot — bots fill hidden fields, humans leave them blank.
  website: z.string().max(0).optional(),
});

function escape(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return NextResponse.json(
      { error: first?.message ?? 'Invalid input.' },
      { status: 400 },
    );
  }
  const { name, email, subject, message, website } = parsed.data;

  // Honeypot — quietly accept so bots think they succeeded.
  if (website && website.length > 0) {
    return NextResponse.json({ success: true });
  }

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; color: #2a2620;">
      <h2 style="font-family: 'Cormorant Garamond', serif; font-style: italic; font-weight: 400; color: #3d5240; margin-bottom: 16px;">New contact form message</h2>
      <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
        <tr><td style="padding: 6px 12px 6px 0; color: #7a7268; vertical-align: top;">Name</td><td style="padding: 6px 0;">${escape(name)}</td></tr>
        <tr><td style="padding: 6px 12px 6px 0; color: #7a7268; vertical-align: top;">Email</td><td style="padding: 6px 0;"><a href="mailto:${escape(email)}" style="color: #6b4423;">${escape(email)}</a></td></tr>
        <tr><td style="padding: 6px 12px 6px 0; color: #7a7268; vertical-align: top;">Subject</td><td style="padding: 6px 0;">${escape(subject)}</td></tr>
      </table>
      <div style="margin-top: 18px; padding: 14px 16px; background: #f5f1e8; border-left: 3px solid #5a7356; border-radius: 3px; line-height: 1.6; white-space: pre-wrap;">${escape(message)}</div>
      <p style="margin-top: 24px; font-size: 12px; color: #7a7268;">Reply directly to this email to respond to ${escape(name)}.</p>
    </div>
  `;

  const text = [
    'New contact form message',
    '',
    `Name: ${name}`,
    `Email: ${email}`,
    `Subject: ${subject}`,
    '',
    message,
    '',
    `(Reply directly to this email to respond to ${name}.)`,
  ].join('\n');

  try {
    await resend().emails.send({
      from: env.FROM_EMAIL,
      to: env.CONTACT_EMAIL,
      replyTo: email,
      subject: `Beautywell — ${subject} from ${name}`,
      html,
      text,
    });
  } catch (err) {
    console.error('[submit-contact] resend send failed', err);
    return NextResponse.json(
      { error: 'Could not send your message. Please try again or email directly.' },
      { status: 502 },
    );
  }

  return NextResponse.json({ success: true });
}
