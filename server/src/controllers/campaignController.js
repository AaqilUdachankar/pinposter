import Campaign from '../models/Campaign.js';
import Product from '../models/Product.js';
import Pin from '../models/Pin.js';
import Board from '../models/Board.js';
import GenerationJob from '../models/GenerationJob.js';
import ScheduleSlot from '../models/ScheduleSlot.js';
import { runCampaignGeneration } from '../services/campaignGeneratorService.js';
import { validateSafeUrl } from '../services/scraperService.js';

export async function createAndRunCampaign(req, res, next) {
  try {
    const {
      affiliateUrl,
      boardId,
      campaignName,
      manualProductDetails,
    } = req.body;

    if (!affiliateUrl) {
      return res.status(400).json({ success: false, message: 'Affiliate URL is required' });
    }

    if (!boardId) {
      return res.status(400).json({ success: false, message: 'Please select a Pinterest reference board' });
    }

    // SSRF verification
    const safeUrl = await validateSafeUrl(affiliateUrl);

    // Verify Board exists and belongs to user
    const board = await Board.findOne({ _id: boardId, userId: req.userId });
    if (!board) {
      return res.status(404).json({ success: false, message: 'Selected board was not found' });
    }

    // 1. Create or prepare Product model
    let product;
    if (manualProductDetails?.title) {
      product = await Product.create({
        userId: req.userId,
        originalAffiliateUrl: safeUrl,
        title: manualProductDetails.title,
        description: manualProductDetails.description || '',
        price: manualProductDetails.price || '',
        currency: manualProductDetails.currency || 'USD',
        brand: manualProductDetails.brand || '',
        category: manualProductDetails.category || board.category || 'General',
        images: manualProductDetails.images || [],
        features: manualProductDetails.features || [],
        extractionStatus: 'manual',
      });
    } else {
      product = await Product.create({
        userId: req.userId,
        originalAffiliateUrl: safeUrl,
        title: 'Pending Extraction...',
        extractionStatus: 'pending',
      });
    }

    const generatedCampaignName =
      campaignName?.trim() ||
      `${product.title !== 'Pending Extraction...' ? product.title.slice(0, 30) : 'Campaign'} - ${new Date().toLocaleDateString()}`;

    // 2. Create Campaign record
    const campaign = await Campaign.create({
      userId: req.userId,
      productId: product._id,
      boardId: board._id,
      name: generatedCampaignName,
      status: 'generating',
      generationStatus: 'pending',
      totalPins: 10,
    });

    // 3. Create Generation Job record for persisted progress tracking
    const job = await GenerationJob.create({
      userId: req.userId,
      campaignId: campaign._id,
      productId: product._id,
      status: 'queued',
      currentStep: 'extracting',
      progress: 5,
      logs: [{ timestamp: new Date(), message: 'Campaign generation initialized', status: 'info' }],
    });

    // Run generation workflow in background without blocking initial HTTP response
    runCampaignGeneration({
      jobId: job._id,
      campaignId: campaign._id,
      productId: product._id,
      boardId: board._id,
      userId: req.userId,
      userTimezone: req.user.timezone || 'Asia/Kolkata',
    }).catch((err) => {
      console.error(`Background campaign generation failed for ${campaign._id}:`, err);
    });

    // Respond immediately with created campaign and job ID so UI shows dynamic multi-step progress!
    res.status(202).json({
      success: true,
      message: 'Campaign generation started',
      campaign,
      jobId: job._id,
      productId: product._id,
    });
  } catch (err) {
    next(err);
  }
}

export async function getCampaigns(req, res, next) {
  try {
    const { status, boardId, page = 1, limit = 20 } = req.query;
    const filter = { userId: req.userId };

    if (status) filter.status = status;
    if (boardId) filter.boardId = boardId;

    const skip = (Number(page) - 1) * Number(limit);

    const [campaigns, total] = await Promise.all([
      Campaign.find(filter)
        .populate('productId')
        .populate('boardId')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Campaign.countDocuments(filter),
    ]);

    res.json({
      success: true,
      campaigns,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    });
  } catch (err) {
    next(err);
  }
}

export async function getCampaignById(req, res, next) {
  try {
    const campaign = await Campaign.findOne({ _id: req.params.id, userId: req.userId })
      .populate('productId')
      .populate('boardId');

    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign not found' });
    }

    const pins = await Pin.find({ campaignId: campaign._id, userId: req.userId })
      .sort({ conceptIndex: 1 });

    const job = await GenerationJob.findOne({ campaignId: campaign._id }).sort({ createdAt: -1 });

    res.json({
      success: true,
      campaign,
      pins,
      job,
    });
  } catch (err) {
    next(err);
  }
}

export async function getCampaignJob(req, res, next) {
  try {
    const job = await GenerationJob.findOne({
      campaignId: req.params.id,
      userId: req.userId,
    }).sort({ createdAt: -1 });

    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    res.json({
      success: true,
      job,
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteCampaign(req, res, next) {
  try {
    const campaign = await Campaign.findOne({ _id: req.params.id, userId: req.userId });
    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign not found' });
    }

    // Release and delete slots associated with this campaign
    await ScheduleSlot.deleteMany({ campaignId: campaign._id, userId: req.userId });

    // Mark pins cancelled or delete
    await Pin.deleteMany({ campaignId: campaign._id, userId: req.userId });

    // Delete job records
    await GenerationJob.deleteMany({ campaignId: campaign._id, userId: req.userId });

    // Delete campaign
    await campaign.deleteOne();

    res.json({
      success: true,
      message: 'Campaign and its scheduled reservations deleted successfully',
    });
  } catch (err) {
    next(err);
  }
}
