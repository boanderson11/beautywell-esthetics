// One-off content migration for Paulina's 2026-05 protocol updates.
//
// Applies the following changes to the `content_blocks` Postgres table
// (the live source of truth for the booking site's services + addons):
//
//   services:
//     - Drop the "Brilliance Peel" facial (id: peel) entirely.
//     - Rename "Timeless Renewal" -> "The Liquid Facelift" and change its
//       id from "timeless" to "liquidfacelift". Refresh its description and
//       update the "Lifted Contours" benefit to "Sculpted Contours".
//     - Refresh the descriptions for the Signature Facial and HydraLux Infusion
//       to drop the "steam" and "device-assisted infusion" phrasing.
//
//   addons:
//     - Add the "Collagen Mask" addon ($25) after Eye Rescue.
//     - Reprice: Microcurrent Sculpt $35->$30, LED Light Boost $30->$25,
//       Gua Sha Lymphatic $30->$25, Deep Serum Infusion $25->$20,
//       Eye Rescue $20->$25. Dermaplaning ($35) and Lip Renewal ($15) unchanged.
//
// Idempotency
// -----------
// Two layers of gating, so subsequent deploys can never re-fire and clobber
// later admin-dashboard edits:
//
//   1. `applied_migrations` table (primary). On first successful run, this
//      script inserts a row keyed by MIGRATION_NAME. Every subsequent invocation
//      checks for that row up front and exits early if present — regardless of
//      what the content payload currently looks like. So even if Paulina later
//      re-creates an `id: timeless` service or deletes the `collagen` add-on,
//      the migration stays a no-op.
//
//   2. Per-payload data-shape signals (defence-in-depth). The services step
//      no-ops if `timeless` is absent; the addons step no-ops if `collagen` is
//      already present. These also handle partial failures during the very
//      first run (e.g., services succeeded but the script crashed before
//      addons): on retry the services step skips while the addons step still
//      runs, and both completing is what triggers the applied_migrations write.
//
// Run standalone via `npm run apply-paulina-updates` (requires DATABASE_URL).
// Hooked into `scripts/build-setup.ts` so the next Netlify deploy applies it
// automatically.

import { Pool } from '@neondatabase/serverless';
import fs from 'node:fs';
import path from 'node:path';

const MIGRATION_NAME = 'paulina-updates-2026-05';

type Facial = {
  id: string;
  name: string;
  tag?: string;
  duration: string;
  price: number;
  description: string;
  benefits?: string[];
};

type Waxing = {
  id: string;
  name: string;
  tag?: string;
  duration: string;
  price: number;
  description: string;
};

type ServicesPayload = { facials: Facial[]; waxing: Waxing[] };
type Addon = { id: string; name: string; price: number; description: string };
type AddonsPayload = { addons: Addon[] };

const NEW_DESCRIPTIONS = {
  signature:
    "A fully customized facial tailored to your skin's needs. Double cleanse, exfoliation, extractions, facial massage, custom mask, and finishing serums — every step selected specifically for your skin type.",
  hydralux:
    'An intensely hydrating treatment using multi-layer hyaluronic application and a collagen mask for plumped, dewy, glass-skin results. The hero step: three layers of hyaluronic acid on freshly treated skin.',
  liquidfacelift:
    'Our most luxurious anti-aging treatment. Microcurrent therapy sculpts and lifts facial contours while peptide and vitamin C serums restore firmness and radiance. Finished with a collagen mask for visibly tighter, glowing skin.',
} as const;

const ADDON_PRICE_TARGETS: Record<string, number> = {
  nuface: 30,
  led: 25,
  guasha: 25,
  serum: 20,
  eye: 25,
};

const COLLAGEN_ADDON: Addon = {
  id: 'collagen',
  name: 'Collagen Mask',
  price: 25,
  description:
    'Bio-cellulose collagen mask for plumping, deep hydration, and a glass-skin finish.',
};

// Self-create the table so this script also works when invoked standalone via
// `npm run apply-paulina-updates`, where the schema migration step has not run
// in the same process. In the build-setup path, schema.sql already created it.
async function ensureMigrationsTable(pool: Pool): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query(
      `CREATE TABLE IF NOT EXISTS applied_migrations (
         name        text PRIMARY KEY,
         applied_at  timestamptz NOT NULL DEFAULT now()
       )`,
    );
  } finally {
    client.release();
  }
}

async function isMigrationApplied(pool: Pool): Promise<boolean> {
  const client = await pool.connect();
  try {
    const result = await client.query(
      'SELECT 1 FROM applied_migrations WHERE name = $1 LIMIT 1',
      [MIGRATION_NAME],
    );
    return result.rows.length > 0;
  } finally {
    client.release();
  }
}

async function markMigrationApplied(pool: Pool): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query(
      'INSERT INTO applied_migrations (name) VALUES ($1) ON CONFLICT DO NOTHING',
      [MIGRATION_NAME],
    );
  } finally {
    client.release();
  }
}

async function loadFromDbOrFile<T>(
  pool: Pool,
  key: string,
  fallbackFile: string,
): Promise<{ value: T; fromDb: boolean }> {
  const client = await pool.connect();
  try {
    const result = await client.query<{ value: T }>(
      'SELECT value FROM content_blocks WHERE key = $1 LIMIT 1',
      [key],
    );
    if (result.rows.length > 0) {
      return { value: result.rows[0].value, fromDb: true };
    }
  } finally {
    client.release();
  }

  const filePath = path.join(process.cwd(), 'content', fallbackFile);
  return {
    value: JSON.parse(fs.readFileSync(filePath, 'utf-8')) as T,
    fromDb: false,
  };
}

