import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getAdminSession } from '@/lib/admin-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (params.id === session.userId) {
    return NextResponse.json(
      { error: 'You cannot delete the admin you are signed in as' },
      { status: 400 },
    );
  }

  const sql = db();

  // Don't allow removing the last admin — would lock everyone out.
  const countRows = (await sql`SELECT COUNT(*)::int AS n FROM admin_users`) as unknown as Array<{ n: number }>;
  if ((countRows[0]?.n ?? 0) <= 1) {
    return NextResponse.json(
      { error: 'Cannot remove the last admin' },
      { status: 400 },
    );
  }

  const deleted = (await sql`
    DELETE FROM admin_users WHERE id = ${params.id} RETURNING id
  `) as unknown as Array<{ id: string }>;

  if (deleted.length === 0) {
    return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
