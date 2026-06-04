const path = require('path');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

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

module.exports = {
  isCloudStorageEnabled,
  uploadBufferToCloud,
  cloudKeyForFile,
  buildPublicUrl,
};
