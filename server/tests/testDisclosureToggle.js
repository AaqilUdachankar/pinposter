import axios from 'axios';

async function testDisclosureToggle() {
  console.log('\n--- TESTING AFFILIATE DISCLOSURE ON/OFF TOGGLE ---\n');
  const baseUrl = 'http://127.0.0.1:5000/api';

  // 1. Authenticate
  const loginRes = await axios.post(`${baseUrl}/auth/login`, {
    email: 'demo@pinposter.com',
    password: 'password123',
  });
  const token = loginRes.data.token;
  const headers = { Authorization: `Bearer ${token}` };

  // 2. Fetch initial settings
  const initRes = await axios.get(`${baseUrl}/feed/settings`, { headers });
  console.log('1. Initial includeDisclosure:', initRes.data.includeDisclosure);

  // 3. Toggle OFF
  console.log('\n2. Toggling disclosure OFF (includeDisclosure: false)...');
  const offRes = await axios.put(
    `${baseUrl}/feed/settings`,
    { includeDisclosure: false },
    { headers }
  );
  console.log('✓ Response preferences:', offRes.data.preferences);

  // 4. Verify OFF in settings
  const verifyOffRes = await axios.get(`${baseUrl}/feed/settings`, { headers });
  console.log('✓ Verified settings includeDisclosure:', verifyOffRes.data.includeDisclosure);
  if (verifyOffRes.data.includeDisclosure !== false) {
    throw new Error('Expected includeDisclosure to be false');
  }

  // 5. Toggle ON
  console.log('\n3. Toggling disclosure ON (includeDisclosure: true)...');
  const onRes = await axios.put(
    `${baseUrl}/feed/settings`,
    { includeDisclosure: true },
    { headers }
  );
  console.log('✓ Response preferences:', onRes.data.preferences);

  // 6. Verify ON in settings
  const verifyOnRes = await axios.get(`${baseUrl}/feed/settings`, { headers });
  console.log('✓ Verified settings includeDisclosure:', verifyOnRes.data.includeDisclosure);
  if (verifyOnRes.data.includeDisclosure !== true) {
    throw new Error('Expected includeDisclosure to be true');
  }

  console.log('\n🎉 ALL DISCLOSURE ON/OFF TOGGLE TESTS PASSED!\n');
}

testDisclosureToggle().catch(err => {
  console.error('Test error:', err.response?.data || err.message);
  process.exit(1);
});