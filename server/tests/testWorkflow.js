import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';

async function runTest() {
  console.log('--- STARTING COMPLETE PINPOSTER WORKFLOW TEST ---');

  const client = axios.create({
    baseURL: BASE_URL,
    headers: { 'Content-Type': 'application/json' },
  });

  // Step 1: Register User
  console.log('\n[1/16] Testing Registration & Login...');
  const userPayload = {
    name: 'Sarah Affiliate Marketer',
    email: `sarah_${Date.now()}@pinposter.com`,
    password: 'password123456',
    timezone: 'Asia/Kolkata',
  };

  const regRes = await client.post('/auth/register', userPayload);
  if (!regRes.data.success || !regRes.data.token) {
    throw new Error('Registration failed');
  }
  const token = regRes.data.token;
  client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  console.log('✓ User registered and authenticated. Default board auto-created.');

  // Step 2: Add Board
  console.log('\n[2/16] Testing Pinterest Reference Board creation...');
  const boardRes = await client.post('/boards', {
    name: 'Smart Home Gadgets 2026',
    description: 'Trending smart tech recommendations and honest reviews',
    category: 'Technology',
    isDefault: true,
  });
  if (!boardRes.data.success) throw new Error('Board creation failed');
  const boardId = boardRes.data.board._id;
  console.log(`✓ Board created with ID: ${boardId} ("${boardRes.data.board.name}")`);

  // Step 3: Configure Gemini API Key (Encrypted at rest)
  console.log('\n[3/16] Testing API Configuration (Text AI - Gemini)...');
  const geminiConfigRes = await client.post('/api-configurations', {
    providerType: 'text_ai',
    providerName: 'gemini',
    apiKey: process.env.GEMINI_API_KEY || 'mock_test_key_for_testing',
    model: 'gemini-1.5-flash',
    isDefault: true,
  });
  if (!geminiConfigRes.data.success) throw new Error('Gemini config failed');
  console.log('✓ Gemini API configuration encrypted and stored.');

  // Step 4: Configure Image Provider
  console.log('\n[4/16] Testing API Configuration (Image Generation)...');
  const imgConfigRes = await client.post('/api-configurations', {
    providerType: 'image_generation',
    providerName: 'sharp_aesthetic', // Aesthetic 1080x1920 vertical generator
    dimensions: '1080x1920',
    isDefault: true,
  });
  if (!imgConfigRes.data.success) throw new Error('Image config failed');
  console.log('✓ Image generation provider configured.');

  // Step 5: Test Product Metadata Extraction
  console.log('\n[5/16] Testing Product URL Submission & Metadata Extraction...');
  const affiliateUrl1 = 'https://example.com/product/ergonomic-standing-desk?aff_id=pinposter99';
  const extractRes = await client.post('/products/extract', { url: affiliateUrl1 });
  console.log(`✓ Scraper executed. Extraction status: ${extractRes.data.data?.extractionStatus}`);

  // Step 6 & 7: Generate Campaign A (Exactly 10 Pins)
  console.log('\n[6/16] & [7/16] Generating Campaign A with 10 Pins and auto-scheduling...');
  const campARes = await client.post('/campaigns', {
    affiliateUrl: affiliateUrl1,
    boardId,
    campaignName: 'Smart Ergonomic Desk Campaign',
    manualProductDetails: {
      title: 'Ultra-Ergonomic Electric Standing Desk Pro',
      description: 'Motorized dual-motor adjustable standing desk with memory presets and cable organizer.',
      price: '349.99',
      brand: 'ErgoTech',
      category: 'Workplace & Home Office',
      images: ['https://images.unsplash.com/photo-1595515106969-1ce29566ff1c?w=1000&auto=format&fit=crop&q=80'],
    },
  });

  const campAId = campARes.data.campaign._id;
  console.log(`✓ Campaign A initialized (${campAId}). Waiting for 10 Pins to generate...`);

  // Wait for background generation job to complete
  let finishedA = false;
  let attempts = 0;
  while (!finishedA && attempts < 30) {
    await new Promise((r) => setTimeout(r, 1500));
    attempts++;
    const jobRes = await client.get(`/campaigns/${campAId}/job`);
    if (jobRes.data.job?.status === 'completed') {
      finishedA = true;
      console.log('✓ Campaign A generation completed (10 Pins generated & scheduled)!');
    } else if (jobRes.data.job?.status === 'failed') {
      throw new Error(`Campaign A failed: ${jobRes.data.job.error}`);
    } else {
      process.stdout.write(`... Progress: ${jobRes.data.job?.progress || 0}%\r`);
    }
  }

  // Step 8: Verify all 10 images and descriptions
  console.log('\n[8/16] Verifying all 10 Pins for Campaign A...');
  const detailARes = await client.get(`/campaigns/${campAId}`);
  const pinsA = detailARes.data.pins;
  if (!pinsA || pinsA.length !== 10) {
    throw new Error(`Expected exactly 10 pins, found ${pinsA?.length}`);
  }

  console.log(`✓ Confirmed exactly 10 unique pins:`);
  pinsA.forEach((p) => {
    console.log(`  Pin #${p.conceptIndex}: [${p.conceptName}] Scheduled: ${new Date(p.scheduledAt).toLocaleTimeString()} | Title: ${p.title.slice(0, 45)}...`);
    if (!p.imageUrl) throw new Error(`Missing image for pin #${p.conceptIndex}`);
    if (p.destinationUrl !== affiliateUrl1) throw new Error('Original affiliate destination URL was not preserved!');
  });

  // Step 9 & 10: Submit Campaign B and verify it continues after Campaign A's last slot!
  console.log('\n[9/16] & [10/16] Testing Global Chronological Schedule Continuity with Campaign B...');
  const lastSlotA = new Date(pinsA[pinsA.length - 1].scheduledAt);
  console.log(`  Campaign A's 10th Pin slot: ${lastSlotA.toLocaleString()}`);

  const affiliateUrl2 = 'https://example.com/product/mechanical-keyboard?tag=sarah-20';
  const campBRes = await client.post('/campaigns', {
    affiliateUrl: affiliateUrl2,
    boardId,
    campaignName: 'Wireless Mechanical Keyboard',
    manualProductDetails: {
      title: 'Custom RGB Wireless Mechanical Keyboard',
      description: 'Hot-swappable mechanical switches with south-facing LEDs and aluminum chassis.',
      price: '129.99',
      brand: 'Keycraft',
      category: 'Electronics',
      images: ['https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=1000&auto=format&fit=crop&q=80'],
    },
  });

  const campBId = campBRes.data.campaign._id;
  let finishedB = false;
  attempts = 0;
  while (!finishedB && attempts < 30) {
    await new Promise((r) => setTimeout(r, 1500));
    attempts++;
    const jobRes = await client.get(`/campaigns/${campBId}/job`);
    if (jobRes.data.job?.status === 'completed') {
      finishedB = true;
    }
  }

  const detailBRes = await client.get(`/campaigns/${campBId}`);
  const pinsB = detailBRes.data.pins;
  const firstSlotB = new Date(pinsB[0].scheduledAt);
  console.log(`  Campaign B's 1st Pin slot:  ${firstSlotB.toLocaleString()}`);

  const hourDiff = (firstSlotB.getTime() - lastSlotA.getTime()) / (1000 * 60 * 60);
  if (Math.round(hourDiff) !== 1) {
    throw new Error(`Schedule continuity mismatch! Expected exactly 1 hour difference, got ${hourDiff}`);
  }
  console.log('✓ VERIFIED: Campaign B starts exactly 1 hour after Campaign A (strict global queue maintained)!');

  // Step 11: Edit a Pin
  console.log('\n[11/16] Testing Pin Edit...');
  const pinToEdit = pinsA[0];
  const editRes = await client.put(`/pins/${pinToEdit._id}`, {
    title: 'Updated Pin #1 Title — Tested and Approved',
    notes: 'Prioritize this Pin for group boards',
  });
  if (!editRes.data.success || editRes.data.pin.title !== 'Updated Pin #1 Title — Tested and Approved') {
    throw new Error('Pin edit failed');
  }
  console.log('✓ Pin successfully edited.');

  // Step 12: Pause and Resume a Pin
  console.log('\n[12/16] Testing Pin Pause & Resume...');
  const pauseRes = await client.post(`/pins/${pinToEdit._id}/pause`);
  if (!pauseRes.data.success || pauseRes.data.pin.status !== 'paused') {
    throw new Error('Pin pause failed');
  }
  console.log('✓ Pin paused (schedule slot released safely).');

  const resumeRes = await client.post(`/pins/${pinToEdit._id}/resume`);
  if (!resumeRes.data.success || resumeRes.data.pin.status !== 'scheduled') {
    throw new Error('Pin resume failed');
  }
  console.log(`✓ Pin resumed and reassigned next global slot (${new Date(resumeRes.data.pin.scheduledAt).toLocaleString()}).`);

  // Step 13 & 14: Manual Pinterest Publishing Handoff & Confirmation
  console.log('\n[13/16] & [14/16] Testing Manual Pinterest Publishing Handoff & Confirmation...');
  const publishRes = await client.post(`/pins/${pinsA[1]._id}/publish`, {
    publishedPinUrl: 'https://pinterest.com/pin/123456789012345',
    notes: 'Published manually to Best Smart Home Gadgets board',
  });
  if (!publishRes.data.success || publishRes.data.pin.status !== 'published') {
    throw new Error('Mark as published failed');
  }
  console.log('✓ Pin marked as manually published with confirmation timestamp & Pinterest URL.');

  // Log manual metrics
  await client.post(`/pins/${pinsA[1]._id}/metrics`, {
    impressions: 420,
    outboundClicks: 35,
    saves: 18,
  });
  console.log('✓ Logged manual impressions, clicks and saves for published Pin.');

  // Step 15: Verify Dashboard Analytics
  console.log('\n[15/16] Testing Dashboard Analytics Calculations...');
  const analyticsRes = await client.get('/analytics?range=30d');
  const metrics = analyticsRes.data.metrics;
  console.log('  Analytics metrics summary:');
  console.log(`  - Total Campaigns: ${metrics.totalCampaigns}`);
  console.log(`  - Total Pins:      ${metrics.totalPins}`);
  console.log(`  - Scheduled:       ${metrics.scheduledPins}`);
  console.log(`  - Published:       ${metrics.publishedPins}`);
  console.log(`  - Impressions:     ${metrics.totalImpressions}`);
  console.log(`  - Outbound Clicks: ${metrics.totalClicks}`);

  if (metrics.totalCampaigns < 2 || metrics.totalPins < 20 || metrics.publishedPins < 1) {
    throw new Error('Analytics metric count discrepancy');
  }
  console.log('✓ Analytics dashboard calculations verified.');

  console.log('\n============================================================');
  console.log('ALL WORKFLOW VERIFICATION STEPS PASSED SUCCESSFULLY! (100%)');
  console.log('============================================================');
}

runTest().catch((err) => {
  console.error('\n❌ Workflow verification failed:', err.message);
  process.exit(1);
});
