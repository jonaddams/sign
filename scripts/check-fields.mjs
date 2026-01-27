import dotenv from 'dotenv';
import postgres from 'postgres';

dotenv.config({ path: '.env.local' });

const sql = postgres(process.env.DATABASE_URL);

async function checkFields() {
  console.log('\n=== CHECKING FIELD ANNOTATIONS ===\n');

  // Get the most recent document
  const doc = await sql`
    SELECT id, name, owner_id, created_at
    FROM documents
    ORDER BY created_at DESC
    LIMIT 1
  `;

  if (doc.length === 0) {
    console.log('No documents found');
    await sql.end();
    return;
  }

  console.log('Most Recent Document:');
  console.table(doc);

  const documentId = doc[0].id;

  // Check for field annotations
  const annotations = await sql`
    SELECT id, document_id, annotation_data, created_at, is_finalized
    FROM document_annotations
    WHERE document_id = ${documentId}
  `;

  console.log('\nField Annotations:', annotations.length);
  if (annotations.length > 0) {
    console.table(annotations);
    console.log('\nAnnotation Data:');
    annotations.forEach((ann, idx) => {
      console.log(`\nAnnotation ${idx + 1}:`);
      console.log(JSON.stringify(ann.annotation_data, null, 2));
    });
  } else {
    console.log('No field annotations found for this document');
  }

  await sql.end();
}

checkFields().catch(console.error);
