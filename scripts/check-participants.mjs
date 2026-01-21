import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { eq } from 'drizzle-orm';
import * as dotenv from 'dotenv';
import { documentParticipants } from '../database/drizzle/document-signing-schema.js';
import { users } from '../database/drizzle/auth-schema.js';

dotenv.config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql);

async function checkParticipants() {
  console.log('\n=== CHECKING PARTICIPANTS ===\n');

  // Check current recipient
  const currentRecipient = await db
    .select({
      participant: documentParticipants,
      user: users
    })
    .from(documentParticipants)
    .innerJoin(users, eq(documentParticipants.userId, users.id))
    .where(eq(documentParticipants.id, '29d16217-7a7a-4399-9805-60a934316d4c'));

  console.log('Current recipient (29d16217...):', JSON.stringify(currentRecipient, null, 2));

  // Check field owner
  const fieldOwner = await db
    .select({
      participant: documentParticipants,
      user: users
    })
    .from(documentParticipants)
    .innerJoin(users, eq(documentParticipants.userId, users.id))
    .where(eq(documentParticipants.id, '50349f5d-4e3c-4837-ad16-82b8298b38b8'));

  console.log('\nField owner (50349f5d...):', JSON.stringify(fieldOwner, null, 2));

  process.exit(0);
}

checkParticipants().catch(console.error);
