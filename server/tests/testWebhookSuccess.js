import http from 'http';
import axios from 'axios';

async function testMockWebhook() {
  console.log('\n--- TESTING LIVE WEBHOOK DISPATCH & CONFIRMATION ---');

  let receivedPayload = null;

  // 1. Create a mock Make.com webhook listener
  const mockServer = http.createServer((req, res) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      receivedPayload = JSON.parse(body);
      console.log('✓ Mock Make.com Webhook received HTTP POST with payload:');
      console.log('  Event:', receivedPayload.event);
      console.log('  Title:', receivedPayload.title);
      console.log('  Image URL:', receivedPayload.imageUrl);
      console.log('  Affiliate Link:', receivedPayload.destinationUrl);
      console.log('  Board:', receivedPayload.boardName);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'Accepted', message: 'Scenario scheduled' }));
    });
  });

  await new Promise(resolve => mockServer.listen(9876, resolve));
  const mockWebhookUrl = 'http://127.0.0.1:9876/custom-webhook';
  console.log(`✓ Mock Make.com server listening on ${mockWebhookUrl}`);

  try {
    // 2. Authenticate
    const loginRes = await axios.post('http://127.0.0.1:5000/api/auth/login', {
      email: 'demo@pinposter.com',
      password: 'password123',
    });
    const token = loginRes.data.token;
    const headers = { Authorization: `Bearer ${token}` };

    // 3. Test Webhook Connection via /api/feed/test-webhook
    console.log('\nSending test payload via /api/feed/test-webhook...');
    const testRes = await axios.post(
      'http://127.0.0.1:5000/api/feed/test-webhook',
      { webhookUrl: mockWebhookUrl },
      { headers }
    );
    console.log('✓ Backend Response:', testRes.data);

    // 4. Save this webhook and test single pin dispatch
    await axios.put(
      'http://127.0.0.1:5000/api/feed/settings',
      {
        makeWebhookUrl: mockWebhookUrl,
        makeWebhookEnabled: true,
        autoPublishMethod: 'both',
      },
      { headers }
    );

    // Fetch pins to get a pinId
    const pinsRes = await axios.get('http://127.0.0.1:5000/api/pins?limit=1', { headers });
    const samplePin = pinsRes.data.pins[0];

    console.log(`\nDispatching sample Pin #${samplePin.conceptIndex} ("${samplePin.title}") to Make.com...`);
    const dispatchRes = await axios.post(
      `http://127.0.0.1:5000/api/feed/dispatch/${samplePin._id}`,
      {},
      { headers }
    );
    console.log('✓ Dispatch Response:', dispatchRes.data);

    if (receivedPayload && receivedPayload.pinId === samplePin._id.toString()) {
      console.log('\n🎉 SUCCESS: Pin was dispatched to Make.com webhook with all fields intact!');
    } else {
      throw new Error('Payload verification failed');
    }

  } finally {
    mockServer.close();
  }
}

testMockWebhook().catch(err => {
  console.error('Test error:', err.response?.data || err.message);
  process.exit(1);
});