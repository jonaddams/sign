import { and, eq } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';
import { documentAnnotations, documents } from '@/database/drizzle/document-signing-schema';
import { db } from '@/database/drizzle/drizzle';
import { auth } from '@/lib/auth/auth-js';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: documentId } = await params;
    const body = await request.json();
    const { annotationData } = body;

    if (!annotationData) {
      return NextResponse.json({ error: 'Annotation data is required' }, { status: 400 });
    }

    // Verify document exists and user owns it
    const document = await db.query.documents.findFirst({
      where: (documents, { and, eq }) =>
        and(eq(documents.id, documentId), eq(documents.ownerId, session.user.id as string)),
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found or access denied' }, { status: 404 });
    }

    // Create annotation record
    const annotation = await db
      .insert(documentAnnotations)
      .values({
        id: crypto.randomUUID(),
        documentId,
        creatorId: session.user.id,
        annotationData,
        createdAt: new Date(),
        isFinalized: false,
      })
      .returning();

    logger.info('Document annotations saved', { documentId, annotationId: annotation[0].id });

    return NextResponse.json({ annotation: annotation[0] });
  } catch (error) {
    logger.error('Error saving document annotations', error);
    return NextResponse.json({ error: 'Failed to save annotations' }, { status: 500 });
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: documentId } = await params;

    // Verify document exists and user owns it
    const document = await db.query.documents.findFirst({
      where: (documents, { and, eq }) =>
        and(eq(documents.id, documentId), eq(documents.ownerId, session.user.id as string)),
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found or access denied' }, { status: 404 });
    }

    // Get annotations for this document
    const annotations = await db.query.documentAnnotations.findMany({
      where: (documentAnnotations, { eq }) => eq(documentAnnotations.documentId, documentId),
      orderBy: (documentAnnotations, { asc }) => [asc(documentAnnotations.createdAt)],
    });

    return NextResponse.json({ annotations });
  } catch (error) {
    logger.error('Error fetching document annotations', error);
    return NextResponse.json({ error: 'Failed to fetch annotations' }, { status: 500 });
  }
}
