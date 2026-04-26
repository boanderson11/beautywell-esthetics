import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { resend } from '@/lib/resend';
import { env } from '@/lib/env';
import { appointmentReminderEmail, intakeReminderEmail } from '@/emails/reminder-emails';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Run daily. The endpoint is idempotent: each booking row carries
// reminder_sent_at and intake_reminder_sent_at timestamps that gate sends,
// so re-running on the same day is a no-op and re-running across schedule
// drift won't double-send.
//
// Auth: bearer token via CRON_SECRET. Netlify's scheduled function passes it.
// Manual triggers can use `Authorization: Bearer <secret>`.

type ReminderRow = {
  id: string;
  first_name: string;
  email: string;
  service_name: string;
  date: string;
  time_slot: string;
  intake_completed_at: string | null;
};

type IntakeReminderRow = {
  id: string;
  first_name: string;
  email: string;
  service_name: string;
  date: string;
  time_slot: string;
};

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

function authorized(req: NextRequest): boolean {
  const header = req.headers.get('authorization') ?? '';
  const expected = `Bearer ${env.CRON_SECRET}`;
  // Constant-time compare to avoid timing leaks on the secret.
  if (header.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < header.length; i++) {
    diff |= header.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return diff === 0;
}

export async function POST(req: NextRequest) {
  if (!authorized(req)) return unauthorized();
  return run();
}

// GET is allowed too, for ad-hoc curl testing with the same bearer token.
export async function GET(req: NextRequest) {
  if (!authorized(req)) return unauthorized();
  return run();
}

async function run() {
  const sql = db();
  const r = resend();

  const stats = {
    appointmentReminders: { sent: 0, failed: 0 },
    intakeReminders: { sent: 0, failed: 0 },
  };

  // ─── 24-hour appointment reminder ──────────────────────────────────────
  // Bookings where the appointment date is tomorrow (in the server's tz)
  // and we haven't already sent a reminder. Idempotent via reminder_sent_at.
  const dueReminders = (await sql`
    SELECT id, first_name, email, service_name,
           date::text AS date, time_slot,
           intake_completed_at::text AS intake_completed_at
    FROM bookings
    WHERE status = 'confirmed'
      AND date = (CURRENT_DATE + INTERVAL '1 day')::date
      AND reminder_sent_at IS NULL
  `) as unknown as ReminderRow[];

  for (const row of dueReminders) {
    const tpl = appointmentReminderEmail({
      id: row.id,
      firstName: row.first_name,
      serviceName: row.service_name,
      date: row.date,
      time: row.time_slot,
      intakeCompleted: row.intake_completed_at !== null,
    });
    try {
      await r.emails.send({
        from: env.FROM_EMAIL,
        to: row.email,
        subject: tpl.subject,
        html: tpl.html,
        text: tpl.text,
      });
      await sql`UPDATE bookings SET reminder_sent_at = now() WHERE id = ${row.id}`;
      stats.appointmentReminders.sent++;
    } catch (err) {
      console.error('[cron/send-reminders] 24h reminder failed', { bookingId: row.id, err });
      stats.appointmentReminders.failed++;
    }
  }

  // ─── Intake form reminder ──────────────────────────────────────────────
  // Bookings 2–3 days out that don't yet have an intake on file and haven't
  // received this reminder. Sent earlier than the 24h reminder so clients
  // have time to actually fill it out before they arrive.
  const dueIntakeReminders = (await sql`
    SELECT id, first_name, email, service_name,
           date::text AS date, time_slot
    FROM bookings
    WHERE status = 'confirmed'
      AND date BETWEEN (CURRENT_DATE + INTERVAL '2 days')::date
                   AND (CURRENT_DATE + INTERVAL '3 days')::date
      AND intake_completed_at IS NULL
      AND intake_reminder_sent_at IS NULL
  `) as unknown as IntakeReminderRow[];

  for (const row of dueIntakeReminders) {
    const tpl = intakeReminderEmail({
      id: row.id,
      firstName: row.first_name,
      serviceName: row.service_name,
      date: row.date,
      time: row.time_slot,
    });
    try {
      await r.emails.send({
        from: env.FROM_EMAIL,
        to: row.email,
        subject: tpl.subject,
        html: tpl.html,
        text: tpl.text,
      });
      await sql`UPDATE bookings SET intake_reminder_sent_at = now() WHERE id = ${row.id}`;
      stats.intakeReminders.sent++;
    } catch (err) {
      console.error('[cron/send-reminders] intake reminder failed', { bookingId: row.id, err });
      stats.intakeReminders.failed++;
    }
  }

  return NextResponse.json({ ok: true, ...stats });
}
