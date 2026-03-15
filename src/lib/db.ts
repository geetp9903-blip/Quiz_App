import { Pool } from 'pg';

const globalForPg = globalThis as unknown as {
  pgPool: Pool | undefined;
};

// Next.js (especially in dev) can hot-reload frequently.
// Reusing the pool prevents exhausting DB connections.
export const pool =
  globalForPg.pgPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
  });

if (process.env.NODE_ENV !== 'production') globalForPg.pgPool = pool;

export default pool;
