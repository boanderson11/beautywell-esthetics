import { NextResponse } from 'next/server';
import { z } from 'zod';
import { randomBytes } from 'node:crypto';
import { db } from '@/lib/db';
import { getAdminSession } from '@/lib/admin-auth';
import { hashPassword } from '@/lib/password';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type AdminRow = {
  id: string;
  email: string;
  created_at: string;
  last_login_at: string | null;
};

export async function GET() {
  if (!getAdminSession()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const sql = db();
  const rows = (await sql`
    SELECT id, email, created_at, last_login_at
    FROM admin_users
    ORDER BY created_at ASC
  `) as unknown as AdminRow[];
  return NextResponse.json({ admins: rows });
}

const Body = z.object({
  email: z.string().email().max(254),
  password: z.string().min(12).max(256),
});

export async function POST(req: Request) {
  if (!getAdminSession()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let parsed;
  try {
    parsed = Body.parse(await req.json());
  } catch {
    return NextResponse.json(
      { error: 'Email is required and password must be at least 12 characters' },
      { status: 400 },
    );
  }

  const email = parsed.email.trim().toLowerCase();
  const sql = db();

  const existing = (await sql`
    SELECT id FROM admin_users WHERE email = ${email} LIMIT 1
  `) as unknown as Array<{ id: string }>;
  if (existing.length > 0) {
    return NextResponse.json({ error: 'An admin with that email already exists' }, { status: 409 });
  }

  const id = 'adm_' + randomBytes(9).toString('base64url');
  const hash = await hashPassword(parsed.password);

  await sql`
    INSERT INTO admin_users (id, email, password_hash)
    VALUES (${id}, ${email}, ${hash})
  `;

  return NextResponse.json({ ok: true, id, email });
}
