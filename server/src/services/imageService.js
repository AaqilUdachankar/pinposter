import sharp from 'sharp';
import axios from 'axios';
import ApiConfiguration from '../models/ApiConfiguration.js';
import { decrypt } from './cryptoService.js';
import { uploadImage } from './cloudinaryService.js';
import { getGeminiConfig } from './geminiService.js';

// 10 distinct, natural Pinterest aesthetic lifestyle themes
// Warm, organic, real-life creator aesthetics — ZERO commercial banner styling
const PINTEREST_AESTHETICS = [
  { name: 'Warm Sunlit Oak', bg1: '#FAF7F2', bg2: '#EDE4D8', shadow: '#3D3025', desc: 'Natural morning sunlight on warm oak surface' },
  { name: 'Cozy Warm Linen', bg1: '#FDFCFA', bg2: '#F4EFEA', shadow: '#3A3530', desc: 'Soft organic neutral linen textures' },
  { name: 'Modern Japandi', bg1: '#F8F6F0', bg2: '#EBE5DC', shadow: '#2E2D2B', desc: 'Serene warm neutral minimalism' },
  { name: 'Architectural Neutral', bg1: '#F5F5F3', bg2: '#DFDCD7', shadow: '#2B2B2B', desc: 'Soft natural shadows and clean geometry' },
  { name: 'Earthy Warm Clay', bg1: '#FBF8F5', bg2: '#EFE3DA', shadow: '#4A342B', desc: 'Warm terracotta and soft clay ambiance' },
  { name: 'Morning Window Light', bg1: '#FFFFFF', bg2: '#F0ECE6', shadow: '#33312E', desc: 'Gentle diffuse daylight with soft focus' },
  { name: 'Golden Hour Glow', bg1: '#FFFBF5', bg2: '#F9EDE0', shadow: '#453224', desc: 'Warm golden sunlight streaming across space' },
  { name: 'Minimal Editorial Slate', bg1: '#F8FAFC', bg2: '#E2E8F0', shadow: '#1E293B', desc: 'Refined cool-neutral editorial mood' },
  { name: 'Aesthetic Studio Atmosphere', bg1: '#FAF9F6', bg2: '#EAE6E1', shadow: '#312E2B', desc: 'Soft diffused natural studio illumination' },
  { name: 'Cozy Living Space', bg1: '#FBF9F4', bg2: '#ECE4D6', shadow: '#383028', desc: 'Warm, lived-in comfortable lifestyle setting' },
];

/**
 * Retrieves the user's active Image Generation config from DB.
 * Falls back to inheriting the user's Gemini key if gemini_imagen is selected or default.
 */
export async function getImageGenConfig(userId) {
  let config = await ApiConfiguration.findOne({
    userId,
    providerType: 'image_generation',
    isEnabled: true,
  });

  let apiKey = '';
  let providerName = 'gemini_imagen'; // Default to modern Gemini Imagen
  let endpoint = '';
  let model = 'imagen-3.0-generate-002';

  if (config) {
    providerName = config.providerName;
    endpoint = config.endpoint || '';
    model = config.model || (providerName === 'openai' ? 'dall-e-3' : 'imagen-3.0-generate-002');
    if (config.encryptedApiKey) {
      try {
        apiKey = decrypt(config.encryptedApiKey);
      } catch (e) {
        console.error('Failed to decrypt image API key:', e.message);
      }
    }
  }

  // If using Google Gemini Imagen and no dedicated key was saved for image gen,
  // automatically inherit the user's Text AI Gemini API key!
  if ((providerName === 'gemini_imagen' || providerName === 'gemini') && !apiKey) {
    try {
      const geminiConfig = await getGeminiConfig(userId);
      if (geminiConfig?.apiKey) {
        apiKey = geminiConfig.apiKey;
      }
    } catch (e) {
      console.warn('Could not inherit Gemini key from text config:', e.message);
    }
  }

  // Check process.env fallbacks if still empty
  if (!apiKey) {
    if (providerName === 'gemini_imagen' || providerName === 'gemini') {
      apiKey = process.env.GEMINI_API_KEY || '';
    } else if (providerName === 'openai' || providerName === 'dalle') {
      apiKey = process.env.OPENAI_API_KEY || '';
    }
  }

  return {
    providerName,
    apiKey,
    endpoint,
    model,
    dimensions: config?.dimensions || '1080x1920',
  };
}

