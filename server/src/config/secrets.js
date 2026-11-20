import dotenv from 'dotenv';
dotenv.config();

/**
 * Returns JWT secret with strict environment verification.
 * In production, throws an explicit fatal error if JWT_SECRET is not configured.
 */
export function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('FATAL SECURITY ERROR: JWT_SECRET environment variable is missing in production!');
    }
    // Development fallback
    return 'dev_only_jwt_secret_change_in_production_env_32chars';
  }
  return secret;
}

/**
 * Returns AES encryption key with strict environment verification.
 * In production, throws an explicit fatal error if ENCRYPTION_KEY is not configured.
 */
export function getEncryptionKey() {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('FATAL SECURITY ERROR: ENCRYPTION_KEY environment variable is missing in production!');
    }
    // Development fallback
    return 'dev_encryption_key_32_bytes_local_test_key_only';
  }
  return key;
}

/**
 * Sanitizes strings, URLs, and errors to prevent credential leaks in logs and responses.
 */
export function maskCredentials(str) {
  if (!str || typeof str !== 'string') return '';
  return str
    .replace(/:([^@/]+)@/, ':****@')
    .replace(/mongodb(\+srv)?:\/\/[^\s"']+/gi, (match) => match.replace(/:([^@/]+)@/, ':****@'))
    .replace(/sk-[a-zA-Z0-9_\-]{8,}/gi, 'sk-****')
    .replace(/AIza[0-9A-Za-z\-_]{10,}/g, 'AIza****');
}
