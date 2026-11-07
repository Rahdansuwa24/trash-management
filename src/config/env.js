const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT, 10) || 3003,

  // TiDB Cloud Serverless / MySQL 8.0
  DB: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'db_trash',
    ssl: process.env.DB_SSL === 'true' || process.env.DB_SSL === '1'
  },

  // JWT Secret for authentication
  JWT_SECRET: process.env.JWT_SECRET || 'trash-management-dev-secret-key-2026',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',

  // Cloudflare R2 Object Storage
  R2: {
    accountId: process.env.R2_ACCOUNT_ID || '',
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
    bucketName: process.env.R2_BUCKET_NAME || 'portfolio-assets',
    publicUrl: process.env.R2_PUBLIC_URL || ''
  }
};

module.exports = env;
