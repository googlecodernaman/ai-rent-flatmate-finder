const dotenv = require('dotenv');
const path = require('path');

// Load .env from backend root (where package.json lives), regardless of where this file is called from
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const env = {
  // Server
  PORT: parseInt(process.env.PORT, 10) || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',

  // Database
  DATABASE_URL: process.env.DATABASE_URL || '',

  // Auth
  JWT_SECRET: process.env.JWT_SECRET || '',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',

  // LLM
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY || '',

  // Email
  RESEND_API_KEY: process.env.RESEND_API_KEY || '',
  EMAIL_FROM: process.env.EMAIL_FROM || 'onboarding@resend.dev',

  // App
  SCORE_THRESHOLD: parseInt(process.env.SCORE_THRESHOLD, 10) || 80,
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
};

/**
 * Validates that all required environment variables are set.
 * In production, missing required vars cause an immediate crash (fail-fast).
 * In development, missing vars are logged as warnings.
 */
function validateEnv() {
  const required = ['DATABASE_URL', 'JWT_SECRET'];
  const missing = required.filter((key) => !env[key]);

  if (missing.length > 0) {
    const message = `Missing required environment variables: ${missing.join(', ')}`;
    if (env.NODE_ENV === 'production') {
      throw new Error(message);
    }
    console.warn(`⚠️  ${message} (non-fatal in development)`);
  }

  const optional = ['OPENROUTER_API_KEY', 'RESEND_API_KEY'];
  const missingOptional = optional.filter((key) => !env[key]);
  if (missingOptional.length > 0) {
    console.warn(
      `ℹ️  Optional env vars not set: ${missingOptional.join(', ')} — related features will use fallbacks`
    );
  }
}

module.exports = { env, validateEnv };
