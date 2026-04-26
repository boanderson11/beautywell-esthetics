// Runs DB migrations and (optionally) seeds the admin user as part of `next build`.
// Designed for the Netlify build: the user sets env vars in the Netlify UI, the
// next deploy picks them up automatically, and signing in at /admin/login works.
//
// Gated on env vars: missing config logs a notice and exits 0 so the build still
// succeeds on a fresh deploy where DB / admin envs are not yet configured.

import { Pool } from '@neondatabase/serverless';
import { randomBytes, scrypt as scryptCb } from 'node:crypto';
import { promisify } from 'node:util';
import fs from 'node:fs';
import path from 'node:path';

const scrypt = promisify(scryptCb) as (
  password: string,
  salt: Buffer,
  keylen: number,
) => Promise<Buffer>;

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await scrypt(password, salt, 64);
  return `scrypt$${salt.toString('hex')}$${key.toString('hex')}`;
}

function newAdminId(): string {
  return 'adm_' + randomBytes(9).toString('base64url');
}

async function runMigrations(pool: Pool): Promise<void> {
  const schema = fs.readFileSync(path.join(process.cwd(), 'db', 'schema.sql'), 'utf-8');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(schema);
    await client.query('COMMIT');
    console.log('[build-setup] ✓ Migrations applied');
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

async function seedAdmin(pool: Pool, rawEmail: string, password: string): Promise<void> {
  if (password.length < 12) {
    console.warn('[build-setup] ! ADMIN_INITIAL_PASSWORD is shorter than 12 chars — skipping admin seed.');
    return;
  }
  const email = rawEmail.trim().toLowerCase();
  const hash = await hashPassword(password);

  const client = await pool.connect();
  try {
    const existing = await client.query<{ id: string }>(
      'SELECT id FROM admin_users WHERE email = $1',
      [email],
    );
    if (existing.rows.length > 0) {
      // Re-hash on every build so env-var changes propagate. If the same
      // password is set, the user simply gets a new hash for the same secret.
      await client.query(
        'UPDATE admin_users SET password_hash = $1 WHERE email = $2',
        [hash, email],
      );
      console.log(`[build-setup] ✓ Admin password synced from env: ${email}`);
    } else {
      await client.query(
        'INSERT INTO admin_users (id, email, password_hash) VALUES ($1, $2, $3)',
        [newAdminId(), email, hash],
      );
      console.log(`[build-setup] ✓ Admin created: ${email}`);
    }
  } finally {
    client.release();
  }
}

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.log('[build-setup] DATABASE_URL not set — skipping migrations and admin seed.');
    return;
  }

  const pool = new Pool({ connectionString: dbUrl });
  try {
    await runMigrations(pool);

    const email = process.env.ADMIN_INITIAL_EMAIL;
    const password = process.env.ADMIN_INITIAL_PASSWORD;
    if (email && password) {
      await seedAdmin(pool, email, password);
    } else {
      console.log('[build-setup] ADMIN_INITIAL_EMAIL or ADMIN_INITIAL_PASSWORD not set — skipping admin seed.');
    }
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  // Never fail the build over setup. Log loudly and continue so the site
  // still deploys; the operator can fix env vars and redeploy.
  console.error('[build-setup] ! Setup failed (continuing build):', err);
});
