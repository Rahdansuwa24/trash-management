const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const env = require('./env');

const isR2Configured = Boolean(
  env.R2.accountId &&
  env.R2.accessKeyId &&
  env.R2.secretAccessKey &&
  env.R2.bucketName &&
  env.R2.publicUrl
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
 * Upload buffer to Cloudflare R2, or save to local disk storage in development
 */
async function uploadToR2(file, folder = 'reports') {
  if (!file) return null;

  const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
  const randomSuffix = crypto.randomBytes(8).toString('hex');
  const baseFilename = `${Date.now()}-${randomSuffix}${ext}`;
  const filename = `${folder}/${baseFilename}`;

  // If Cloudflare R2 is not configured, save the real uploaded binary to local disk
  if (!isR2Configured) {
    if (file.buffer) {
      try {
        const uploadDir = path.join(__dirname, '../../public/uploads', folder);
        fs.mkdirSync(uploadDir, { recursive: true });
        const targetPath = path.join(uploadDir, baseFilename);
        fs.writeFileSync(targetPath, file.buffer);
        console.log(`[Local Upload Storage] Stored real file at: ${targetPath}`);
        return `/uploads/${filename}`;
      } catch (err) {
        console.error('[Local Upload Storage Error]', err);
      }
    }

    // Fallback placeholder only if buffer is somehow empty
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
