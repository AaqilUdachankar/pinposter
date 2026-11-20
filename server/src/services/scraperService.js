import axios from 'axios';
import * as cheerio from 'cheerio';
import { URL } from 'url';
import dns from 'dns/promises';

// Private and reserved IP range detection to protect against SSRF
const PRIVATE_IP_REGEX = /^(10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|127\.\d{1,3}\.\d{1,3}\.\d{1,3}|169\.254\.\d{1,3}\.\d{1,3}|0\.0\.0\.0|::1|fe80::.*|fc00::.*)$/i;

/**
 * Validates that a target URL is safe from SSRF attacks.
 */
export async function validateSafeUrl(targetUrl) {
  let parsed;
  try {
    parsed = new URL(targetUrl);
  } catch (err) {
    throw new Error('Invalid URL format');
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('Invalid protocol: Only HTTP and HTTPS are permitted');
  }

  const hostname = parsed.hostname.toLowerCase();

  if (
    hostname === 'localhost' ||
    hostname.endsWith('.localhost') ||
    hostname.endsWith('.local') ||
    hostname === '127.0.0.1' ||
    hostname === '::1'
  ) {
    throw new Error('Access to local hostnames is strictly prohibited');
  }

  try {
    const addresses = await dns.lookup(hostname, { all: true });
    for (const addr of addresses) {
      if (PRIVATE_IP_REGEX.test(addr.address)) {
        throw new Error('Access to private/internal network addresses is prohibited');
      }
    }
  } catch (dnsErr) {
    if (dnsErr.message.includes('prohibited')) throw dnsErr;
    console.warn(`DNS lookup warning for ${hostname}: ${dnsErr.message}`);
  }

  return parsed.toString();
}

/**
 * Extracts product metadata from URL using Open Graph, Schema.org JSON-LD, and HTML tags.
 */
export async function extractProductMetadata(targetUrl) {
  const safeUrl = await validateSafeUrl(targetUrl);

  const client = axios.create({
    timeout: 10000,
    maxContentLength: 10 * 1024 * 1024, // 10MB limit
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 PinPoster/1.0',
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
    },
  });

  let response;
  try {
    response = await client.get(safeUrl);
  } catch (fetchErr) {
    console.warn(`Direct fetch failed for ${safeUrl}: ${fetchErr.message}`);
    // Return partial failure so user can enter information manually
    return {
      success: false,
      title: 'Affiliate Product',
      description: '',
      price: '',
      currency: 'USD',
      brand: '',
      category: 'General',
      images: [],
      features: [],
      extractionStatus: 'failed',
      error: `Could not reach product website (${fetchErr.message}). You can fill in the details manually.`,
    };
  }

  const html = response.data;
  const $ = cheerio.load(html);

  let title = '';
  let description = '';
  let price = '';
  let currency = 'USD';
  let brand = '';
  let category = '';
  const images = [];
  const features = [];

  // 1. Try Schema.org JSON-LD
  $('script[type="application/ld+json"]').each((_, elem) => {
    try {
      const text = $(elem).text();
      const data = JSON.parse(text);

      const items = Array.isArray(data) ? data : [data];
      for (const item of items) {
        const itemType = item['@type'];
        const isProduct =
          itemType === 'Product' ||
          (Array.isArray(itemType) && itemType.includes('Product'));

        if (isProduct) {
          if (item.name && !title) title = item.name;
          if (item.description && !description) description = item.description;
          if (item.brand) {
            brand = typeof item.brand === 'object' ? item.brand.name || '' : item.brand;
          }
          if (item.category && !category) category = item.category;

          // Images from JSON-LD
          if (item.image) {
            const imgList = Array.isArray(item.image) ? item.image : [item.image];
            imgList.forEach((img) => {
              const url = typeof img === 'object' ? img.url || img.contentUrl : img;
              if (url && typeof url === 'string') images.push(url);
            });
          }

          // Offers / Price
          if (item.offers) {
            const offer = Array.isArray(item.offers) ? item.offers[0] : item.offers;
            if (offer) {
              if (offer.price) price = String(offer.price);
              if (offer.priceCurrency) currency = offer.priceCurrency;
            }
          }
        }
      }
    } catch {
      // Ignore JSON parse errors in script tags
    }
  });

  // 2. OpenGraph Meta Tags
  if (!title) {
    title = $('meta[property="og:title"]').attr('content') || $('meta[name="twitter:title"]').attr('content') || '';
  }
  if (!description) {
    description =
      $('meta[property="og:description"]').attr('content') ||
      $('meta[name="twitter:description"]').attr('content') ||
      $('meta[name="description"]').attr('content') ||
      '';
  }

  const ogImage =
    $('meta[property="og:image:secure_url"]').attr('content') ||
    $('meta[property="og:image"]').attr('content') ||
    $('meta[name="twitter:image"]').attr('content');
  if (ogImage && !images.includes(ogImage)) {
    images.unshift(ogImage);
  }

  if (!price) {
    price =
      $('meta[property="product:price:amount"]').attr('content') ||
      $('meta[property="og:price:amount"]').attr('content') ||
      '';
  }
  if (!currency) {
    currency =
      $('meta[property="product:price:currency"]').attr('content') ||
      $('meta[property="og:price:currency"]').attr('content') ||
      'USD';
  }
  if (!brand) {
    brand = $('meta[property="product:brand"]').attr('content') || '';
  }

  // 3. Fallback to HTML Elements
  if (!title) {
    title =
      $('#productTitle').text().trim() ||
      $('.product-title').text().trim() ||
      $('h1').first().text().trim() ||
      $('title').text().trim();
  }

  // Extract features / bullet points from lists
  $('#feature-bullets li, .product-features li, ul.features li, .description ul li').each(
    (_, elem) => {
      const feat = $(elem).text().trim();
      if (feat && feat.length > 5 && feat.length < 200 && features.length < 6) {
        features.push(feat);
      }
    }
  );

  // If still no images, gather high-resolution img tags
  if (images.length === 0) {
    $('img').each((_, elem) => {
      const src = $(elem).attr('src') || $(elem).attr('data-src') || $(elem).attr('data-zoom-image');
      if (src && (src.startsWith('http://') || src.startsWith('https://'))) {
        // Exclude common tracking pixels, icons, logos
        if (
          !src.includes('logo') &&
          !src.includes('pixel') &&
          !src.includes('icon') &&
          !src.includes('badge') &&
          !src.includes('sprite') &&
          !src.endsWith('.svg')
        ) {
          images.push(src);
        }
      }
    });
  }

  // Clean title: remove storefront suffixes like " | Amazon.com", " - Etsy", etc.
  if (title) {
    title = title
      .replace(/\s*([|–—-])\s*(Amazon|Etsy|Walmart|Target|eBay|AliExpress).*$/i, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Deduplicate and resolve absolute image URLs
  const cleanImages = [...new Set(images)]
    .map((img) => {
      try {
        return new URL(img, safeUrl).toString();
      } catch {
        return null;
      }
    })
    .filter(Boolean)
    .slice(0, 10);

  const isPartial = !title || cleanImages.length === 0;

  return {
    success: true,
    title: title || 'Affiliate Product',
    description: description.slice(0, 1000) || '',
    price: price || '',
    currency: currency || 'USD',
    brand: brand || '',
    category: category || 'Lifestyle & Products',
    images: cleanImages,
    features: features.slice(0, 5),
    extractionStatus: isPartial ? 'partial' : 'completed',
  };
}
