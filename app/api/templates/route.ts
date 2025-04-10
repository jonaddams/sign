import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/database/drizzle/drizzle';
import { documentTemplates } from '@/database/drizzle/document-signing-schema';
import { auth } from '@/lib/auth/auth-js';
import { desc } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const templates = await db.query.documentTemplates.findMany({
      where: (documentTemplates, { eq }) => {
        const userId = session.user!.id as string;
        return eq(documentTemplates.creatorId, userId);
      },
      orderBy: [desc(documentTemplates.createdAt)],
    });

    return NextResponse.json({ templates });
  } catch (error) {
    console.error('Error fetching templates:', error);
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const requiredFields = ['name', 'file_url'];
    const missingFields = requiredFields.filter((field) => !data[field]);

    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          error: `Missing required fields: ${missingFields.join(', ')}`,
        },
        { status: 400 },
      );
    }

    const template = await db
      .insert(documentTemplates)
      .values({
        id: crypto.randomUUID(),
        name: data.name,
        templateFilePath: data.file_url,
        creatorId: session.user.id,
        createdAt: new Date(),
        description: data.description || null,
      })
      .returning();

    return NextResponse.json({ template: template[0] });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to create template',
      },
      { status: 500 },
    );
  }
}
