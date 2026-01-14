import { and, eq } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';
import {
  documentAuditLog,
  documentParticipants,
  documents,
  signatureRequests,
} from '@/database/drizzle/document-signing-schema';
import { db } from '@/database/drizzle/drizzle';
import { logger } from '@/lib/logger';

/**
 * Submit a signed document
 * Called when a recipient completes their signature
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, signatureRequestId } = body;

    if (!token || !signatureRequestId) {
      return NextResponse.json({ error: 'Token and signature request ID are required' }, { status: 400 });
    }

    // Find the signature request
    const signatureRequestResults = await db
      .select({
        signatureRequest: signatureRequests,
        participant: documentParticipants,
        document: documents,
      })
      .from(signatureRequests)
      .innerJoin(documentParticipants, eq(signatureRequests.participantId, documentParticipants.id))
      .innerJoin(documents, eq(signatureRequests.documentId, documents.id))
      .where(eq(signatureRequests.id, signatureRequestId));

    if (signatureRequestResults.length === 0) {
      return NextResponse.json({ error: 'Signature request not found' }, { status: 404 });
    }

    const { signatureRequest, participant, document } = signatureRequestResults[0];

    // Verify token matches the signature request
    if (signatureRequest.accessToken !== token) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 403 });
    }

    // Check if already signed
    if (signatureRequest.status === 'SIGNED') {
      return NextResponse.json({ error: 'Document already signed' }, { status: 400 });
    }

    // Update signature request status
    await db
      .update(signatureRequests)
      .set({
        status: 'SIGNED',
        signedAt: new Date(),
      })
      .where(eq(signatureRequests.id, signatureRequestId));

    // Check if all required signatures are complete
    const allSignatureRequests = await db
      .select()
      .from(signatureRequests)
      .where(eq(signatureRequests.documentId, document.id));

    const allSigned = allSignatureRequests.every((sr) => sr.status === 'SIGNED');

    // Update document status if all signatures complete
    if (allSigned) {
      await db
        .update(documents)
        .set({
          updatedAt: new Date(),
          // Note: We should add a 'status' field to documents table
          // For now, we can infer status from signature requests
        })
        .where(eq(documents.id, document.id));
    }

    // Create audit log entry
    await db.insert(documentAuditLog).values({
      id: crypto.randomUUID(),
      documentId: document.id,
      userId: participant.userId,
      action: 'DOCUMENT_SIGNED',
      details: {
        participantId: participant.id,
        allSigned,
      },
      createdAt: new Date(),
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    logger.info('Document signed successfully', {
      documentId: document.id,
      participantId: participant.id,
      allSigned,
    });

    return NextResponse.json({
      success: true,
      message: 'Document signed successfully',
      allSigned,
      documentId: document.id,
    });
  } catch (error) {
    logger.error('Error submitting signature', error);
    return NextResponse.json({ error: 'Failed to submit signature' }, { status: 500 });
  }
}
