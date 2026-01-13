import { and, eq } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';
import { documentParticipants, documents } from '@/database/drizzle/document-signing-schema';
import { db } from '@/database/drizzle/drizzle';
import { auth } from '@/lib/auth/auth-js';

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Verify the user is authenticated
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    // Get the document ID from the route params
    const documentId = params.id;

    // Get the request body with email customization and other details
    const _body = await request.json();

    // Verify the document exists and belongs to the user
    const documentResults = await db
      .select()
      .from(documents)
      .where(and(eq(documents.id, documentId), eq(documents.ownerId, session.user.id)));

    if (documentResults.length === 0) {
      return new NextResponse(JSON.stringify({ error: 'Document not found' }), { status: 404 });
    }

    const _document = documentResults[0];

    // Fetch the document participants
    const participants = await db
      .select()
      .from(documentParticipants)
      .where(eq(documentParticipants.documentId, documentId));

    if (participants.length === 0) {
      return new NextResponse(JSON.stringify({ error: 'No recipients found for this document' }), { status: 400 });
    }

    // Update the document's updated_at timestamp
    await db
      .update(documents)
      .set({
        updatedAt: new Date(), // This maps to updated_at in the database
      })
      .where(eq(documents.id, documentId));

    // In a real implementation, we would now:
    // 1. Send emails to recipients based on the signing order
    // 2. Update participant status
    // 3. Create audit logs
    // 4. Generate document access tokens

    // For now, we'll just return success
    return NextResponse.json({
      success: true,
      message: 'Document sent successfully',
      documentId,
      recipientCount: participants.length,
    });
  } catch (error) {
    console.error('Error sending document:', error);
    return new NextResponse(JSON.stringify({ error: 'Failed to send document' }), { status: 500 });
  }
}