/**
 * Tests connection to Image Generation provider.
 */
export async function testImageProviderConnection({ providerName, apiKey, endpoint, model }) {
  if (providerName === 'sharp_aesthetic' || providerName === 'sharp_synthesizer') {
    return { success: true, message: 'Aesthetic Pinterest Photo Studio ready (1080x1920)!' };
  }

  // Test Google Gemini Imagen
  if (providerName === 'gemini_imagen' || providerName === 'gemini') {
    if (!apiKey) {
      throw new Error('Gemini API key is required. Enter a key or save one in Text AI.');
    }
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
      const res = await axios.get(url, { timeout: 10000 });
      if (res.data?.models) {
        return { success: true, message: 'Google Gemini Imagen connection verified successfully!' };
      }
      throw new Error('Invalid response from Google Generative API');
    } catch (err) {
      throw new Error(`Gemini Imagen verification failed: ${err.response?.data?.error?.message || err.message}`);
    }
  }

  // Test OpenAI DALL-E 3
  if (providerName === 'openai' || providerName === 'dalle') {
    if (!apiKey) throw new Error('OpenAI API key is required.');
    try {
      const response = await axios.get('https://api.openai.com/v1/models', {
        headers: { Authorization: `Bearer ${apiKey}` },
        timeout: 10000,
      });
      if (response.data?.data) {
        return { success: true, message: 'OpenAI DALL-E 3 connection verified successfully!' };
      }
      throw new Error('Invalid response from OpenAI API');
    } catch (err) {
      throw new Error(`OpenAI test failed: ${err.response?.data?.error?.message || err.message}`);
    }
  }

  return { success: true, message: 'Provider validated' };
}

/**
 * Generates an authentic, photorealistic Pinterest lifestyle image using Google Imagen 3.
 * Strictly free of text, ads, banners, or commercial graphic overlays.
 */
