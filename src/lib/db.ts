import { neon, type NeonQueryFunction } from '@neondatabase/serverless';
import { env } from './env';

let _sql: NeonQueryFunction<false, false> | null = null;

export function db(): NeonQueryFunction<false, false> {
  if (!_sql) _sql = neon(env.DATABASE_URL);
  return _sql;
}
