-- Beautywell Esthetics — booking schema
-- Run via `npm run migrate` (see scripts/migrate.ts) or directly in the Neon SQL console.

CREATE TABLE IF NOT EXISTS bookings (
  id              text PRIMARY KEY,
  created_at      timestamptz NOT NULL DEFAULT now(),
  status          text NOT NULL CHECK (status IN ('pending_payment','confirmed','expired','cancelled')),
  first_name      text NOT NULL,
  last_name       text NOT NULL,
  email           text NOT NULL,
  phone           text NOT NULL,
  service_id      text NOT NULL,
  service_name    text NOT NULL,
  addons          jsonb NOT NULL DEFAULT '[]'::jsonb,
  date            date NOT NULL,
  time_slot       text NOT NULL,
  total_cents     integer NOT NULL CHECK (total_cents >= 0),
  deposit_cents   integer NOT NULL CHECK (deposit_cents >= 0),
  notes           text,
  stripe_session_id     text UNIQUE,
  stripe_payment_intent text,
  paid_at         timestamptz,
  expires_at      timestamptz,
  -- Reminder + intake tracking. Set by /api/cron/send-reminders and
  -- /api/submit-intake respectively. NULL means "not yet sent / completed".
  reminder_sent_at        timestamptz,
  intake_reminder_sent_at timestamptz,
  intake_completed_at     timestamptz,
  intake_id               text
);

-- Idempotent migrations for existing deployments.
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS reminder_sent_at        timestamptz;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS intake_reminder_sent_at timestamptz;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS intake_completed_at     timestamptz;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS intake_id               text;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS prep_completed_at       timestamptz;

-- Foolproof: only one active booking per (date, time_slot).
-- An "active" booking is either awaiting payment or already paid.
-- Expired and cancelled bookings free up the slot.
CREATE UNIQUE INDEX IF NOT EXISTS one_active_booking_per_slot
  ON bookings (date, time_slot)
  WHERE status IN ('pending_payment','confirmed');

CREATE INDEX IF NOT EXISTS bookings_status_date_idx ON bookings (status, date);
CREATE INDEX IF NOT EXISTS bookings_email_idx ON bookings (email);

-- Stripe webhook idempotency. Inserting an existing event_id will fail,
-- so the handler can detect re-deliveries and short-circuit.
CREATE TABLE IF NOT EXISTS processed_stripe_events (
  event_id    text PRIMARY KEY,
  received_at timestamptz NOT NULL DEFAULT now()
);

-- Admin users for the DB-backed login at /admin/login.
-- Seed via `npm run seed:admin` (see scripts/seed-admin.ts).
CREATE TABLE IF NOT EXISTS admin_users (
  id              text PRIMARY KEY,
  email           text NOT NULL UNIQUE,
  password_hash   text NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  last_login_at   timestamptz
);

-- Editable content (services, addons, settings, calendar). Each row holds the
-- full JSON payload for one content area. Falls back to the on-disk JSON files
-- in content/ when no DB row exists, so a fresh install still serves the
-- starter content until the admin makes their first save.
CREATE TABLE IF NOT EXISTS content_blocks (
  key         text PRIMARY KEY,
  value       jsonb NOT NULL,
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- One-off content/data migrations are recorded here by name so they run
-- exactly once per database. Migration scripts in scripts/migrations/ check
-- this table at the top and exit early if their name is already present, so
-- subsequent deploys never re-apply (and never clobber later admin edits).
CREATE TABLE IF NOT EXISTS applied_migrations (
  name        text PRIMARY KEY,
  applied_at  timestamptz NOT NULL DEFAULT now()
);
