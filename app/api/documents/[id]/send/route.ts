import { and, asc, eq } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';
import { users } from '@/database/drizzle/auth-schema';
import {
  documentAuditLog,
  documentNotifications,
  documentParticipants,
  documents,
  signatureRequests,
} from '@/database/drizzle/document-signing-schema';
import { db } from '@/database/drizzle/drizzle';
import { auth } from '@/lib/auth/auth-js';
import { generateSigningEmail, sendEmail } from '@/lib/email-service';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Verify the user is authenticated
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    // Get the document ID from the route params (await params in Next.js 15+)
    const { id: documentId } = await params;

    // Get the request body with email customization
    const body = await request.json();
    const { emailSubject, emailMessage } = body;

    // Verify the document exists and belongs to the user
    const documentResults = await db
      .select()
      .from(documents)
      .where(and(eq(documents.id, documentId), eq(documents.ownerId, session.user.id)));

    if (documentResults.length === 0) {
      return new NextResponse(JSON.stringify({ error: 'Document not found' }), { status: 404 });
    }

    const document = documentResults[0];

    // Fetch the document participants ordered by signing order
    const participants = await db
      .select()
      .from(documentParticipants)
      .where(eq(documentParticipants.documentId, documentId))
      .orderBy(asc(documentParticipants.signingOrder));

    if (participants.length === 0) {
      return new NextResponse(JSON.stringify({ error: 'No recipients found for this document' }), { status: 400 });
    }

    // Create signature requests for each signer
    const signatureRequestIds: string[] = [];
    const accessTokens: Record<string, string> = {};

    for (const participant of participants) {
      if (participant.accessLevel === 'SIGNER') {
        // Generate a secure access token for this participant
        const accessToken = crypto.randomUUID();
        accessTokens[participant.id] = accessToken;

        // Create signature request with access token
        await db.insert(signatureRequests).values({
          id: crypto.randomUUID(),
          documentId,
          participantId: participant.id,
          status: 'PENDING',
          signatureType: 'ELECTRONIC',
          accessToken, // Store the token for verification
          requestedAt: new Date(),
        });

        signatureRequestIds.push(participant.id);
      }
    }

    // Update document status to PENDING
    await db
      .update(documents)
      .set({
        updatedAt: new Date(),
      })
      .where(eq(documents.id, documentId));

    // Create audit log entry
    await db.insert(documentAuditLog).values({
      id: crypto.randomUUID(),
      documentId,
      userId: session.user.id,
      action: 'DOCUMENT_SENT',
      details: {
        recipientCount: participants.length,
        signerCount: signatureRequestIds.length,
        emailSubject,
      },
      createdAt: new Date(),
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    // Send emails to recipients based on signing order
    // For sequential signing, only send to signingOrder 0
    // For parallel signing, send to all
    const recipientsToNotify = participants.filter((p) => p.signingOrder === 0);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    let emailsSent = 0;

    for (const participant of recipientsToNotify) {
      if (participant.accessLevel === 'SIGNER') {
        // Fetch user information for this participant
        const recipientUser = await db.query.users.findFirst({
          where: (users, { eq }) => eq(users.id, participant.userId),
        });

        if (!recipientUser || !recipientUser.email) {
          logger.warn('Participant user not found or has no email', { participantId: participant.id });
          continue;
        }

        const accessToken = accessTokens[participant.id];
        const signingUrl = `${appUrl}/sign/${accessToken}`;

        const emailHtml = generateSigningEmail({
          recipientName: recipientUser.name || recipientUser.email,
          senderName: session.user.name || 'A user',
          documentName: document.name,
          signingUrl,
          message: emailMessage,
          expiresAt: document.expiresAt || undefined,
        });

        const emailSent = await sendEmail({
          to: recipientUser.email,
          subject: emailSubject || 'Please sign this document',
          html: emailHtml,
        });

        if (emailSent) {
          emailsSent++;

          // Track notification
          await db.insert(documentNotifications).values({
            id: crypto.randomUUID(),
            documentId,
            recipientEmail: recipientUser.email,
            notificationType: 'SIGNATURE_REQUEST',
            sentAt: new Date(),
            isDelivered: true,
            deliveredAt: new Date(),
          });
        } else {
          logger.warn('Failed to send email to participant', { participantId: participant.id });

          // Track failed notification
          await db.insert(documentNotifications).values({
            id: crypto.randomUUID(),
            documentId,
            recipientEmail: recipientUser.email,
            notificationType: 'SIGNATURE_REQUEST',
            sentAt: new Date(),
            isDelivered: false,
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Document sent successfully',
      documentId,
      recipientCount: participants.length,
      emailsSent,
      accessTokens, // Return tokens for testing purposes (remove in production)
    });
  } catch (error) {
    console.error('Error sending document:', error);
    return new NextResponse(JSON.stringify({ error: 'Failed to send document' }), { status: 500 });
  }
}
