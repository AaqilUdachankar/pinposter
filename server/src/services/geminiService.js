import axios from 'axios';
import ApiConfiguration from '../models/ApiConfiguration.js';
import { decrypt } from './cryptoService.js';

export const PIN_CONCEPTS = [
  { index: 1, name: 'Product Hero Showcase', angle: 'Clean, bold centerpiece highlight focusing on aesthetic desirability and premium feel.' },
  { index: 2, name: 'Benefits & Value Focus', angle: 'Highlighting the core life improvement, time-saving, or health/wellness benefit.' },
  { index: 3, name: 'Problem & Solution', angle: 'Directly addressing an annoying pain point and presenting this product as the easy fix.' },
  { index: 4, name: 'Features & Specs Spotlight', angle: 'Infographic/checklist style displaying 3 key high-value specifications or capabilities.' },
  { index: 5, name: 'Aesthetic Lifestyle Scene', angle: 'Visualizing the product in a real, curated, aspirational home or daily routine environment.' },
  { index: 6, name: 'Comparison & Upgrade', angle: 'Why this product outperforms outdated alternatives or common substitutes.' },
  { index: 7, name: 'Gift Guide Recommendation', angle: 'Positioned as the ideal, thoughtful present for friends, family, or personal reward.' },
  { index: 8, name: 'Minimalist Modern Showcase', angle: 'Sleek, clutter-free visual focusing purely on craftsmanship, texture, and elegance.' },
  { index: 9, name: 'Everyday Use-Case Routine', angle: 'Step-by-step or situational context showcasing how effortlessly it fits into daily life.' },
  { index: 10, name: 'High-Energy Promotional Callout', angle: 'Urgent, exciting showcase highlighting popularity, high ratings, and why it is trending.' },
];

/**
 * Retrieves the user's active Gemini API key from database or fallback env.
 */
export async function getGeminiConfig(userId) {
  let config = await ApiConfiguration.findOne({
    userId,
    providerType: 'text_ai',
    providerName: 'gemini',
    isEnabled: true,
  });

  if (!config) {
    // Try any active text_ai configuration
    config = await ApiConfiguration.findOne({
      userId,
      providerType: 'text_ai',
      isEnabled: true,
    });
  }

  let apiKey = '';
  let model = 'gemini-1.5-flash';
  let endpoint = '';

  if (config && config.encryptedApiKey) {
    try {
      apiKey = decrypt(config.encryptedApiKey);
      model = config.model || 'gemini-1.5-flash';
      endpoint = config.endpoint;
    } catch (e) {
      console.error('Failed to decrypt Gemini key from DB:', e.message);
    }
  }

  // Fallback to process.env if not saved in user DB
  if (!apiKey && process.env.GEMINI_API_KEY) {
    apiKey = process.env.GEMINI_API_KEY;
  }

  return { apiKey, model, endpoint, configId: config?._id };
}

/**
 * Tests connection to Gemini API.
 */
