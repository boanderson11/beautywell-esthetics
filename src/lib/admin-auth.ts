import { cookies } from 'next/headers';
import { SESSION_COOKIE, verifySessionToken } from './session';

export type AdminSession = {
  userId: string;
  email: string;
};

export function getAdminSession(): AdminSession | null {
  const token = cookies().get(SESSION_COOKIE)?.value;
  const payload = verifySessionToken(token);
  if (!payload) return null;
  return { userId: payload.sub, email: payload.email };
}
