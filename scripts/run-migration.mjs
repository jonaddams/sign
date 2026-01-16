import postgres from 'postgres';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const sql = postgres(process.env.DATABASE_URL);

async function runMigration() {
  console.log('Running database migration...\n');

  const migrationSQL = fs.readFileSync('database/drizzle/migrations/0000_nebulous_snowbird.sql', 'utf8');

  // Split by statement-breakpoint and execute each statement
  const statements = migrationSQL.split('--> statement-breakpoint').filter(s => s.trim());

  let count = 0;
  for (const statement of statements) {
    const trimmed = statement.trim();
    if (trimmed) {
      try {
        await sql.unsafe(trimmed);
        count++;
        console.log(`✓ Executed statement ${count}`);
      } catch (err) {
        // Ignore "already exists" errors
        if (err.code === '42P07' || err.code === '42710') {
          console.log(`⊘ Skipped statement ${count} (already exists)`);
        } else {
          console.error(`✗ Error in statement ${count}:`, err.message);
          throw err;
        }
      }
    }
  }

  console.log(`\n✓ Migration complete! Executed ${count} statements.\n`);

  await sql.end();
}

runMigration().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
