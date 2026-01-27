import { and, eq } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';
import { documents } from '@/database/drizzle/document-signing-schema';
import { db } from '@/database/drizzle/drizzle';
import { auth } from '@/lib/auth/auth-js';

export async function DELETE(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;

    // Permanent delete: Remove from database
    const result = await db
      .delete(documents)
      .where(and(eq(documents.id, id), eq(documents.ownerId, session.user.id)))
      .returning();

    if (result.length === 0) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Document permanently deleted' });
  } catch (error) {
    console.error('Error permanently deleting document:', error);
    return NextResponse.json({ error: 'Failed to permanently delete document' }, { status: 500 });
  }
}
