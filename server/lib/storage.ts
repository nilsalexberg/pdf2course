import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  CreateBucketCommand,
  HeadBucketCommand
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

let _s3: S3Client | null = null;

export function getS3(): S3Client {
  if (!_s3) {
    _s3 = new S3Client({
      endpoint: process.env.MINIO_ENDPOINT || 'http://localhost:9000',
      region: 'us-east-1',
      credentials: {
        accessKeyId: process.env.MINIO_ACCESS_KEY || 'minioadmin',
        secretAccessKey: process.env.MINIO_SECRET_KEY || 'minioadmin'
      },
      forcePathStyle: true
    });
  }
  return _s3;
}

export async function ensureBucket(bucket: string): Promise<void> {
  const s3 = getS3();
  const params = { Bucket: bucket };
  try {
    const cmd = new HeadBucketCommand(params);
    await s3.send(cmd);
  } catch {
    const cmd = new CreateBucketCommand(params);
    await s3.send(cmd);
  }
}

export async function uploadObject(
  bucket: string,
  key: string,
  body: Buffer,
  contentType: string
): Promise<void> {
  const cmd = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: body,
    ContentType: contentType
  });
  await getS3().send(cmd);
}

export async function deleteObject(bucket: string, key: string): Promise<void> {
  const cmd = new DeleteObjectCommand({ Bucket: bucket, Key: key });
  await getS3().send(cmd);
}

export async function downloadObject(bucket: string, key: string): Promise<Buffer> {
  const cmd = new GetObjectCommand({ Bucket: bucket, Key: key });
  const resp = await getS3().send(cmd);
  const bytes = await resp.Body!.transformToByteArray();
  return Buffer.from(bytes);
}

export async function createPresignedUrl(
  bucket: string,
  key: string,
  expiresIn: number
): Promise<string> {
  const cmd = new GetObjectCommand({ Bucket: bucket, Key: key });
  return getSignedUrl(getS3(), cmd, { expiresIn });
}
