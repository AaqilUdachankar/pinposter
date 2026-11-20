import User from '../models/User.js';
import Board from '../models/Board.js';
import Product from '../models/Product.js';
import Campaign from '../models/Campaign.js';
import Pin from '../models/Pin.js';
import ScheduleSlot from '../models/ScheduleSlot.js';
import Notification from '../models/Notification.js';
import ActivityLog from '../models/ActivityLog.js';
import { PIN_CONCEPTS } from '../services/geminiService.js';
import { generateAestheticPinterestPhoto } from '../services/imageService.js';
import { uploadImage } from '../services/cloudinaryService.js';
import { getNextUpcomingHour } from '../services/schedulerService.js';

export async function seedDemoData() {
  // CRITICAL: Demo data seeding is strictly prohibited in production
  if (process.env.NODE_ENV === 'production') {
    return;
  }

  try {
    const demoEmail = 'demo@pinposter.com';
    let user = await User.findOne({ email: demoEmail });

    if (!user) {
      console.log('Seeding demo account...');
      user = await User.create({
        name: 'Alex Demo Marketer',
        email: demoEmail,
        password: 'password123',
        role: 'admin',
        timezone: 'Asia/Kolkata',
        preferences: {
          defaultDisclosure: '#ad #affiliate When you buy through our links, we may earn an affiliate commission.',
          theme: 'light',
          emailNotifications: false,
        },
      });
      console.log('✓ Demo account created successfully.');
    }

    // Check boards
    let defaultBoard = await Board.findOne({ userId: user._id, isDefault: true });
    if (!defaultBoard) {
      defaultBoard = await Board.create({
        userId: user._id,
        name: 'Smart Tech & Home Gadgets',
        description: 'Trending technology recommendations, smart office setups, and gadget reviews.',
        category: 'Technology',
        isDefault: true,
      });

      await Board.create({
        userId: user._id,
        name: 'Aesthetic Home & Office Inspo',
        description: 'Curated modern decor, clean desk setups, and aesthetic lifestyle inspiration.',
        category: 'Home & Living',
        isDefault: false,
      });

      await Board.create({
        userId: user._id,
        name: 'Best Gift Ideas 2026',
        description: 'Top-rated gift recommendations for friends, family, and holidays.',
        category: 'Gifts & Shopping',
        isDefault: false,
      });
      console.log('✓ Demo Pinterest reference boards created.');
    }

    // Check if demo campaign already exists
    const existingCampaign = await Campaign.findOne({ userId: user._id });
    if (!existingCampaign) {
      console.log('Seeding demo campaign with 10 Pins and hourly schedule slots...');
      const affiliateUrl = 'https://www.amazon.com/dp/B08XYZ1234?tag=affiliate-pinposter-20';

      const product = await Product.create({
        userId: user._id,
        originalAffiliateUrl: affiliateUrl,
        title: 'Ultra-Ergonomic Electric Standing Desk Pro',
        description: 'Motorized dual-motor adjustable standing desk with memory presets, anti-collision sensor, and cable organizer.',
        price: '349.99',
        currency: 'USD',
        brand: 'ErgoTech Pro',
        category: 'Office & Tech',
        features: [
          'Dual electric motors with smooth height adjustment',
          '4 programmable digital memory presets',
          'Heavy-duty steel frame supports up to 260 lbs',
          'Built-in wire management tray and headphone hook',
        ],
        images: [
          'https://images.unsplash.com/photo-1595515106969-1ce29566ff1c?w=1000&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=1000&auto=format&fit=crop&q=80',
        ],
        extractionStatus: 'completed',
      });

      const campaign = await Campaign.create({
        userId: user._id,
        productId: product._id,
        boardId: defaultBoard._id,
        name: 'Smart Ergonomic Desk Campaign',
        status: 'scheduled',
        generationStatus: 'completed',
        totalPins: 10,
        scheduledPinsCount: 9,
        publishedPinsCount: 1,
        completedAt: new Date(),
      });

      let slotTime = getNextUpcomingHour();
      const disclosure = user.preferences.defaultDisclosure;

      for (let i = 0; i < 10; i++) {
        const concept = PIN_CONCEPTS[i];
        const pinIndex = i + 1;

        // Generate clean aesthetic Pinterest photo
        const buffer = await generateAestheticPinterestPhoto({
          conceptIndex: pinIndex,
          conceptName: concept.name,
          title: `The Ultimate ${product.title} — 2026 Review`,
          product,
        });

        const upload = await uploadImage({
          buffer,
          filename: `demo-pin-${pinIndex}.jpg`,
          userId: user._id,
        });

        const isFirst = pinIndex === 1;
        const isSecond = pinIndex === 2;

        const pinStatus = isFirst ? 'published' : isSecond ? 'ready_to_publish' : 'scheduled';

        const pin = await Pin.create({
          userId: user._id,
          productId: product._id,
          campaignId: campaign._id,
          boardId: defaultBoard._id,
          conceptIndex: pinIndex,
          conceptName: concept.name,
          imageUrl: upload.url,
          localImagePath: upload.localPath,
          title: `${concept.name}: ${product.title} Guide 2026`,
          description: `Looking to upgrade your workspace? The ${product.title} features dual motors, memory presets, and sleek aesthetics. Tap through to check current deals! ${disclosure}`,
          keywords: ['standing desk', 'desk setup', 'home office inspo', 'ergonomic workspace', 'amazon finds 2026'],
          destinationUrl: affiliateUrl,
          scheduledAt: isFirst ? new Date(Date.now() - 3600000) : slotTime,
          publishedAt: isFirst ? new Date() : null,
          status: pinStatus,
          publishedPinUrl: isFirst ? 'https://pinterest.com/pin/987654321098765' : '',
          manualMetrics: isFirst
            ? {
              impressions: 1420,
              outboundClicks: 128,
              saves: 45,
              lastUpdated: new Date(),
            }
            : { impressions: 0, outboundClicks: 0, saves: 0 },
        });

        // Create ScheduleSlot
        await ScheduleSlot.create({
          userId: user._id,
          pinId: pin._id,
          campaignId: campaign._id,
          slotTime: isFirst ? new Date(Date.now() - 3600000) : slotTime,
          timezone: user.timezone,
          status: isFirst ? 'completed' : isSecond ? 'ready' : 'reserved',
        });

        // Advance by 1 hour for next pin
        slotTime = new Date(slotTime);
        slotTime.setHours(slotTime.getHours() + 1);
      }

      defaultBoard.pinCount = 10;
      await defaultBoard.save();

      // Notifications
      await Notification.create({
        userId: user._id,
        type: 'campaign_completed',
        title: 'Demo Campaign Ready!',
        message: 'Campaign "Smart Ergonomic Desk Campaign" has been generated with 10 creative Pins.',
        data: { campaignId: campaign._id },
      });

      await Notification.create({
        userId: user._id,
        type: 'pin_ready',
        title: 'Pin Ready to Publish!',
        message: 'Pin #2 (Benefits & Value Focus) is ready for manual publishing in your queue.',
        data: { campaignId: campaign._id },
      });

      // Activity Log
      await ActivityLog.create({
        userId: user._id,
        action: 'created_campaign',
        entityType: 'campaign',
        entityId: campaign._id,
        metadata: {
          campaignName: campaign.name,
          pinsCount: 10,
        },
      });

      console.log('✓ Demo campaign, 10 Pins, and schedule slots successfully seeded.');
    }
  } catch (err) {
    console.error('Error seeding demo data:', err.message);
  }
}
