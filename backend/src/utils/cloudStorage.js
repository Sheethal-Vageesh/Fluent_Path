const path = require('path');
const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

let s3Client = null;

function isCloudStorageEnabled() {
  return Boolean(
    process.env.S3_BUCKET &&
      process.env.AWS_ACCESS_KEY_ID &&
      process.env.AWS_SECRET_ACCESS_KEY
  );
}

function getS3Client() {
  if (!s3Client) {
    s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
  }
  return s3Client;
}

function buildPublicUrl(key) {
  const base = (process.env.S3_PUBLIC_BASE_URL || '').replace(/\/$/, '');
  if (base) return `${base}/${key}`;

  const bucket = process.env.S3_BUCKET;
  const region = process.env.AWS_REGION || 'us-east-1';
  if (region === 'us-east-1') {
    return `https://${bucket}.s3.amazonaws.com/${key}`;
  }
  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
}

/**
 * Upload a buffer to S3 and return the public URL stored in the database.
 */
async function uploadBufferToCloud(buffer, key, contentType) {
  const bucket = process.env.S3_BUCKET;
  const client = getS3Client();

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: buffer,
    ContentType: contentType || 'application/octet-stream',
  });

  await client.send(command);
  return buildPublicUrl(key.replace(/\\/g, '/'));
}

function cloudKeyForFile(subdir, originalName) {
  const ext = path.extname(originalName || '').toLowerCase() || '.bin';
  const safeExt = ext.length <= 6 ? ext : '.bin';
  return `${subdir}/${Date.now()}-${Math.random().toString(16).slice(2)}${safeExt}`;
}

/** Extract object key from a URL we stored (S3 or S3_PUBLIC_BASE_URL). */
function s3KeyFromStoredUrl(storedUrl) {
  if (!storedUrl || typeof storedUrl !== 'string') return null;
  const bucket = process.env.S3_BUCKET;
  if (!bucket) return null;

  try {
    const u = new URL(storedUrl);
    const host = u.hostname;
    const pathname = decodeURIComponent(u.pathname.replace(/^\//, ''));

    if (host === `${bucket}.s3.amazonaws.com` || host.startsWith(`${bucket}.s3.`)) {
      return pathname;
    }
    if (host.startsWith('s3.') && pathname.startsWith(`${bucket}/`)) {
      return pathname.slice(bucket.length + 1);
    }

    const base = (process.env.S3_PUBLIC_BASE_URL || '').replace(/\/$/, '');
    if (base && storedUrl.startsWith(`${base}/`)) {
      return decodeURIComponent(storedUrl.slice(base.length + 1));
    }
  } catch {
    return null;
  }
  return null;
}

/**
 * Return a URL the browser can use to play/download the file.
 * Private S3 objects get a short-lived presigned URL; local paths are unchanged.
 */
async function resolveReadableMediaUrl(storedUrl) {
  if (!storedUrl || !storedUrl.trim()) return '';
  if (!storedUrl.startsWith('http')) return storedUrl;
  if (!isCloudStorageEnabled()) return storedUrl;

  const key = s3KeyFromStoredUrl(storedUrl);
  if (!key) return storedUrl;

  try {
    const command = new GetObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: key,
    });
    return await getSignedUrl(getS3Client(), command, { expiresIn: 60 * 60 * 4 });
  } catch (err) {
    console.error('[S3 presign]', err.message);
    return storedUrl;
  }
}

module.exports = {
  isCloudStorageEnabled,
  uploadBufferToCloud,
  cloudKeyForFile,
  buildPublicUrl,
  s3KeyFromStoredUrl,
  resolveReadableMediaUrl,
};
