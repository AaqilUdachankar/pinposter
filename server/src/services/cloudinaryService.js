import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import ApiConfiguration from '../models/ApiConfiguration.js';
import { decrypt } from './cryptoService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOADS_DIR = path.resolve(__dirname, '../../uploads');

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

/**
 * Gets active Cloudinary configuration.
 */
export async function getCloudinaryConfig(userId) {
  let config = await ApiConfiguration.findOne({
    userId,
    providerType: 'storage',
    providerName: 'cloudinary',
    isEnabled: true,
  });

  let cloudName = config?.endpoint || process.env.CLOUDINARY_CLOUD_NAME || '';
  let apiKey = '';
  let apiSecret = '';

  if (config && config.encryptedApiKey) {
    try {
      apiKey = decrypt(config.encryptedApiKey);
      if (config.encryptedApiSecret) {
        apiSecret = decrypt(config.encryptedApiSecret);
      }
    } catch (e) {
      console.error('Failed to decrypt Cloudinary credentials:', e.message);
    }
  }

  if (!apiKey && process.env.CLOUDINARY_API_KEY) {
    apiKey = process.env.CLOUDINARY_API_KEY;
    apiSecret = process.env.CLOUDINARY_API_SECRET;
  }

  return { cloudName, apiKey, apiSecret, isConfigured: Boolean(cloudName && apiKey && apiSecret) };
}

/**
 * Tests connection to Cloudinary.
 */
export async function testCloudinaryConnection(cloudName, apiKey, apiSecret) {
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error('Cloud name, API key, and API secret are all required.');
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });

  try {
    const result = await cloudinary.api.ping();
    if (result.status === 'ok') {
      return { success: true, message: 'Cloudinary credentials verified successfully!' };
    }
    throw new Error('Cloudinary ping returned non-ok status');
  } catch (err) {
    throw new Error(`Cloudinary test failed: ${err.message}`);
  }
}

/**
 * Uploads an image buffer or file path to Cloudinary or saves locally.
 * Returns public URL and local file path.
 */
export async function uploadImage({ buffer, filename, userId }) {
  const safeFilename = `${Date.now()}-${filename.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
  const localPath = path.join(UPLOADS_DIR, safeFilename);

  // Write locally first as reliable cache/fallback
  await fs.promises.writeFile(localPath, buffer);
  const localUrl = `/uploads/${safeFilename}`;

  const { cloudName, apiKey, apiSecret, isConfigured } = await getCloudinaryConfig(userId);

  if (isConfigured) {
    try {
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
        secure: true,
      });

      const uploadResult = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: `pinposter/${userId}`,
            public_id: path.parse(safeFilename).name,
            resource_type: 'image',
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(buffer);
      });

      return {
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        localPath,
        provider: 'cloudinary',
      };
    } catch (err) {
      console.warn('Cloudinary upload failed, using local storage fallback:', err.message);
    }
  }

  // Fallback to local server static URL
  return {
    url: localUrl,
    publicId: safeFilename,
    localPath,
    provider: 'local',
  };
}
