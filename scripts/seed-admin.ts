// Seeds an admin user from env vars. Idempotent: re-running with the same email
// updates the password hash so you can rotate the initial password.
//
// Required env: DATABASE_URL, ADMIN_INITIAL_EMAIL, ADMIN_INITIAL_PASSWORD
// Run via: npm run seed:admin

import { Pool } from '@neondatabase/serverless';
import { randomBytes, scrypt as scryptCb } from 'node:crypto';
import { promisify } from 'node:util';

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

function newId(): string {
  return 'adm_' + randomBytes(9).toString('base64url');
}

async function main() {
  const url = process.env.DATABASE_URL;
  const rawEmail = process.env.ADMIN_INITIAL_EMAIL;
  const password = process.env.ADMIN_INITIAL_PASSWORD;

  if (!url) { console.error('DATABASE_URL is not set'); process.exit(1); }
  if (!rawEmail) { console.error('ADMIN_INITIAL_EMAIL is not set'); process.exit(1); }
  if (!password) { console.error('ADMIN_INITIAL_PASSWORD is not set'); process.exit(1); }
  if (password.length < 12) {
    console.error('ADMIN_INITIAL_PASSWORD must be at least 12 characters');
    process.exit(1);
  }

  const email = rawEmail.trim().toLowerCase();
  const hash = await hashPassword(password);

  const pool = new Pool({ connectionString: url });
  const client = await pool.connect();
  try {
    const existing = await client.query<{ id: string }>(
      'SELECT id FROM admin_users WHERE email = $1',
      [email],
    );

    if (existing.rows.length > 0) {
      await client.query(
        'UPDATE admin_users SET password_hash = $1 WHERE email = $2',
        [hash, email],
      );
      console.log(`✓ Updated password for existing admin: ${email}`);
    } else {
      await client.query(
        'INSERT INTO admin_users (id, email, password_hash) VALUES ($1, $2, $3)',
        [newId(), email, hash],
      );
      console.log(`✓ Created admin: ${email}`);
    }
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
