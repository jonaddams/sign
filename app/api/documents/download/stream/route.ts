import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth-js';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

// S3 client configuration
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

export async function GET(req: NextRequest) {
  try {
    // Verify the user is authenticated
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the S3 object key from query params
    const key = req.nextUrl.searchParams.get('key');
    if (!key) {
      return NextResponse.json({ error: 'Document key is required' }, { status: 400 });
    }

    // Create a command to get the object from S3
    const command = new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME || 'nutrient-sign',
      Key: key,
    });

    // Get the object data from S3
    const { Body, ContentType, ContentLength } = await s3Client.send(command);

    if (!Body) {
      return NextResponse.json({ error: 'Failed to retrieve document content' }, { status: 500 });
    }

    // Convert the readable stream to an array buffer
    const chunks = [];
    for await (const chunk of Body as any) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    // Create a response with the file content
    const response = new NextResponse(buffer);

    // Set appropriate headers
    response.headers.set('Content-Type', ContentType || 'application/octet-stream');
    if (ContentLength) {
      response.headers.set('Content-Length', ContentLength.toString());
    }
    response.headers.set('Content-Disposition', 'attachment');

    // Add cache control headers
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');

    return response;
  } catch (error) {
    console.error('Error streaming document:', error);
    return NextResponse.json({ error: 'Failed to stream document', details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
