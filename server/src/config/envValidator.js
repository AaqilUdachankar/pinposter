/**
 * PinPoster Environment Variable Security Validator
 * Validates all required and optional environment variables before startup.
 * Halts execution immediately if critical variables are missing or insecure in production.
 */

export function validateEnvironment() {
  const isProduction = process.env.NODE_ENV === 'production';
  const errors = [];
  const warnings = [];

  // 1. Critical Database Connection URI
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    if (isProduction) {
      errors.push('MONGODB_URI is required in production.');
    } else {
      warnings.push('MONGODB_URI is not set. Defaulting to local/embedded MongoDB for development.');
    }
  } else if (isProduction) {
    if (mongoUri.includes('<db_password>') || mongoUri.includes('<password>')) {
      errors.push('MONGODB_URI contains unconfigured placeholder credentials (<db_password>).');
    }
    if (mongoUri.includes('127.0.0.1') || mongoUri.includes('localhost')) {
      errors.push('MONGODB_URI cannot point to localhost or loopback 127.0.0.1 in production.');
    }
  }

  // 2. JWT Signing Secret
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    if (isProduction) {
      errors.push('JWT_SECRET is required in production.');
    } else {
      warnings.push('JWT_SECRET is not set. Using temporary development fallback secret.');
    }
  } else if (isProduction && jwtSecret.length < 32) {
    errors.push(`JWT_SECRET is too short (${jwtSecret.length} chars). Production requires minimum 32 characters.`);
  }

  // 3. AES-256 Encryption Key (for user API configs)
  const encKey = process.env.ENCRYPTION_KEY;
  if (!encKey) {
    if (isProduction) {
      errors.push('ENCRYPTION_KEY is required in production for AES-256-GCM encryption.');
    } else {
      warnings.push('ENCRYPTION_KEY is not set. Using temporary development fallback key.');
    }
  } else if (isProduction && encKey.length < 32) {
    errors.push(`ENCRYPTION_KEY is too short (${encKey.length} chars). Production requires a minimum 32-character key.`);
  }

  // 4. Client Frontend Origin (CORS)
  const clientUrl = process.env.CLIENT_URL;
  if (!clientUrl) {
    if (isProduction) {
      errors.push('CLIENT_URL is required in production to restrict CORS to your frontend domain.');
    } else {
      warnings.push('CLIENT_URL is not set. Defaulting to http://localhost:5173.');
    }
  } else if (isProduction && clientUrl.includes('*')) {
    errors.push('CLIENT_URL cannot be a wildcard (*) in production.');
  }

  // 5. Cloudinary Storage Configuration
  const hasCloudinary = process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_API_KEY || process.env.CLOUDINARY_API_SECRET;
  if (hasCloudinary) {
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      errors.push('Cloudinary is partially configured. All three variables (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET) must be set together.');
    }
  }

  // Log development warnings
  if (warnings.length > 0 && !isProduction) {
    console.warn('\n⚠️  [DEV ENVIRONMENT WARNINGS]');
    warnings.forEach((w) => console.warn(`   • ${w}`));
    console.warn('');
  }

  // Abort startup if critical production requirements are violated
  if (errors.length > 0) {
    console.error('\n🛑 ========================================================');
    console.error('🛑 CRITICAL PRE-FLIGHT ENVIRONMENT CONFIGURATION ERRORS:');
    errors.forEach((err) => console.error(`   ❌ ${err}`));
    console.error('🛑 Application refused to start to prevent insecure operation.');
    console.error('🛑 Configure missing variables in environment or server/.env.');
    console.error('🛑 ========================================================\n');
    throw new Error(`Environment pre-flight validation failed with ${errors.length} fatal error(s). Server startup aborted.`);
  }

  return true;
}
