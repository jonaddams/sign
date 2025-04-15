import { NextResponse } from 'next/server';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';

// Initialize the S3 client
const s3 = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

// Bucket name from environment
const bucketName = process.env.S3_BUCKET_NAME || '';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    let documentKey = searchParams.get('key');
    const useProxy = searchParams.get('proxy') === 'true';

    // Handle if key is not provided
    if (!documentKey) {
      return NextResponse.json({ error: 'Document key is required' }, { status: 400 });
    }

    // Fix double-encoding issue
    documentKey = decodeURIComponent(documentKey);

    console.log('Accessing S3 document with key:', documentKey);
    console.log('Bucket name:', bucketName);

    // Create a GetObject command
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: documentKey,
    });

    // If proxy is not requested (default behavior), generate a pre-signed URL
    if (!useProxy) {
      // Generate a pre-signed URL that's valid for 1 hour
      const signedUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });

      // Return the URL for the client to use directly
      return NextResponse.json({ url: signedUrl });
    }

    // Otherwise, if proxy is requested, stream the file through our server
    try {
      const response = await s3.send(command);

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
