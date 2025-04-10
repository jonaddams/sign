import { neon } from '@neondatabase/serverless';
import type { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import { drizzle as neonDrizzle } from 'drizzle-orm/neon-http';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './database.schema';

type Database = PostgresJsDatabase<typeof schema> | NeonHttpDatabase<typeof schema>;
type DatabaseType = 'neon' | 'postgres';
type DatabaseConfig = {
  DATABASE_URL: string;
  DATABASE_TYPE: DatabaseType;
};

const POOL_CONFIG = {
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

const validateConfig = (): DatabaseConfig => {
  const url = process.env.DATABASE_URL;
  const type = process.env.DATABASE_TYPE as DatabaseType;

  if (!url) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  if (type && type !== 'neon' && type !== 'postgres') {
    throw new Error('DATABASE must be either "neon" or "postgres"');
  }

  return {
    DATABASE_URL: url,
    DATABASE_TYPE: type || 'postgres', // Default to postgres if not specified
  };
};

let db: Database;

try {
  const config = validateConfig();

  if (config.DATABASE_TYPE === 'neon') {
    const sql = neon(config.DATABASE_URL);
    db = neonDrizzle(sql, { schema });
  } else {
    const pool = postgres(config.DATABASE_URL, POOL_CONFIG);
    db = drizzle(pool, { schema });
  }
} catch (error) {
  console.error('Failed to initialize database:', error);
  throw error;
}

export { db };
