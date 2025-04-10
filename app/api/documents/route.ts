import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth-js';
import { db } from '@/database/drizzle/drizzle';
import { documents } from '@/database/drizzle/document-signing-schema';

export async function POST(req: NextRequest) {
  try {
    // Get authenticated user
    const session = await auth();

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const data = await req.json();
    const { title, description, documentFilePath, documentFileHash, size } = data;

    console.log('Document API received size:', size, typeof size);

    if (!title || !documentFilePath) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Ensure size is properly converted to a number
    const fileSize = size !== undefined && size !== null ? Number(size) : null;
    console.log('Processed file size:', fileSize, typeof fileSize);

    // Insert document into the database
    const [newDocument] = await db
      .insert(documents)
      .values({
        title,
        description: description || null,
        ownerId: session.user.id,
        documentFilePath,
        documentFileHash: documentFileHash || null,
        // Store the size as a number
        size: fileSize,
      })
      .returning();

    console.log('Saved document with size:', newDocument.size);

    return NextResponse.json({ document: newDocument }, { status: 201 });
  } catch (error) {
    console.error('Error creating document:', error);
    return NextResponse.json({ error: 'Failed to create document' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    // Get authenticated user
    const session = await auth();

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    console.log('Fetching documents for user:', userId);

    try {
      // Fetch documents owned by the user
      const userDocuments = await db.query.documents.findMany({
        where: (docs, { eq }) => eq(docs.ownerId, userId),
        orderBy: (docs, { desc }) => [desc(docs.createdAt)],
      });

      console.log(`Found ${userDocuments.length} documents for user`);
      return NextResponse.json({ documents: userDocuments });
    } catch (dbError) {
      console.error('Database error when fetching documents:', dbError);
      return NextResponse.json({ error: 'Database error', details: dbError instanceof Error ? dbError.message : String(dbError) }, { status: 500 });
    }
  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json({ error: 'Failed to fetch documents', details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
