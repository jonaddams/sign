import { and, eq } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';
import { documentParticipants, documents } from '@/database/drizzle/document-signing-schema';
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
    const { recipients } = body;

    if (!recipients || !Array.isArray(recipients)) {
      return NextResponse.json({ error: 'Recipients array is required' }, { status: 400 });
    }

    // Verify document exists and user owns it
    const document = await db.query.documents.findFirst({
      where: (documents, { and, eq }) =>
        and(eq(documents.id, documentId), eq(documents.ownerId, session.user.id as string)),
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found or access denied' }, { status: 404 });
    }

    // Create participant records for each recipient
    const createdParticipants = [];
    for (const recipient of recipients) {
      const participant = await db
        .insert(documentParticipants)
        .values({
          id: crypto.randomUUID(),
          documentId,
          userId: recipient.userId || session.user.id, // Use session user if not provided
          accessLevel: recipient.role === 'viewer' ? 'VIEWER' : recipient.role === 'editor' ? 'EDITOR' : 'SIGNER',
          signingOrder: recipient.signingOrder || 0,
          isRequired: recipient.isRequired !== false,
        })
        .returning();

      createdParticipants.push(participant[0]);
    }

    logger.info('Document participants created', { documentId, count: createdParticipants.length });

    return NextResponse.json({ participants: createdParticipants });
  } catch (error) {
    logger.error('Error creating document participants', error);
    return NextResponse.json({ error: 'Failed to create participants' }, { status: 500 });
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

    // Get participants for this document
    const participants = await db.query.documentParticipants.findMany({
      where: (documentParticipants, { eq }) => eq(documentParticipants.documentId, documentId),
      orderBy: (documentParticipants, { asc }) => [asc(documentParticipants.signingOrder)],
    });

    return NextResponse.json({ participants });
  } catch (error) {
    logger.error('Error fetching document participants', error);
    return NextResponse.json({ error: 'Failed to fetch participants' }, { status: 500 });
  }
}
