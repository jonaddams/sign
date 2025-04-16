import { NextRequest, NextResponse } from 'next/server';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { s3Client } from '@/lib/s3';
import { auth } from '@/lib/auth/auth-js';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    let documentKey = searchParams.get('key');
    const useProxy = searchParams.get('proxy') === 'true';

    if (!documentKey) {
      return NextResponse.json({ error: 'Document key is required' }, { status: 400 });
    }

    // Fix double-encoding issue if present
    documentKey = decodeURIComponent(documentKey);

    console.log('Accessing S3 document with key:', documentKey);
    const bucketName = process.env.AWS_S3_BUCKET_NAME || 'nutrient-sign';

    // Create a GetObject command
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: documentKey,
    });

    // If proxy is not requested, generate a pre-signed URL
    if (!useProxy) {
      // Import getSignedUrl dynamically to avoid server component issues
      const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner');

      // Generate a pre-signed URL valid for 1 hour
      const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
      return NextResponse.json({ url: signedUrl });
    }

    // Otherwise, stream the file through our server
    try {
      const response = await s3Client.send(command);

      // Get the binary data
      const bodyContents = await response.Body?.transformToByteArray();

      if (!bodyContents) {
        console.error('No content returned from S3');
        return NextResponse.json({ error: 'Failed to read document contents' }, { status: 500 });
      }

      // Create response with appropriate content type
      const contentType = response.ContentType || 'application/octet-stream';
      console.log('Successfully retrieved file, content type:', contentType);

      // Create a new Response with the file content
      return new Response(bodyContents, {
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': 'inline',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-cache',
        },
      });
    } catch (s3Error: any) {
      console.error('S3 error details:', s3Error);
      return NextResponse.json(
        {
          error: 'Error retrieving document from storage',
          details: s3Error.message,
        },
        { status: 500 },
      );
    }
  } catch (error: any) {
    console.error('Error processing document request:', error);
    return NextResponse.json(
      {
        error: 'Error retrieving document',
        details: error.message,
      },
      { status: 500 },
    );
  }
}
