import { eq } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';
import { users } from '@/database/drizzle/auth-schema';
import {
  documentAnnotations,
  documentParticipants,
  documents,
  signatureRequests,
} from '@/database/drizzle/document-signing-schema';
import { db } from '@/database/drizzle/drizzle';
import { logger } from '@/lib/logger';

/**
 * Verify access token and return document signing data
 * This is called by the /sign/[token] page to authenticate recipients
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    // Find signature request by access token
    const signatureRequestResults = await db
      .select({
        signatureRequest: signatureRequests,
        participant: documentParticipants,
        document: documents,
      })
      .from(signatureRequests)
      .innerJoin(documentParticipants, eq(signatureRequests.participantId, documentParticipants.id))
      .innerJoin(documents, eq(signatureRequests.documentId, documents.id))
      .where(eq(signatureRequests.accessToken, token));

    if (signatureRequestResults.length === 0) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 404 });
    }

    const signatureRequest = signatureRequestResults[0];

    // Check if document has expired
    if (signatureRequest.document.expiresAt && new Date(signatureRequest.document.expiresAt) < new Date()) {
      return NextResponse.json({ error: 'This document has expired' }, { status: 410 });
    }

    // Get recipient user information
    const recipientUser = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.id, signatureRequest.participant.userId),
    });

    if (!recipientUser) {
      return NextResponse.json({ error: 'Recipient not found' }, { status: 404 });
    }

    // Get document annotations (field placements)
    const annotations = await db
      .select()
      .from(documentAnnotations)
      .where(eq(documentAnnotations.documentId, signatureRequest.document.id));

    // Get all participants for this document
    const allParticipants = await db
      .select({
        participant: documentParticipants,
        user: users,
      })
      .from(documentParticipants)
      .innerJoin(users, eq(documentParticipants.userId, users.id))
      .where(eq(documentParticipants.documentId, signatureRequest.document.id));

    // Log access attempt
    logger.info('Document access via signing token', {
      documentId: signatureRequest.document.id,
      participantId: signatureRequest.participant.id,
      recipientEmail: recipientUser.email,
    });

    return NextResponse.json({
      success: true,
      document: {
        id: signatureRequest.document.id,
        name: signatureRequest.document.name,
        filePath: signatureRequest.document.documentFilePath,
        expiresAt: signatureRequest.document.expiresAt,
      },
      recipient: {
        id: signatureRequest.participant.id,
        name: recipientUser.name || recipientUser.email,
        email: recipientUser.email,
        accessLevel: signatureRequest.participant.accessLevel,
        signingOrder: signatureRequest.participant.signingOrder,
      },
      signatureRequest: {
        id: signatureRequest.signatureRequest.id,
        status: signatureRequest.signatureRequest.status,
        requestedAt: signatureRequest.signatureRequest.requestedAt,
      },
      annotations: annotations.length > 0 ? annotations[0].annotationData : { fields: [] },
      participants: allParticipants.map((p) => ({
        name: p.user.name || p.user.email,
        email: p.user.email,
        role: p.participant.accessLevel,
      })),
    });
  } catch (error) {
    logger.error('Error verifying signing token', error);
    return NextResponse.json({ error: 'Failed to verify token' }, { status: 500 });
  }
}
