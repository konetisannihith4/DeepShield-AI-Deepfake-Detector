import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });


export const ENV = {
  PORT: process.env.PORT || '5000',
  NODE_ENV: process.env.NODE_ENV || 'development',
  DATABASE_URL: process.env.DATABASE_URL || 'mysql://root:password@localhost:3306/deepshield',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  JWT_SECRET: process.env.JWT_SECRET || 'super-secret-jwt-key-deepshield-ai-enterprise-2026',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '15m',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'super-secret-refresh-key-deepshield-ai-enterprise-2026',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  MAX_FILE_SIZE_MB: parseInt(process.env.MAX_FILE_SIZE_MB || '50', 10),
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',

  // SMTP Email Provider Configuration
  SMTP_HOST: process.env.SMTP_HOST || '',
  SMTP_PORT: parseInt(process.env.SMTP_PORT || '587', 10),
  SMTP_SECURE: process.env.SMTP_SECURE === 'true' || process.env.SMTP_PORT === '465',
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASSWORD: process.env.SMTP_PASSWORD || process.env.SMTP_PASS || '',
  SMTP_FROM: process.env.SMTP_FROM || 'DeepShield Enterprise Security <security@deepshield.ai>',
};