export async function testGeminiConnection(apiKey, model = 'gemini-1.5-flash', endpoint = '') {
  if (!apiKey) {
    throw new Error('API key is required');
  }

  const url = endpoint
    ? endpoint
    : `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const response = await axios.post(
    url,
    {
      contents: [
        {
          parts: [{ text: 'Respond with the single word: "CONNECTED"' }],
        },
      ],
      generationConfig: {
        maxOutputTokens: 20,
      },
    },
    {
      timeout: 10000,
      headers: { 'Content-Type': 'application/json' },
    }
  );

  const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  if (!text.toLowerCase().includes('connected')) {
    throw new Error('Unexpected response format from Gemini endpoint');
  }

  return { success: true, message: 'Gemini API verified successfully' };
}

/**
 * Generates 10 Pinterest Pin concepts with SEO titles, descriptions, tags, and image prompts.
 */
export async function generate10PinConcepts({ product, user, userId }) {
  const { apiKey, model, endpoint } = await getGeminiConfig(userId);

  const includeDisclosure = user?.preferences?.includeDisclosure !== false;
  const disclosure = includeDisclosure
    ? (user?.preferences?.defaultDisclosure ||
      '#ad #affiliate When you buy through our links, we may earn an affiliate commission.')
    : '';

  // If Gemini API is not configured or fails, we provide high-quality rule-based creative generation
  // so the user is never stuck and gets 10 beautifully tailored Pins!
  if (!apiKey) {
    console.log('No Gemini API key configured. Utilizing built-in high-converting Pinterest creative engine.');
    return generateFallbackConcepts(product, disclosure);
  }

  try {
    const prompt = `You are a world-class Pinterest Affiliate Marketing Specialist and Pinterest SEO Expert.
Generate exactly 10 distinct, click-worthy, high-converting Pinterest Pins for this product:

PRODUCT DETAILS:
- Title: ${product.title}
- Description: ${product.description || 'Quality product in high demand'}
- Price: ${product.price ? `${product.currency || '$'}${product.price}` : 'Great value'}
- Brand: ${product.brand || 'Premium Brand'}
- Category: ${product.category || 'Lifestyle & Shopping'}
- Key Features: ${product.features?.join(', ') || 'Durable, stylish, highly functional'}
${disclosure ? `- Required Disclosure to include in descriptions: "${disclosure}"` : '- Do not append any affiliate disclosure statements'}

STRICT REQUIREMENTS FOR THE 10 PINS:
You must generate EXACTLY 10 different Pins matching these 10 specific visual concepts:
1. Product Hero Showcase (Clean, high-end presentation)
2. Benefits & Value Focus (Emotional and practical life upgrade)
3. Problem & Solution (Overcoming a specific pain point)
4. Features & Specs Spotlight (Key features, dimensions, or perks)
5. Aesthetic Lifestyle Scene (In-use in a stylish home/setting)
6. Comparison & Upgrade (Why it's better than standard alternatives)
7. Gift Guide Recommendation (Why it makes the perfect gift)
8. Minimalist Modern Showcase (Sleek, elegant, refined)
9. Everyday Use-Case Routine (How to use it daily)
10. High-Energy Promotional Callout (Trending, buzz-worthy, best find)

EACH PIN MUST CONTAIN:
- conceptIndex: Integer 1 to 10
- conceptName: Concept name from above list
- title: 60-90 characters. SEO rich, captivating, no fluff.
- description: 200-350 characters. Compelling copy ending with the affiliate disclosure and a call to action like "Tap link to shop now!"
- keywords: Array of 6-8 specific Pinterest search terms (e.g. ["gift ideas", "home aesthetic", "best gadgets 2026"])
- overlayTitle: Short, punchy text overlay for the image (3-6 words, uppercase e.g. "THE ULTIMATE DESK UPGRADE")
- overlaySubtitle: Secondary hook (4-8 words e.g. "Why Everyone Is Obsessed With This")
- imagePrompt: Detailed visual prompt for an authentic Pinterest aesthetic lifestyle photograph of the product in a real-world setting (e.g. cozy morning sunlight, warm linen, aesthetic interior setting). MUST NOT look like an advertisement. Absolutely NO text, words, banners, badges, marketing stickers, or graphics. Pure candid lifestyle photograph.
- visualStyle: One of ["editorial", "modern_minimal", "warm_lifestyle", "organic_neutral", "cozy_interior"]

RESPOND STRICTLY WITH A JSON ARRAY OF 10 OBJECTS ONLY. NO MARKDOWN TICKS, NO PREAMBLE.`;

    const url = endpoint
      ? endpoint
      : `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const response = await axios.post(
      url,
      {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 6000,
          responseMimeType: 'application/json',
        },
      },
      {
        timeout: 45000,
        headers: { 'Content-Type': 'application/json' },
      }
    );

    let rawText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    rawText = rawText.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();

    const parsed = JSON.parse(rawText);
    if (Array.isArray(parsed) && parsed.length >= 10) {
      return parsed.slice(0, 10).map((p, idx) => ({
        ...p,
        conceptIndex: idx + 1,
        conceptName: PIN_CONCEPTS[idx].name,
      }));
    }

    throw new Error('Gemini did not return 10 items');
  } catch (err) {
    console.warn(`Gemini generation encountered error (${err.message}). Falling back to creative algorithm.`);
    return generateFallbackConcepts(product, disclosure);
  }
}

/**
 * Built-in high-converting Pinterest creative engine fallback.
 * Generates 10 distinct, customized, SEO-optimized concepts without external API failure.
 */
