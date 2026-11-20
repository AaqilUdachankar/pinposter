import axios from 'axios';
import Board from '../models/Board.js';

/**
 * Dispatches a due Pin to the user's Make.com Custom Webhook.
 * Formatted with 1080x1920 image URL, title, description, and raw affiliate link.
 */
export async function dispatchPinToMakeWebhook({ pin, user, baseUrl = '' }) {
  if (!user?.preferences?.makeWebhookUrl || !user?.preferences?.makeWebhookEnabled) {
    return { skipped: true, reason: 'Make.com webhook not enabled or configured' };
  }

  const webhookUrl = user.preferences.makeWebhookUrl.trim();
  if (!webhookUrl.startsWith('http://') && !webhookUrl.startsWith('https://')) {
    throw new Error('Invalid Make.com webhook URL');
  }

  // Resolve board details
  let boardName = 'General';
  if (pin.boardId) {
    const board = await Board.findById(pin.boardId);
    if (board) boardName = board.name;
  }

  // Resolve absolute image URL (Cloudinary or local static URL)
  let absoluteImgUrl = pin.imageUrl;
  if (absoluteImgUrl && !absoluteImgUrl.startsWith('http://') && !absoluteImgUrl.startsWith('https://')) {
    const hostPrefix = process.env.PUBLIC_BASE_URL || baseUrl || 'http://localhost:5000';
    absoluteImgUrl = `${hostPrefix}${absoluteImgUrl.startsWith('/') ? '' : '/'}${absoluteImgUrl}`;
  }

  const payload = {
    event: 'pin_ready_to_publish',
    pinId: pin._id.toString(),
    conceptIndex: pin.conceptIndex,
    conceptName: pin.conceptName,
    title: pin.title,
    description: pin.description,
    destinationUrl: pin.destinationUrl, // Raw preserved affiliate link
    imageUrl: absoluteImgUrl, // 1080x1920 image URL
    boardName,
    keywords: pin.keywords || [],
    scheduledAt: pin.scheduledAt ? new Date(pin.scheduledAt).toISOString() : new Date().toISOString(),
    publishedAt: new Date().toISOString(),
    disclosure:
      user.preferences?.includeDisclosure !== false
        ? (user.preferences?.defaultDisclosure || '#ad #affiliate')
        : '',
  };

  const response = await axios.post(webhookUrl, payload, {
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'PinPoster-AutoPublish-Worker/1.0',
    },
    timeout: 15000,
  });

  return {
    success: true,
    status: response.status,
    data: response.data,
  };
}

/**
 * Sends a live sample payload to Make.com so the scenario can detect the schema.
 */
export async function testMakeWebhookConnection(webhookUrl) {
  if (!webhookUrl || (!webhookUrl.startsWith('http://') && !webhookUrl.startsWith('https://'))) {
    throw new Error('Please enter a valid Make.com webhook URL starting with https://');
  }

  const samplePayload = {
    test: true,
    event: 'pinposter_test_webhook',
    message: 'PinPoster Make.com Integration Test Successful!',
    pinId: 'sample_pin_987654',
    conceptIndex: 1,
    conceptName: 'Product Hero Showcase',
    title: 'Minimalist Ergonomic Workspace — 2026 Inspo',
    description: 'Transform your daily productivity with clean modern aesthetics and ergonomic comfort. Tap to view details! #ad #affiliate When you buy through our links, we may earn an affiliate commission.',
    destinationUrl: 'https://www.amazon.com/dp/B08XYZ1234?tag=affiliate-pinposter-20',
    imageUrl: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=1080&h=1920&fit=crop',
    boardName: 'Home & Office Aesthetics',
    keywords: ['workspace aesthetic', 'desk setup', 'home office ideas 2026'],
    scheduledAt: new Date().toISOString(),
  };

  const response = await axios.post(webhookUrl.trim(), samplePayload, {
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'PinPoster-Test-Client/1.0',
    },
    timeout: 12000,
  });

  if (response.status >= 200 && response.status < 300) {
    return {
      success: true,
      message: 'Test payload received by Make.com successfully! (HTTP ' + response.status + ')',
    };
  }

  throw new Error(`Make.com returned unexpected status: ${response.status}`);
}
