import crypto from 'crypto';
import dotenv from 'dotenv';
import { getEncryptionKey } from '../config/secrets.js';
dotenv.config();

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;

function getKey() {
  const envKey = getEncryptionKey();
  return crypto.createHash('sha256').update(envKey).digest();
}

/**
 * Encrypts plain text using AES-256-GCM.
 * Output format: iv:authTag:encryptedData (hex encoded)
 */
export function encrypt(text) {
  if (!text) return '';
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const key = getKey();
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
  } catch (err) {
    console.error('Encryption failed:', err.message);
    throw new Error('Failed to encrypt secret');
  }
}

/**
 * Decrypts string encrypted with AES-256-GCM.
 */
export function decrypt(encryptedPayload) {
  if (!encryptedPayload) return '';
  try {
    const parts = encryptedPayload.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted payload format');
    }
    
    const [ivHex, tagHex, encryptedHex] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(tagHex, 'hex');
    const key = getKey();
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (err) {
    console.error('Decryption failed:', err.message);
    throw new Error('Failed to decrypt secret');
  }
}

/**
 * Safely masks an API key for safe UI display.
 * E.g., 'AIzaSyDn98...7b2X'
 */
export function maskApiKey(key) {
  if (!key || typeof key !== 'string') return '';
  if (key.length <= 8) return '••••••••';
  const start = key.slice(0, 4);
  const end = key.slice(-4);
  return `${start}••••••••${end}`;
}
