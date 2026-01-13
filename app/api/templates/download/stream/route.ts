import { PassThrough, Readable } from 'node:stream';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import type { NextRequest } from 'next/server';
import { auth } from '@/lib/auth/auth-js';
import { s3Client } from '@/lib/s3';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const key = searchParams.get('key');

    if (!key) {
      return new Response('Key parameter is required', { status: 400 });
    }

    const command = new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME || 'nutrient-sign',
      Key: key,
    });

    const response = await s3Client.send(command);

    const stream = Readable.from(response.Body as any).pipe(new PassThrough());

    return new Response(stream as any, {
      headers: {
        'Content-Type': response.ContentType || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${key.split('/').pop()}"`,
        'Content-Length': response.ContentLength?.toString() || '',
      },
    });
  } catch (error) {
    console.error('Error streaming template:', error);
    return new Response('Error streaming template', { status: 500 });
  }
}
