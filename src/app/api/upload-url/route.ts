import { NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

function safeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9.\-_/]/g, '_');
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { fileName, contentType } = body || {};

    const BUCKET = process.env.S3_BUCKET;
    const REGION = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION;
    const ACCESS_KEY = process.env.AWS_ACCESS_KEY_ID;
    const SECRET = process.env.AWS_SECRET_ACCESS_KEY;

    if (!BUCKET || !REGION || !ACCESS_KEY || !SECRET) {
      return NextResponse.json({ error: 'S3 credentials or bucket not configured' }, { status: 500 });
    }

    const client = new S3Client({
      region: REGION,
      credentials: {
        accessKeyId: ACCESS_KEY,
        secretAccessKey: SECRET,
      },
    });

    const safeName = safeFileName(fileName || 'upload');
    const key = `uploads/${Date.now()}-${safeName}`;

    const command = new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      ContentType: contentType || 'application/octet-stream',
      ACL: 'public-read',
    });

    const url = await getSignedUrl(client, command, { expiresIn: 3600 });

    const publicUrl = `https://${BUCKET}.s3.${REGION}.amazonaws.com/${key}`;

    return NextResponse.json({ uploadUrl: url, key, publicUrl });
  } catch (err) {
    console.error('upload-url error', err);
    return NextResponse.json({ error: 'Failed to create upload URL' }, { status: 500 });
  }
}
