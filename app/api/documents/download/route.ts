import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth-js';
import { db } from '@/database/drizzle/drizzle';
import { documents } from '@/database/drizzle/document-signing-schema';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client } from '@/lib/s3';

export async function GET(req: NextRequest) {
  try {
    // Get authenticated user
    const session = await auth();

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Get document ID from URL params
    const searchParams = req.nextUrl.searchParams;
    const documentId = searchParams.get('id');

    if (!documentId) {
      return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
    }

    // Find the document in the database
    const document = await db.query.documents.findFirst({
      where: (docs, { and, eq }) => and(eq(docs.id, documentId), eq(docs.ownerId, userId)),
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Extract the file key from the S3 URL
    let fileKey = '';
    try {
      // Get the path portion of the URL (remove protocol, host, query params)
      const urlObj = new URL(document.documentFilePath);

      // Extract the path (remove leading /)
      fileKey = urlObj.pathname.substring(1);

      // If the URL is to S3 directly, it might include the bucket name in the path
      // Remove bucket name if present in the path
      const bucketName = process.env.AWS_S3_BUCKET_NAME || 'nutrient-sign';
      if (fileKey.startsWith(`${bucketName}/`)) {
        fileKey = fileKey.substring(bucketName.length + 1);
      }
    } catch (error) {
      console.error('Error parsing file URL:', error);
      return NextResponse.json({ error: 'Invalid document URL' }, { status: 400 });
    }

    if (!fileKey) {
      return NextResponse.json({ error: 'Could not determine file key' }, { status: 400 });
    }

    // Create a command to get the object from S3
    const command = new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME || 'nutrient-sign',
      Key: fileKey,
    });

    // Generate a fresh pre-signed URL with a longer expiration (1 hour)
    const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

    // Return the document details with a fresh signed URL
    return NextResponse.json({
      title: document.title,
      url: presignedUrl,
      // Include other necessary document info
    });
  } catch (error) {
    console.error('Error fetching document for download:', error);
    return NextResponse.json(
      { error: 'Failed to fetch document for download', details: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
