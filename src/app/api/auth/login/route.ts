import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { verifyPassword } from '@/lib/password';
import { createSessionToken, sessionCookieOptions, SESSION_COOKIE } from '@/lib/session';

export const runtime = 'nodejs';

const Body = z.object({
  email: z.string().email().max(254),
  password: z.string().min(1).max(256),
});

type AdminRow = { id: string; email: string; password_hash: string };

export async function POST(req: Request) {
  let parsed;
  try {
    parsed = Body.parse(await req.json());
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const email = parsed.email.trim().toLowerCase();
  const sql = db();
  const rows = (await sql`
    SELECT id, email, password_hash
    FROM admin_users
    WHERE email = ${email}
    LIMIT 1
  `) as unknown as AdminRow[];

  const user = rows[0];
  // Verify even when no user exists, so timing doesn't leak which emails are admins.
  const dummyHash = 'scrypt$00$00';
  const ok = await verifyPassword(parsed.password, user?.password_hash ?? dummyHash);
  if (!user || !ok) {
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
  }

  await sql`UPDATE admin_users SET last_login_at = now() WHERE id = ${user.id}`;

  const token = createSessionToken(user.id, user.email);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
  return res;
}