export function generateFallbackConcepts(product, disclosure = '') {
  const brandOrProduct = product.brand || product.title.split(' ')[0] || 'Must-Have';
  const cleanTitle = product.title.slice(0, 55);

  return PIN_CONCEPTS.map((concept, idx) => {
    const index = idx + 1;
    let title = '';
    let description = '';
    let overlayTitle = '';
    let overlaySubtitle = '';
    let visualStyle = 'editorial';
    const keywords = [
      product.category?.toLowerCase() || 'lifestyle',
      `${brandOrProduct.toLowerCase()} review`,
      'pinterest finds',
      'amazon favorites',
      'must have products',
      'gift ideas 2026',
      'aesthetic vibes',
    ];

    switch (index) {
      case 1:
        title = `The Ultimate ${cleanTitle} — Best Choice for 2026`;
        description = `Looking for the perfect ${product.title}? Here is everything you need to know about why this is currently trending on Pinterest. Click through to view details and check current pricing! ${disclosure}`;
        overlayTitle = 'THE ULTIMATE FIND';
        overlaySubtitle = 'Why everyone is talking about this product';
        visualStyle = 'editorial';
        break;
      case 2:
        title = `Why You Need The ${cleanTitle} Right Now`;
        description = `Upgrade your daily routine with ${product.title}. Premium quality, thoughtful design, and unbeatable convenience. Tap to see full specs and availability. ${disclosure}`;
        overlayTitle = 'TOTAL GAME CHANGER';
        overlaySubtitle = 'The easiest upgrade for your daily routine';
        visualStyle = 'modern_minimal';
        break;
      case 3:
        title = `Stop Wasting Time: The Smart Solution for ${product.category || 'Everyday Needs'}`;
        description = `Frustrated with standard alternatives? ${product.title} solves the biggest everyday headaches effortlessly. See real photos and get yours today. ${disclosure}`;
        overlayTitle = 'PROBLEM SOLVED';
        overlaySubtitle = 'The smart solution you have been waiting for';
        visualStyle = 'infographic_bold';
        break;
      case 4:
        title = `Key Features Breakdown: ${cleanTitle} Full Review`;
        description = `Discover why the ${product.title} stands out: exceptional durability, thoughtful ergonomics, and sleek modern styling. Read the complete breakdown! ${disclosure}`;
        overlayTitle = '5 REASONS TO LOVE IT';
        overlaySubtitle = 'A closer look at the best features';
        visualStyle = 'infographic_bold';
        break;
      case 5:
        title = `Aesthetic Inspo: How to Style & Use ${cleanTitle}`;
        description = `Elevate your space with this gorgeous ${product.title}. Perfect blend of form and functionality for any modern aesthetic. Tap to shop the look! ${disclosure}`;
        overlayTitle = 'AESTHETIC ESSENTIAL';
        overlaySubtitle = 'Elevate your space with this must-have';
        visualStyle = 'warm_lifestyle';
        break;
      case 6:
        title = `Is It Worth It? ${cleanTitle} Honest Verdict`;
        description = `We analyzed the ${product.title} to see if it lives up to the hype. The verdict: an absolute must-have! Tap through for full details and discounts. ${disclosure}`;
        overlayTitle = 'HONEST REVIEW';
        overlaySubtitle = 'Does it actually live up to the hype?';
        visualStyle = 'editorial';
        break;
      case 7:
        title = `The Perfect Gift Idea: ${cleanTitle} They Will Love`;
        description = `Stuck on gift ideas? The ${product.title} is thoughtful, stylish, and guaranteed to impress anyone on your list. Save this pin or tap to grab one! ${disclosure}`;
        overlayTitle = 'BEST GIFT IDEA';
        overlaySubtitle = 'Guaranteed to impress anyone on your list';
        visualStyle = 'warm_lifestyle';
        break;
      case 8:
        title = `Minimalist & Functional: The New ${cleanTitle}`;
        description = `Simplicity meets performance. Discover how the ${product.title} brings effortless elegance to your collection. Click to shop now! ${disclosure}`;
        overlayTitle = 'SLEEK & REFINED';
        overlaySubtitle = 'Pure minimalism with zero compromises';
        visualStyle = 'modern_minimal';
        break;
      case 9:
        title = `Daily Routine Upgrade: Why We Love The ${cleanTitle}`;
        description = `Transform how you work and relax with the ${product.title}. Easy to use, beautifully built, and designed to last. Check out the latest offers today! ${disclosure}`;
        overlayTitle = 'DAILY ESSENTIAL';
        overlaySubtitle = 'Transform how you experience everyday moments';
        visualStyle = 'warm_lifestyle';
        break;
      case 10:
      default:
        title = `Trending Alert: Don't Miss Out on The ${cleanTitle}`;
        description = `This ${product.title} is going viral for good reason! Premium design, glowing feedback, and exceptional value. Tap through to view current availability before it sells out! ${disclosure}`;
        overlayTitle = 'TRENDING NOW';
        overlaySubtitle = 'Top rated find of the season — tap to shop';
        visualStyle = 'vibrant_studio';
        break;
    }

    return {
      conceptIndex: index,
      conceptName: concept.name,
      title: title.slice(0, 100),
      description: description.slice(0, 800),
      keywords,
      overlayTitle,
      overlaySubtitle,
      visualStyle,
      imagePrompt: `Authentic Pinterest lifestyle photography of ${cleanTitle}. ${concept.angle} Warm natural ambient daylight, cozy real-life setting, organic textures, 35mm film aesthetic, candid editorial photography. Pure authentic photo, absolutely no text, no banners, no ads.`,
    };
  });
}
