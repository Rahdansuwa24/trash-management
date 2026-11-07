const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const path = require('path');
const crypto = require('crypto');
const env = require('./env');

const isR2Configured = Boolean(
  env.R2.accountId &&
  env.R2.accessKeyId &&
  env.R2.secretAccessKey &&
  env.R2.bucketName
);

let s3Client = null;

if (isR2Configured) {
  s3Client = new S3Client({
    region: 'auto',
    endpoint: `https://${env.R2.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: env.R2.accessKeyId,
      secretAccessKey: env.R2.secretAccessKey
    }
  });
}

/**
 * Upload buffer to Cloudflare R2, or fallback to mock placeholder in local development
 */
async function uploadToR2(file, folder = 'reports') {
  if (!file) return null;

  const ext = path.extname(file.originalname).toLowerCase();
  const randomSuffix = crypto.randomBytes(8).toString('hex');
  const filename = `${folder}/${Date.now()}-${randomSuffix}${ext}`;

  if (!isR2Configured) {
    console.log(`[R2 Dev Fallback] Simulating upload for ${file.originalname} -> ${filename}`);
    // Clean mock image URL for zero-friction local testing
    return `https://placehold.co/600x400/10B981/ffffff.png?text=${encodeURIComponent(path.basename(file.originalname, ext))}`;
  }

  const uploadParams = {
    Bucket: env.R2.bucketName,
    Key: filename,
    Body: file.buffer,
    ContentType: file.mimetype
  };

  await s3Client.send(new PutObjectCommand(uploadParams));

  const baseUrl = env.R2.publicUrl.replace(/\/$/, '');
  return `${baseUrl}/${filename}`;
}

module.exports = {
  isR2Configured,
  uploadToR2
};
