import crypto from 'crypto';
import User from '../models/User.js';
import Pin from '../models/Pin.js';
import Board from '../models/Board.js';
import { dispatchPinToMakeWebhook, testMakeWebhookConnection } from '../services/webhookService.js';

function escapeXml(unsafe) {
  if (!unsafe || typeof unsafe !== 'string') return '';
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Public RSS 2.0 / Media-RSS feed consumed directly by Pinterest's
 * official "Auto-publish from RSS feed" feature.
 * No authentication header required so Pinterest's crawler can fetch it seamlessly.
 */
export async function getPublicRssFeed(req, res, next) {
  try {
    const { feedToken } = req.params;
    const { boardId } = req.query;

    if (!feedToken) {
      return res.status(400).send('Feed token is required');
    }

    const user = await User.findOne({ feedToken });
    if (!user) {
      return res.status(404).send('Feed not found. Invalid or expired token.');
    }

    // Filter query: fetch user pins. If boardId specified, filter by board.
    const query = { userId: user._id };
    if (boardId) {
      query.boardId = boardId;
    }

    // Include scheduled, ready_to_publish, and queued pins (or all non-cancelled)
    query.status = { $in: ['scheduled', 'ready_to_publish', 'published', 'queued'] };

    const pins = await Pin.find(query)
      .sort({ scheduledAt: 1, createdAt: -1 })
      .limit(100)
      .populate('boardId', 'name category')
      .populate('productId', 'title price currency');

    // Resolve base URL for local images if not on Cloudinary
    const host = req.get('host');
    const protocol = req.protocol;
    const baseUrl = process.env.PUBLIC_BASE_URL || `${protocol}://${host}`;

    const feedUrl = `${baseUrl}/api/feed/rss/${feedToken}`;
    const nowRfc = new Date().toUTCString();

    // Construct valid, compliant RSS 2.0 with Media RSS extensions
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
     xmlns:content="http://purl.org/rss/1.0/modules/content/"
     xmlns:media="http://search.yahoo.com/mrss/"
     xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>PinPoster Automated Pinterest Campaign Feed</title>
    <link>${escapeXml(baseUrl)}</link>
    <description>Automatically scheduled 1080x1920 Pinterest Pin campaign feed</description>
    <language>en-us</language>
    <lastBuildDate>${nowRfc}</lastBuildDate>
    <atom:link href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml" />
`;

    for (const pin of pins) {
      // Resolve full absolute image URL
      let absoluteImgUrl = pin.imageUrl;
      if (absoluteImgUrl && !absoluteImgUrl.startsWith('http://') && !absoluteImgUrl.startsWith('https://')) {
        absoluteImgUrl = `${baseUrl}${absoluteImgUrl.startsWith('/') ? '' : '/'}${absoluteImgUrl}`;
      }

      // If scheduled in the future or past, format to RFC 2822
      const pinDate = pin.scheduledAt ? new Date(pin.scheduledAt).toUTCString() : nowRfc;
      const boardCategory = pin.boardId?.category || 'Lifestyle';
      const boardName = pin.boardId?.name || 'General';

      xml += `
    <item>
      <title><![CDATA[${pin.title}]]></title>
      <link><![CDATA[${pin.destinationUrl}]]></link>
      <guid isPermaLink="false">pinposter_${pin._id}</guid>
      <pubDate>${pinDate}</pubDate>
      <description><![CDATA[${pin.description}]]></description>
      <content:encoded><![CDATA[${pin.description}]]></content:encoded>
      <category><![CDATA[${boardCategory}]]></category>
      <enclosure url="${escapeXml(absoluteImgUrl)}" type="image/jpeg" length="1048576" />
      <media:content url="${escapeXml(absoluteImgUrl)}" medium="image" type="image/jpeg" width="1080" height="1920">
        <media:title><![CDATA[${pin.title}]]></media:title>
        <media:description><![CDATA[${pin.description}]]></media:description>
      </media:content>
    </item>`;
    }

    xml += `
  </channel>
</rss>`;

    res.set('Content-Type', 'application/xml; charset=utf-8');
    res.set('Cache-Control', 'public, max-age=300'); // Cache for 5 minutes
    return res.status(200).send(xml);
  } catch (err) {
    next(err);
  }
}

/**
 * Returns authenticated user's RSS feed credentials and status.
 */
export async function getFeedSettings(req, res, next) {
  try {
    let user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // If user has no feedToken, generate one on the fly
    if (!user.feedToken) {
      user.feedToken = crypto.randomBytes(16).toString('hex');
      await user.save();
    }

    const host = req.get('host');
    const protocol = req.protocol;
    const baseUrl = process.env.PUBLIC_BASE_URL || `${protocol}://${host}`;
    const feedUrl = `${baseUrl}/api/feed/rss/${user.feedToken}`;

    const totalPins = await Pin.countDocuments({ userId: req.userId });
    const scheduledPins = await Pin.countDocuments({
      userId: req.userId,
      status: { $in: ['scheduled', 'ready_to_publish'] },
    });
    const publishedPins = await Pin.countDocuments({ userId: req.userId, status: 'published' });

    res.json({
      success: true,
      feedToken: user.feedToken,
      feedUrl,
      makeWebhookUrl: user.preferences?.makeWebhookUrl || '',
      makeWebhookEnabled: user.preferences?.makeWebhookEnabled || false,
      autoPublishMethod: user.preferences?.autoPublishMethod || 'rss',
      includeDisclosure: user.preferences?.includeDisclosure !== false,
      defaultDisclosure: user.preferences?.defaultDisclosure || '#ad #affiliate When you buy through our links, we may earn an affiliate commission.',
      stats: {
        totalPins,
        scheduledPins,
        publishedPins,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Regenerates a user's RSS feed token for security.
 */
export async function regenerateFeedToken(req, res, next) {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.feedToken = crypto.randomBytes(16).toString('hex');
    await user.save();

    const host = req.get('host');
    const protocol = req.protocol;
    const baseUrl = process.env.PUBLIC_BASE_URL || `${protocol}://${host}`;
    const feedUrl = `${baseUrl}/api/feed/rss/${user.feedToken}`;

    res.json({
      success: true,
      message: 'RSS feed token regenerated successfully.',
      feedToken: user.feedToken,
      feedUrl,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Saves auto-publish preferences (Make.com webhook, toggle, and autoPublishMethod).
 */
export async function saveAutoPublishSettings(req, res, next) {
  try {
    const { makeWebhookUrl, makeWebhookEnabled, autoPublishMethod, defaultDisclosure, includeDisclosure } = req.body;
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (!user.preferences) user.preferences = {};

    if (makeWebhookUrl !== undefined) {
      user.preferences.makeWebhookUrl = makeWebhookUrl.trim();
    }
    if (makeWebhookEnabled !== undefined) {
      user.preferences.makeWebhookEnabled = Boolean(makeWebhookEnabled);
    }
    if (autoPublishMethod !== undefined) {
      user.preferences.autoPublishMethod = autoPublishMethod;
    }
    if (defaultDisclosure !== undefined) {
      user.preferences.defaultDisclosure = defaultDisclosure.trim();
    }
    if (includeDisclosure !== undefined) {
      user.preferences.includeDisclosure = Boolean(includeDisclosure);
    }

    await user.save();

    res.json({
      success: true,
      message: 'Auto-publish settings saved successfully!',
      preferences: {
        makeWebhookUrl: user.preferences.makeWebhookUrl,
        makeWebhookEnabled: user.preferences.makeWebhookEnabled,
        autoPublishMethod: user.preferences.autoPublishMethod,
        defaultDisclosure: user.preferences.defaultDisclosure,
        includeDisclosure: user.preferences.includeDisclosure,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Tests connection to Make.com webhook with a live test payload.
 */
export async function testMakeWebhook(req, res, next) {
  try {
    const { webhookUrl } = req.body;
    let targetUrl = webhookUrl?.trim();

    if (!targetUrl) {
      const user = await User.findById(req.userId);
      targetUrl = user?.preferences?.makeWebhookUrl?.trim();
    }

    if (!targetUrl) {
      return res.status(400).json({
        success: false,
        message: 'No Make.com Webhook URL provided. Please enter a valid URL.',
      });
    }

    const result = await testMakeWebhookConnection(targetUrl);
    res.json({
      success: true,
      message: result.message || 'Make.com webhook test succeeded!',
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message || 'Failed to connect to Make.com webhook',
    });
  }
}

/**
 * Manually dispatches an individual Pin to Make.com on demand.
 */
export async function dispatchSinglePinToMake(req, res, next) {
  try {
    const { pinId } = req.params;
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const pin = await Pin.findOne({ _id: pinId, userId: req.userId });
    if (!pin) return res.status(404).json({ success: false, message: 'Pin not found' });

    if (!user.preferences?.makeWebhookUrl) {
      return res.status(400).json({
        success: false,
        message: 'Make.com webhook URL is not configured. Please configure it in Auto-Publish settings.',
      });
    }

    const host = req.get('host');
    const protocol = req.protocol;
    const baseUrl = process.env.PUBLIC_BASE_URL || `${protocol}://${host}`;

    const result = await dispatchPinToMakeWebhook({ pin, user, baseUrl });
    if (result.success) {
      pin.status = 'published';
      pin.publishedAt = new Date();
      await pin.save();

      return res.json({
        success: true,
        message: `Pin #${pin.conceptIndex} ("${pin.title}") dispatched to Make.com successfully!`,
        pin,
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to send Pin to Make.com webhook',
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message || 'Failed to dispatch Pin to Make.com',
    });
  }
}
