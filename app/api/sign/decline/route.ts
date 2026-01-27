import { and, eq } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';
import { signatureRequests } from '@/database/drizzle/document-signing-schema';
import { db } from '@/database/drizzle/drizzle';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, signatureRequestId } = body;

    if (!token || !signatureRequestId) {
      return NextResponse.json({ error: 'Token and signature request ID are required' }, { status: 400 });
    }

    // Verify the token matches the signature request
    const signatureRequest = await db
      .select()
      .from(signatureRequests)
      .where(and(eq(signatureRequests.id, signatureRequestId), eq(signatureRequests.accessToken, token)))
      .limit(1);

    if (signatureRequest.length === 0) {
      return NextResponse.json({ error: 'Invalid signature request or access token' }, { status: 404 });
    }

    // Update signature request status to DECLINED
    await db
      .update(signatureRequests)
      .set({
        status: 'DECLINED',
      })
      .where(eq(signatureRequests.id, signatureRequestId));

    logger.info('Signature request declined', { signatureRequestId });

    return NextResponse.json({
      success: true,
      message: 'Signature declined successfully',
    });
  } catch (error) {
    logger.error('Error declining signature', error);
    return NextResponse.json({ error: 'Failed to decline signature' }, { status: 500 });
  }
}
