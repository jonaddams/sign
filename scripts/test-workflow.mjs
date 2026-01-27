import dotenv from 'dotenv';
import postgres from 'postgres';

dotenv.config({ path: '.env.local' });

const sql = postgres(process.env.DATABASE_URL);

async function checkData() {
  console.log('\n=== CHECKING DATABASE ===\n');

  // Check users
  const users = await sql`SELECT id, email, name FROM "user" LIMIT 5`;
  console.log('Users:', users.length);
  if (users.length > 0) console.table(users);

  // Check documents
  const docs = await sql`SELECT id, name, owner_id, created_at FROM documents ORDER BY created_at DESC LIMIT 5`;
  console.log('\nDocuments:', docs.length);
  if (docs.length > 0) console.table(docs);

  // Check signature requests
  const requests = await sql`
    SELECT sr.id, sr.status, sr.access_token, u.email as signer_email
    FROM signature_requests sr
    JOIN document_participants dp ON sr.participant_id = dp.id
    JOIN "user" u ON dp.user_id = u.id
    ORDER BY sr.requested_at DESC
    LIMIT 5
  `;
  console.log('\nSignature Requests:', requests.length);
  if (requests.length > 0) console.table(requests);

  await sql.end();
}

checkData().catch(console.error);
