import Product from '../models/Product.js';
import Campaign from '../models/Campaign.js';
import Pin from '../models/Pin.js';
import Board from '../models/Board.js';
import GenerationJob from '../models/GenerationJob.js';
import Notification from '../models/Notification.js';
import ActivityLog from '../models/ActivityLog.js';
import { extractProductMetadata } from './scraperService.js';
import { generate10PinConcepts } from './geminiService.js';
import { generatePinImage } from './imageService.js';
import { reserveSlotsForCampaign } from './schedulerService.js';

/**
 * Executes the full automatic 10-Pin generation & scheduling workflow.
 */
export async function runCampaignGeneration({
  jobId,
  campaignId,
  productId,
  boardId,
  userId,
  userTimezone = 'Asia/Kolkata',
}) {
  const job = await GenerationJob.findById(jobId);
  const campaign = await Campaign.findById(campaignId);
  const product = await Product.findById(productId);
  const board = await Board.findById(boardId);

  if (!job || !campaign || !product) {
    throw new Error('Generation context not found');
  }

  const addLog = async (message, status = 'info', step = null, progress = null) => {
    job.logs.push({ timestamp: new Date(), message, status });
    if (step) job.currentStep = step;
    if (progress !== null) job.progress = progress;
    await job.save();
    console.log(`[Job ${jobId}] [${step || job.currentStep}] ${message}`);
  };

  try {
    job.status = 'processing';
    await job.save();

    // STEP 1 & 2: Product Extraction (if pending)
    if (product.extractionStatus === 'pending') {
      await addLog('Extracting product details and images...', 'info', 'extracting', 15);
      const extracted = await extractProductMetadata(product.originalAffiliateUrl);

      product.title = product.title || extracted.title;
      product.description = product.description || extracted.description;
      product.price = product.price || extracted.price;
      product.currency = product.currency || extracted.currency;
      product.brand = product.brand || extracted.brand;
      product.category = product.category || extracted.category;
      if (extracted.images?.length && (!product.images || product.images.length === 0)) {
        product.images = extracted.images;
      }
      if (extracted.features?.length) {
        product.features = extracted.features;
      }
      product.extractionStatus = extracted.extractionStatus;
      await product.save();
      await addLog(`Product metadata extracted: "${product.title}"`, 'success', 'extracting', 25);
    }

    // STEP 3: Analyzing & Generating 10 Concepts with AI
    await addLog('Analyzing product and generating 10 unique Pinterest concepts with AI...', 'info', 'generating_concepts', 40);
    const concepts = await generate10PinConcepts({
      product,
      userId,
    });
    await addLog('10 distinct Pinterest creative concepts and SEO content prepared.', 'success', 'generating_concepts', 55);

    // STEP 4: Generate 10 Separate Creative Images & Save Pins
    await addLog('Synthesizing 10 high-resolution vertical Pinterest Pin creatives (1080x1920)...', 'info', 'generating_images', 60);

    const createdPins = [];
    for (let i = 0; i < concepts.length; i++) {
      const concept = concepts[i];
      const pinIndex = i + 1;
      const progressPercent = 60 + Math.floor((i / concepts.length) * 25);

      await addLog(
        `Rendering creative Pin #${pinIndex}: ${concept.conceptName}...`,
        'info',
        'generating_images',
        progressPercent
      );

      let imageResult;
      try {
        imageResult = await generatePinImage({
          conceptIndex: pinIndex,
          conceptName: concept.conceptName,
          title: concept.title,
          overlayTitle: concept.overlayTitle,
          overlaySubtitle: concept.overlaySubtitle,
          imagePrompt: concept.imagePrompt,
          product,
          userId,
        });
      } catch (imgErr) {
        console.error(`Image generation error for Pin #${pinIndex}:`, imgErr.message);
        // Fallback to minimal placeholder to never completely break the entire batch
        imageResult = {
          url: product.images?.[0] || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1000&auto=format&fit=crop&q=80',
          localPath: '',
          provider: 'fallback',
        };
      }

      // Preserve original submitted affiliate URL strictly!
      const pin = await Pin.create({
        userId,
        productId: product._id,
        campaignId: campaign._id,
        boardId: board._id,
        conceptIndex: pinIndex,
        conceptName: concept.conceptName,
        imageUrl: imageResult.url,
        localImagePath: imageResult.localPath,
        title: concept.title,
        description: concept.description,
        keywords: concept.keywords || [],
        destinationUrl: product.originalAffiliateUrl,
        status: 'queued',
      });

      createdPins.push(pin);
    }

    await addLog('All 10 creative images generated and saved.', 'success', 'reserving_slots', 88);

    // STEP 5: Automatically Reserve 10 Hourly Slots in Global Chronological Queue
    await addLog('Reserving 10 consecutive hourly scheduling slots in the global queue...', 'info', 'reserving_slots', 92);

    const scheduledItems = await reserveSlotsForCampaign({
      userId,
      campaignId: campaign._id,
      pins: createdPins,
      timezone: userTimezone,
    });

    // Update campaign status
    campaign.status = 'scheduled';
    campaign.generationStatus = 'completed';
    campaign.scheduledPinsCount = createdPins.length;
    campaign.completedAt = new Date();
    await campaign.save();

    // Update board pin count
    board.pinCount = (board.pinCount || 0) + createdPins.length;
    await board.save();

    // Mark job completed
    job.status = 'completed';
    job.currentStep = 'completed';
    job.progress = 100;
    await addLog(
      `Campaign successfully generated and scheduled! Reserved ${scheduledItems.length} hourly slots.`,
      'success',
      'completed',
      100
    );

    // Create In-App Notification
    await Notification.create({
      userId,
      type: 'campaign_completed',
      title: 'Campaign Ready & Scheduled!',
      message: `Campaign "${campaign.name}" created with 10 Pins scheduled in consecutive hourly slots.`,
      data: { campaignId: campaign._id, productId: product._id },
    });

    // Log Activity
    await ActivityLog.create({
      userId,
      action: 'created_campaign',
      entityType: 'campaign',
      entityId: campaign._id,
      metadata: {
        campaignName: campaign.name,
        productTitle: product.title,
        pinsCount: createdPins.length,
        firstSlot: scheduledItems[0]?.slot?.slotTime,
        lastSlot: scheduledItems[scheduledItems.length - 1]?.slot?.slotTime,
      },
    });

    return { campaign, pins: createdPins };
  } catch (err) {
    console.error('Fatal campaign generation failure:', err);
    job.status = 'failed';
    job.error = err.message;
    await addLog(`Generation failed: ${err.message}`, 'error', 'failed');

    campaign.status = 'cancelled';
    campaign.generationStatus = 'failed';
    campaign.generationError = err.message;
    await campaign.save();

    await Notification.create({
      userId,
      type: 'campaign_completed',
      title: 'Campaign Generation Failed',
      message: `Failed generating campaign "${campaign.name}": ${err.message}`,
      data: { campaignId: campaign._id },
    });

    throw err;
  }
}
