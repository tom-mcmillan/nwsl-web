import { Pool } from 'pg';

let pool: Pool | null = null;

export function getPool() {
  if (!pool) {
    pool = new Pool({
      host: '127.0.0.1',
      port: 5433,
      database: 'nwsl',
      user: 'etl',
      password: process.env.NWSL_INGEST_PASSWORD,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
  }
  return pool;
}

export async function query<T = unknown>(sql: string, params?: unknown[]): Promise<T[]> {
  const pool = getPool();
  const result = await pool.query(sql, params);
  return result.rows as T[];
}
