import crypto from 'node:crypto';

export function newBookingId(): string {
  // bk_<base36 timestamp>_<8-char random> — short, sortable, opaque.
  const ts = Date.now().toString(36);
  const rand = crypto.randomBytes(6).toString('base64url').slice(0, 8);
  return `bk_${ts}_${rand}`;
}
