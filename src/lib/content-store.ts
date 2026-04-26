// DB-backed editable content with on-disk JSON fallback.
//
// The admin dashboard writes to the `content_blocks` Postgres table; the live
// site reads from the same table. If a key has no DB row yet (fresh install),
// the matching file in content/ is used as the seed payload so the site keeps
// rendering until someone hits Save in the dashboard.

import fs from 'node:fs';
import path from 'node:path';
import { db } from './db';

export const CONTENT_KEYS = ['services', 'addons', 'settings', 'calendar'] as const;
export type ContentKey = (typeof CONTENT_KEYS)[number];

export function isContentKey(s: string): s is ContentKey {
  return (CONTENT_KEYS as readonly string[]).includes(s);
}

const FALLBACK_FILE: Record<ContentKey, string> = {
  services: 'services.json',
  addons: 'addons.json',
  settings: 'settings.json',
  calendar: 'calendar.json',
};

function readJsonFallback(key: ContentKey): unknown {
  const file = path.join(process.cwd(), 'content', FALLBACK_FILE[key]);
  return JSON.parse(fs.readFileSync(file, 'utf-8'));
}

export async function getContent<T = unknown>(key: ContentKey): Promise<T> {
  try {
    const sql = db();
    const rows = (await sql`
      SELECT value FROM content_blocks WHERE key = ${key} LIMIT 1
    `) as unknown as Array<{ value: T }>;
    if (rows.length > 0) return rows[0].value;
  } catch (err) {
    // DB unreachable / misconfigured — keep the site rendering with whatever
    // is on disk. Logged loudly so it shows up in deploy logs.
    console.error(`[content-store] DB read failed for ${key}, using on-disk fallback`, err);
  }
  return readJsonFallback(key) as T;
}

export async function setContent(key: ContentKey, value: unknown): Promise<void> {
  const sql = db();
  await sql`
    INSERT INTO content_blocks (key, value, updated_at)
    VALUES (${key}, ${JSON.stringify(value)}::jsonb, now())
    ON CONFLICT (key) DO UPDATE
      SET value = EXCLUDED.value,
          updated_at = EXCLUDED.updated_at
  `;
}
