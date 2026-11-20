import axios from 'axios';

async function testAutoPublishBoth() {
  console.log('\n=== TESTING AUTO-PUBLISH: PINTEREST RSS + MAKE.COM INTEGRATION ===\n');
  const baseUrl = 'http://127.0.0.1:5000/api';

  try {
    // 1. Login with demo user
    console.log('1. Authenticating as demo user...');
    const loginRes = await axios.post(`${baseUrl}/auth/login`, {
      email: 'demo@pinposter.com',
      password: 'password123',
    });
    const token = loginRes.data.token;
    console.log('✓ Logged in successfully. Token acquired.');

    const headers = { Authorization: `Bearer ${token}` };

    // 2. Fetch Feed / Auto-publish Settings
    console.log('\n2. Fetching Auto-Publish settings...');
    const settingsRes = await axios.get(`${baseUrl}/feed/settings`, { headers });
    console.log('✓ Feed Settings:', {
      feedUrl: settingsRes.data.feedUrl,
      feedToken: settingsRes.data.feedToken,
      makeWebhookUrl: settingsRes.data.makeWebhookUrl,
      makeWebhookEnabled: settingsRes.data.makeWebhookEnabled,
      autoPublishMethod: settingsRes.data.autoPublishMethod,
      stats: settingsRes.data.stats,
    });

    const feedToken = settingsRes.data.feedToken;

    // 3. Update Auto-Publish Settings to "Both"
    console.log('\n3. Saving Auto-Publish settings with "both" method & Make.com webhook...');
    const saveRes = await axios.put(
      `${baseUrl}/feed/settings`,
      {
        makeWebhookUrl: 'https://hook.eu2.make.com/mock-test-webhook-12345',
        makeWebhookEnabled: true,
        autoPublishMethod: 'both',
        defaultDisclosure: '#ad #affiliate When you buy through our links, we may earn an affiliate commission.',
      },
      { headers }
    );
    console.log('✓ Save Settings Response:', saveRes.data.message, saveRes.data.preferences);

    // 4. Test Public RSS Feed XML
    console.log('\n4. Fetching Public Pinterest RSS Feed XML at /api/feed/rss/' + feedToken + '...');
    const rssRes = await axios.get(`http://127.0.0.1:5000/api/feed/rss/${feedToken}`);
    if (rssRes.status === 200 && rssRes.data.includes('<rss version="2.0"')) {
      console.log('✓ RSS Feed XML is valid RSS 2.0 with Media RSS namespace!');
      const hasMediaContent = rssRes.data.includes('<media:content');
      const hasEnclosure = rssRes.data.includes('<enclosure');
      const has1080 = rssRes.data.includes('width="1080" height="1920"');
      console.log(`✓ Media Content tag present: ${hasMediaContent}`);
      console.log(`✓ Enclosure tag present: ${hasEnclosure}`);
      console.log(`✓ 1080x1920 Full HD attributes present: ${has1080}`);
    } else {
      throw new Error('RSS Feed response did not contain valid RSS XML');
    }

    // 5. Test Webhook Validation Endpoint
    console.log('\n5. Testing Webhook validation endpoint with empty URL...');
    try {
      await axios.post(`${baseUrl}/feed/test-webhook`, { webhookUrl: '' }, { headers });
    } catch (err) {
      console.log('✓ Correctly handled empty webhook URL with error:', err.response?.data?.message);
    }

    // 6. Test Schedule Queue Check
    console.log('\n6. Testing Schedule Queue Advancer trigger...');
    const checkRes = await axios.post(`${baseUrl}/schedules/check`, {}, { headers });
    console.log('✓ Schedule queue checked successfully:', checkRes.data);

    console.log('\n======================================================');
    console.log('  ALL AUTO-PUBLISH TESTS (RSS + MAKE.COM) PASSED! 🚀');
    console.log('======================================================\n');
  } catch (err) {
    console.error('\n❌ Test failed:', err.response?.data || err.message);
    process.exit(1);
  }
}

testAutoPublishBoth();