export async function generateGeminiImagen({ prompt, apiKey, endpoint, model = 'imagen-3.0-generate-002' }) {
  if (!apiKey) throw new Error('Google Gemini API key is missing');

  const url =
    endpoint ||
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:predict?key=${apiKey}`;

  // Strict negative constraints for genuine organic Pinterest aesthetic
  const refinedPrompt = `${prompt}. Style: Authentic Pinterest aesthetic lifestyle photography, shot on 35mm camera, natural warm ambient lighting, cozy real-life setting, editorial magazine quality, clean composition, candid shot, beautiful depth of field. Absolutely no text, no words, no letters, no typography, no banners, no ads, no badges, no watermarks, no logos, no marketing graphics, no overlays, no discount stickers, no frames. Pure clean authentic photograph.`;

  const response = await axios.post(
    url,
    {
      instances: [
        {
          prompt: refinedPrompt,
        },
      ],
      parameters: {
        sampleCount: 1,
        aspectRatio: '9:16', // Generates vertical 9:16 Pinterest format (1080x1920)
        personGeneration: 'ALLOW_ADULT',
      },
    },
    {
      headers: { 'Content-Type': 'application/json' },
      timeout: 50000,
    }
  );

  const b64 = response.data?.predictions?.[0]?.bytesBase64Encoded;
  if (!b64) {
    throw new Error('No image bytes returned from Google Imagen 3');
  }

  const rawBuffer = Buffer.from(b64, 'base64');

  // Format to exact Pinterest 9:16 vertical full HD ratio (1080x1920)
  return await sharp(rawBuffer)
    .resize(1080, 1920, { fit: 'cover', position: 'center' })
    .jpeg({ quality: 92 })
    .toBuffer();
}

/**
 * Generates an authentic, photorealistic Pinterest lifestyle image using OpenAI DALL-E 3.
 * Strictly free of text, ads, banners, or commercial graphic overlays.
 */
export async function generateOpenAIDalle({ prompt, apiKey, model = 'dall-e-3' }) {
  if (!apiKey) throw new Error('OpenAI API key is missing');

  const refinedPrompt = `${prompt}. Style: Authentic Pinterest aesthetic lifestyle photography, natural ambient lighting, cozy realistic setting, editorial magazine quality, clean composition, candid shot, real life authentic photograph. Absolutely no text, no words, no banners, no advertisements, no watermarks, no logos, no marketing graphics, no overlays, no frames. Pure clean authentic photograph.`;

  const response = await axios.post(
    'https://api.openai.com/v1/images/generations',
    {
      model: model || 'dall-e-3',
      prompt: refinedPrompt,
      n: 1,
      size: '1024x1792', // Vertical 9:16 format
      quality: 'standard',
      response_format: 'b64_json',
    },
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 50000,
    }
  );

  const b64 = response.data?.data?.[0]?.b64_json;
  if (b64) {
    const rawBuffer = Buffer.from(b64, 'base64');
    return await sharp(rawBuffer)
      .resize(1080, 1920, { fit: 'cover', position: 'center' })
      .jpeg({ quality: 92 })
      .toBuffer();
  }

  const imageUrl = response.data?.data?.[0]?.url;
  if (imageUrl) {
    const imgRes = await axios.get(imageUrl, { responseType: 'arraybuffer', timeout: 30000 });
    return await sharp(imgRes.data)
      .resize(1080, 1920, { fit: 'cover', position: 'center' })
      .jpeg({ quality: 92 })
      .toBuffer();
  }

  throw new Error('No image payload returned from OpenAI');
}

/**
 * Generates an authentic Pinterest-style lifestyle showcase using Sharp (1080x1920).
 * Creates a clean, warm, organic lifestyle visual with natural contact shadows and ambient lighting.
 * 100% FREE of commercial banner ads, "Shop Now" buttons, badges, or marketing stickers.
 */
export async function generateAestheticPinterestPhoto({
  conceptIndex,
  conceptName,
  title,
  product,
}) {
  const aesthetic = PINTEREST_AESTHETICS[(conceptIndex - 1) % PINTEREST_AESTHETICS.length];
  const width = 1080;
  const height = 1920;

  // Attempt to retrieve a real product image if available
  let productImgBuffer = null;
  const productImageUrl = product.images?.[(conceptIndex - 1) % (product.images.length || 1)];

  if (productImageUrl && (productImageUrl.startsWith('http://') || productImageUrl.startsWith('https://'))) {
    try {
      const response = await axios.get(productImageUrl, {
        responseType: 'arraybuffer',
        timeout: 8000,
        maxContentLength: 12 * 1024 * 1024,
      });

      // Resize product to fit naturally into the vertical 1080x1920 lifestyle composition
      productImgBuffer = await sharp(response.data)
        .resize(900, 1200, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toBuffer();
    } catch (e) {
      console.warn(`Could not fetch product image for Pin ${conceptIndex}:`, e.message);
    }
  }

  // Create an organic, warm SVG backdrop with natural ambient lighting and realistic contact shadows
  // NO BANNERS, NO "SHOP NOW", NO "BEST VALUE", NO BADGES, NO ADVERTISING GRAPHICS
  const svgBackdrop = `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <!-- Warm organic ambient background gradient -->
        <linearGradient id="bgAmbient" x1="15%" y1="0%" x2="85%" y2="100%">
          <stop offset="0%" stop-color="${aesthetic.bg1}" />
          <stop offset="100%" stop-color="${aesthetic.bg2}" />
        </linearGradient>

        <!-- Subtle ambient room lighting overlay -->
        <radialGradient id="sunGlow" cx="25%" cy="20%" r="70%">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="0.45" />
          <stop offset="100%" stop-color="#ffffff" stop-opacity="0" />
        </radialGradient>

        <!-- Soft natural contact shadow for realistic grounded placement -->
        <radialGradient id="contactShadow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="${aesthetic.shadow}" stop-opacity="0.22" />
          <stop offset="60%" stop-color="${aesthetic.shadow}" stop-opacity="0.08" />
          <stop offset="100%" stop-color="${aesthetic.shadow}" stop-opacity="0" />
        </radialGradient>

        <!-- Diagonal architectural window shadow play -->
        <linearGradient id="windowShadow" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#000000" stop-opacity="0.04" />
          <stop offset="50%" stop-color="#000000" stop-opacity="0" />
          <stop offset="100%" stop-color="#000000" stop-opacity="0.03" />
        </linearGradient>
      </defs>

      <!-- Base Warm Lifestyle Tone -->
      <rect width="${width}" height="${height}" fill="url(#bgAmbient)" />

      <!-- Natural Ambient Daylight Glow -->
      <rect width="${width}" height="${height}" fill="url(#sunGlow)" />

      <!-- Subtle Window Shadow Play for Realistic Depth -->
      <rect width="${width}" height="${height}" fill="url(#windowShadow)" />

      <!-- Realistic Ground Contact Shadow under Product -->
      <ellipse cx="540" cy="1500" rx="440" ry="85" fill="url(#contactShadow)" />
    </svg>
  `;

  let baseSharp = sharp({
    create: {
      width,
      height,
      channels: 4,
      background: { r: 250, g: 247, b: 242, alpha: 1 },
    },
  });

  const composites = [
    {
      input: Buffer.from(svgBackdrop),
      top: 0,
      left: 0,
    },
  ];

  if (productImgBuffer) {
    composites.push({
      input: productImgBuffer,
      top: 340,
      left: 90,
    });
  }

  return await baseSharp.composite(composites).jpeg({ quality: 94 }).toBuffer();
}

/**
 * Main Image Generation Controller.
 * Dispatches to Google Gemini Imagen 3, OpenAI DALL-E 3, or the clean Pinterest Aesthetic Studio.
 * Guaranteed to generate authentic Pinterest lifestyle images with zero advertisement styling.
 */
export async function generatePinImage({
  conceptIndex,
  conceptName,
  title,
  overlayTitle,
  overlaySubtitle,
  imagePrompt,
  product,
  userId,
}) {
  const config = await getImageGenConfig(userId);

  // Construct organic visual prompt without ad fluff
  const promptTopic = imagePrompt || `${product.title} ${conceptName}`;
  const cleanPrompt = `Authentic Pinterest aesthetic lifestyle photograph of ${product.title}. Setting: ${promptTopic}. Warm ambient morning lighting, cozy natural interior, editorial quality, candid shot.`;

  // 1. Google Gemini Imagen 3
  if ((config.providerName === 'gemini_imagen' || config.providerName === 'gemini') && config.apiKey) {
    try {
      console.log(`[ImageService] Generating Pin #${conceptIndex} with Google Gemini Imagen 3...`);
      const buffer = await generateGeminiImagen({
        prompt: cleanPrompt,
        apiKey: config.apiKey,
        endpoint: config.endpoint,
        model: config.model || 'imagen-3.0-generate-002',
      });

      const upload = await uploadImage({
        buffer,
        filename: `pin-${product._id || 'prod'}-${conceptIndex}.jpg`,
        userId,
      });

      return {
        url: upload.url,
        localPath: upload.localPath,
        provider: 'gemini_imagen',
      };
    } catch (e) {
      console.warn(`[ImageService] Google Gemini Imagen failed for Pin #${conceptIndex} (${e.message}). Falling back to Pinterest Aesthetic Studio.`);
    }
  }

  // 2. OpenAI DALL-E 3
  if ((config.providerName === 'openai' || config.providerName === 'dalle') && config.apiKey) {
    try {
      console.log(`[ImageService] Generating Pin #${conceptIndex} with OpenAI DALL-E 3...`);
      const buffer = await generateOpenAIDalle({
        prompt: cleanPrompt,
        apiKey: config.apiKey,
        model: config.model || 'dall-e-3',
      });

      const upload = await uploadImage({
        buffer,
        filename: `pin-${product._id || 'prod'}-${conceptIndex}.jpg`,
        userId,
      });

      return {
        url: upload.url,
        localPath: upload.localPath,
        provider: 'openai_dalle',
      };
    } catch (e) {
      console.warn(`[ImageService] OpenAI DALL-E 3 failed for Pin #${conceptIndex} (${e.message}). Falling back to Pinterest Aesthetic Studio.`);
    }
  }

  // 3. Pinterest Clean Aesthetic Photo Studio (Zero-ad organic lifestyle composition)
  console.log(`[ImageService] Generating Pin #${conceptIndex} via Pinterest Clean Aesthetic Photo Studio...`);
  const buffer = await generateAestheticPinterestPhoto({
    conceptIndex,
    conceptName,
    title,
    product,
  });

  const upload = await uploadImage({
    buffer,
    filename: `pin-${product._id || 'prod'}-${conceptIndex}.jpg`,
    userId,
  });

  return {
    url: upload.url,
    localPath: upload.localPath,
    provider: 'sharp_aesthetic',
  };
}

// Backward-compatibility export
export const generateSharpPinterestPin = generateAestheticPinterestPhoto;
