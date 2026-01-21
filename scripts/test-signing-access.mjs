import 'dotenv/config';
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL);

console.log('\n=== CHECKING SIGNING ACCESS ===\n');

// Get all pending signature requests with user info
const requests = await sql`
  SELECT
    sr.id as request_id,
    sr.access_token,
    sr.status,
    d.id as document_id,
    d.name as document_name,
    u.id as user_id,
    u.email as signer_email,
    u.name as signer_name,
    dp.signing_order
  FROM signature_requests sr
  INNER JOIN document_participants dp ON sr.participant_id = dp.id
  INNER JOIN documents d ON sr.document_id = d.id
  INNER JOIN "user" u ON dp.user_id = u.id
  WHERE sr.status = 'PENDING'
  ORDER BY sr.requested_at DESC
`;

console.log(`Found ${requests.length} pending signature requests:\n`);

requests.forEach((req, index) => {
  console.log(`${index + 1}. Document: ${req.document_name}`);
  console.log(`   Signer: ${req.signer_name} (${req.signer_email})`);
  console.log(`   Access Token: ${req.access_token}`);
  console.log(`   Signing URL: http://localhost:3000/sign/${req.access_token}`);
  console.log('');
});

console.log('=== TEST INSTRUCTIONS ===\n');
console.log('1. Make sure you are logged in as the signer (check email above)');
console.log('2. Click the "Sign Document" button in the Inbox');
console.log('3. Or copy one of the URLs above and paste in browser');
console.log('');

await sql.end();
