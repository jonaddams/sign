import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth-js';
import { db } from '@/database/drizzle/drizzle';
import { documents } from '@/database/drizzle/document-signing-schema';
import { eq, and, isNotNull } from 'drizzle-orm';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;

    // Restore: Clear deletedAt timestamp
    const result = await db
      .update(documents)
      .set({ deletedAt: null })
      .where(
        and(
          eq(documents.id, id),
          eq(documents.ownerId, session.user.id),
          isNotNull(documents.deletedAt) // Only restore if deleted
        )
      )
      .returning();

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Document not found or not in trash' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: 'Document restored' });
  } catch (error) {
    console.error('Error restoring document:', error);
    return NextResponse.json({ error: 'Failed to restore document' }, { status: 500 });
  }
}