async function writeContent(
  pool: Pool,
  key: string,
  value: unknown,
): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query(
      `INSERT INTO content_blocks (key, value, updated_at)
       VALUES ($1, $2::jsonb, now())
       ON CONFLICT (key) DO UPDATE
         SET value = EXCLUDED.value, updated_at = EXCLUDED.updated_at`,
      [key, JSON.stringify(value)],
    );
  } finally {
    client.release();
  }
}

function migrateServices(
  payload: ServicesPayload,
): { changed: boolean; payload: ServicesPayload; note: string } {
  const hasTimeless = payload.facials.some((f) => f.id === 'timeless');
  if (!hasTimeless) {
    return {
      changed: false,
      payload,
      note: 'no `timeless` facial found — already migrated',
    };
  }

  // Drop the seasonal Brilliance Peel.
  payload.facials = payload.facials.filter((f) => f.id !== 'peel');

  // Update the remaining facials in place.
  for (const f of payload.facials) {
    if (f.id === 'timeless') {
      f.id = 'liquidfacelift';
      f.name = 'The Liquid Facelift';
      f.description = NEW_DESCRIPTIONS.liquidfacelift;
      f.benefits = (f.benefits ?? []).map((b) =>
        b === 'Lifted Contours' ? 'Sculpted Contours' : b,
      );
    } else if (f.id === 'signature') {
      f.description = NEW_DESCRIPTIONS.signature;
    } else if (f.id === 'hydralux') {
      f.description = NEW_DESCRIPTIONS.hydralux;
    }
  }

  return {
    changed: true,
    payload,
    note: 'peel dropped, timeless → liquidfacelift, descriptions/benefits refreshed',
  };
}

function migrateAddons(
  payload: AddonsPayload,
): { changed: boolean; payload: AddonsPayload; note: string } {
  const hasCollagen = payload.addons.some((a) => a.id === 'collagen');
  if (hasCollagen) {
    return {
      changed: false,
      payload,
      note: 'collagen mask already present — already migrated',
    };
  }

  // Repriced add-ons.
  const repricings: string[] = [];
  for (const a of payload.addons) {
    const target = ADDON_PRICE_TARGETS[a.id];
    if (target !== undefined && a.price !== target) {
      repricings.push(`${a.id}: $${a.price} → $${target}`);
      a.price = target;
    }
  }

  // Insert Collagen Mask after Eye Rescue (or end if Eye Rescue missing).
  const eyeIdx = payload.addons.findIndex((a) => a.id === 'eye');
  const collagenCopy: Addon = { ...COLLAGEN_ADDON };
  if (eyeIdx >= 0) {
    payload.addons.splice(eyeIdx + 1, 0, collagenCopy);
  } else {
    payload.addons.push(collagenCopy);
  }

  const repricingNote = repricings.length
    ? ` (${repricings.join(', ')})`
    : '';
  return {
    changed: true,
    payload,
    note: `collagen mask added, prices refreshed${repricingNote}`,
  };
}

export async function applyPaulinaUpdates2026May(
  externalPool?: Pool,
): Promise<void> {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.log(
      '[paulina-updates-2026-05] DATABASE_URL not set — skipping content migration.',
    );
    return;
  }

  const pool = externalPool ?? new Pool({ connectionString: dbUrl });
  const ownsPool = !externalPool;

  try {
    await ensureMigrationsTable(pool);
    if (await isMigrationApplied(pool)) {
      console.log(
        `[paulina-updates-2026-05] already applied — skipping (applied_migrations row present).`,
      );
      return;
    }

    // Services
    const servicesLoad = await loadFromDbOrFile<ServicesPayload>(
      pool,
      'services',
      'services.json',
    );
    const servicesResult = migrateServices(servicesLoad.value);
    if (servicesResult.changed) {
      await writeContent(pool, 'services', servicesResult.payload);
      console.log(
        `[paulina-updates-2026-05] ✓ services updated — ${servicesResult.note}`,
      );
    } else {
      console.log(
        `[paulina-updates-2026-05] services unchanged — ${servicesResult.note}`,
      );
    }

    // Addons
    const addonsLoad = await loadFromDbOrFile<AddonsPayload>(
      pool,
      'addons',
      'addons.json',
    );
    const addonsResult = migrateAddons(addonsLoad.value);
    if (addonsResult.changed) {
      await writeContent(pool, 'addons', addonsResult.payload);
      console.log(
        `[paulina-updates-2026-05] ✓ addons updated — ${addonsResult.note}`,
      );
    } else {
      console.log(
        `[paulina-updates-2026-05] addons unchanged — ${addonsResult.note}`,
      );
    }

    // Mark applied only after both steps completed (whether by mutation or
    // by being already in the target shape). If an exception was thrown
    // mid-way, this line is skipped and the next run picks up where it
    // stopped via the per-payload data-shape signals.
    await markMigrationApplied(pool);
    console.log(`[paulina-updates-2026-05] ✓ recorded in applied_migrations`);
  } finally {
    if (ownsPool) await pool.end();
  }
}

// When invoked directly via `npm run apply-paulina-updates` (i.e. tsx running
// this file as the entry script), run the migration. When imported by
// build-setup.ts, this block is skipped.
if (process.argv[1] && /paulina-updates-2026-05\.ts$/.test(process.argv[1])) {
  applyPaulinaUpdates2026May().catch((err) => {
    console.error('[paulina-updates-2026-05] failed:', err);
    process.exitCode = 1;
  });
}
