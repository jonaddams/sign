import { defineConfig } from 'drizzle-kit';
import config from '@/lib/config';

export default defineConfig({
  dialect: 'postgresql',
  schema: 'drizzle/database.schema.ts',
  out: 'drizzle/migrations/',
  dbCredentials: {
    url: config.database.url as string,
  },
  verbose: true,
  strict: true,
});
