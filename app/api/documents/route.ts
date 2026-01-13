import { type NextRequest, NextResponse } from 'next/server';
import { documents } from '@/database/drizzle/document-signing-schema';
import { db } from '@/database/drizzle/drizzle';
import { auth } from '@/lib/auth/auth-js';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, documentFilePath, templateId, expiresAt, size } = body;

    // Validate required fields
    if (!name || !documentFilePath) {
      return NextResponse.json(
        { error: 'Document name and file path are required' },
        { status: 400 }
      );
    }

    // Create document record
    const document = await db
      .insert(documents)
      .values({
        id: crypto.randomUUID(),
        name,
        documentFilePath,
        templateId: templateId || null,
        ownerId: session.user.id,
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        size: size || null,
        documentFileHash: null,
        esignCompliant: true,
      })
      .returning();

    logger.info('Document created', { documentId: document[0].id, userId: session.user.id });

    return NextResponse.json({ document: document[0] });
  } catch (error) {
    logger.error('Error creating document', error);
    return NextResponse.json(
      { error: 'Failed to create document' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's documents
    const userDocuments = await db.query.documents.findMany({
      where: (documents, { eq }) => eq(documents.ownerId, session.user.id as string),
      orderBy: (documents, { desc }) => [desc(documents.createdAt)],
    });

    return NextResponse.json({ documents: userDocuments });
  } catch (error) {
    logger.error('Error fetching documents', error);
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 }
    );
  }
}
