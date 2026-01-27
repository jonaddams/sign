import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth-js';

// Create S3 client specifically for presigned URLs with virtual-hosted style
const presignedUrlClient = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
  // Explicitly disable path-style URLs to force virtual-hosted style
  endpoint: undefined,
  forcePathStyle: false,
  useGlobalEndpoint: false,
});

// File upload security configuration
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'image/jpeg',
  'image/png',
  'image/tiff',
];

const ALLOWED_EXTENSIONS = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'jpg', 'jpeg', 'png', 'tiff', 'tif'];

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { filename, contentType, fileSize } = body;

    if (!filename || !contentType) {
      return NextResponse.json({ error: 'Filename and content type are required' }, { status: 400 });
    }

    // Validate file size
    if (fileSize && fileSize > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 },
      );
    }

    // Validate content type
    if (!ALLOWED_MIME_TYPES.includes(contentType)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only PDF, Word, Excel, PowerPoint, and image files are allowed.' },
        { status: 400 },
      );
    }

    // Validate file extension
    const fileExtension = filename.split('.').pop()?.toLowerCase();
    if (!fileExtension || !ALLOWED_EXTENSIONS.includes(fileExtension)) {
      return NextResponse.json(
        { error: 'Invalid file extension. Only PDF, Word, Excel, PowerPoint, and image files are allowed.' },
        { status: 400 },
      );
    }

    // Generate secure random filename with proper extension
    const timestamp = Date.now();
    const randomString = crypto.randomUUID().substring(0, 8);
    const s3Key = `${timestamp}-${randomString}.${fileExtension}`;

    // Create presigned URL for upload
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: s3Key,
      ContentType: contentType,
      Metadata: {
        originalFilename: filename,
        uploadedBy: session.user.id,
      },
    });

    // Generate presigned URL (valid for 15 minutes)
    const presignedUrl = await getSignedUrl(presignedUrlClient, command, { expiresIn: 900 });

    // The final S3 URL after upload
    const fileUrl = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Key}`;

    return NextResponse.json({
      presignedUrl,
      fileUrl,
      s3Key,
    });
  } catch (error) {
    console.error('Presigned URL generation error:', error);
    return NextResponse.json({ error: 'Failed to generate upload URL' }, { status: 500 });
  }
}
