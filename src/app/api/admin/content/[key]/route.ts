import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/admin-auth';
import { getContent, setContent, isContentKey } from '@/lib/content-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

export async function GET(_req: Request, { params }: { params: { key: string } }) {
  if (!getAdminSession()) return unauthorized();
  if (!isContentKey(params.key)) {
    return NextResponse.json({ error: 'Unknown content key' }, { status: 404 });
  }
  const value = await getContent(params.key);
  return NextResponse.json({ value });
}

export async function PUT(req: Request, { params }: { params: { key: string } }) {
  if (!getAdminSession()) return unauthorized();
  if (!isContentKey(params.key)) {
    return NextResponse.json({ error: 'Unknown content key' }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (typeof body !== 'object' || body === null) {
    return NextResponse.json({ error: 'Body must be a JSON object' }, { status: 400 });
  }

  await setContent(params.key, body);
  return NextResponse.json({ ok: true });
}
