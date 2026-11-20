import Pin from '../models/Pin.js';
import Campaign from '../models/Campaign.js';
import Product from '../models/Product.js';
import Board from '../models/Board.js';
import ScheduleSlot from '../models/ScheduleSlot.js';
import {
  reschedulePin,
  pausePin,
  resumePin,
} from '../services/schedulerService.js';
import { generatePinImage } from '../services/imageService.js';
import { generate10PinConcepts } from '../services/geminiService.js';

export async function getPins(req, res, next) {
  try {
    const {
      status,
      boardId,
      campaignId,
      productId,
      search,
      page = 1,
      limit = 30,
      sortBy = 'scheduledAt',
      sortOrder = 'asc',
    } = req.query;

    const filter = { userId: req.userId };

    if (status) {
      if (status.includes(',')) {
        filter.status = { $in: status.split(',') };
      } else {
        filter.status = status;
      }
    }
    if (boardId) filter.boardId = boardId;
    if (campaignId) filter.campaignId = campaignId;
    if (productId) filter.productId = productId;

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { keywords: { $in: [new RegExp(search, 'i')] } },
      ];
    }

    const sortOption = {};
    sortOption[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const skip = (Number(page) - 1) * Number(limit);

    const [pins, total] = await Promise.all([
      Pin.find(filter)
        .populate('productId')
        .populate('boardId')
        .populate('campaignId')
        .sort(sortOption)
        .skip(skip)
        .limit(Number(limit)),
      Pin.countDocuments(filter),
    ]);

    res.json({
      success: true,
      pins,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    });
  } catch (err) {
    next(err);
  }
}

export async function getPinById(req, res, next) {
  try {
    const pin = await Pin.findOne({ _id: req.params.id, userId: req.userId })
      .populate('productId')
      .populate('boardId')
      .populate('campaignId');

    if (!pin) {
      return res.status(404).json({ success: false, message: 'Pin not found' });
    }

    res.json({
      success: true,
      pin,
    });
  } catch (err) {
    next(err);
  }
}

export async function updatePin(req, res, next) {
  try {
    const { title, description, keywords, destinationUrl, boardId, notes } = req.body;
    const pin = await Pin.findOne({ _id: req.params.id, userId: req.userId });

    if (!pin) {
      return res.status(404).json({ success: false, message: 'Pin not found' });
    }

    if (title) pin.title = title.trim();
    if (description) pin.description = description.trim();
    if (keywords && Array.isArray(keywords)) pin.keywords = keywords;
    if (destinationUrl) pin.destinationUrl = destinationUrl.trim();
    if (notes !== undefined) pin.notes = notes.trim();

    if (boardId && boardId !== String(pin.boardId)) {
      const board = await Board.findOne({ _id: boardId, userId: req.userId });
      if (board) pin.boardId = board._id;
    }

    await pin.save();

    res.json({
      success: true,
      message: 'Pin updated successfully',
      pin,
    });
  } catch (err) {
    next(err);
  }
}

export async function markPinAsPublished(req, res, next) {
  try {
    const { publishedPinUrl, notes } = req.body;
    const pin = await Pin.findOne({ _id: req.params.id, userId: req.userId });

    if (!pin) {
      return res.status(404).json({ success: false, message: 'Pin not found' });
    }

    pin.status = 'published';
    pin.publishedAt = new Date();
    if (publishedPinUrl) pin.publishedPinUrl = publishedPinUrl.trim();
    if (notes !== undefined) pin.notes = notes.trim();

    await pin.save();

    // Mark corresponding schedule slot as completed
    await ScheduleSlot.updateOne(
      { pinId: pin._id, userId: req.userId },
      { status: 'completed' }
    );

    // Update campaign published count
    await Campaign.updateOne(
      { _id: pin.campaignId },
      { $inc: { publishedPinsCount: 1 } }
    );

    res.json({
      success: true,
      message: 'Pin marked as published!',
      pin,
    });
  } catch (err) {
    next(err);
  }
}

export async function logPinMetrics(req, res, next) {
  try {
    const { impressions = 0, outboundClicks = 0, saves = 0 } = req.body;
    const pin = await Pin.findOne({ _id: req.params.id, userId: req.userId });

    if (!pin) {
      return res.status(404).json({ success: false, message: 'Pin not found' });
    }

    pin.manualMetrics = {
      impressions: Number(impressions),
      outboundClicks: Number(outboundClicks),
      saves: Number(saves),
      lastUpdated: new Date(),
    };

    await pin.save();

    res.json({
      success: true,
      message: 'Performance metrics logged successfully',
      pin,
    });
  } catch (err) {
    next(err);
  }
}

export async function handleReschedule(req, res, next) {
  try {
    const { scheduledAt } = req.body;
    if (!scheduledAt) {
      return res.status(400).json({ success: false, message: 'Scheduled date/time is required' });
    }

    const result = await reschedulePin(req.params.id, new Date(scheduledAt), req.userId);

    res.json({
      success: true,
      message: 'Pin rescheduled successfully',
      pin: result.pin,
      slot: result.slot,
    });
  } catch (err) {
    next(err);
  }
}

export async function handlePause(req, res, next) {
  try {
    const pin = await pausePin(req.params.id, req.userId);
    res.json({
      success: true,
      message: 'Pin paused and schedule slot released',
      pin,
    });
  } catch (err) {
    next(err);
  }
}

export async function handleResume(req, res, next) {
  try {
    const result = await resumePin(req.params.id, req.userId);
    res.json({
      success: true,
      message: 'Pin resumed and reserved in next available slot',
      pin: result.pin,
      slot: result.slot,
    });
  } catch (err) {
    next(err);
  }
}

export async function handleCancel(req, res, next) {
  try {
    const pin = await Pin.findOne({ _id: req.params.id, userId: req.userId });
    if (!pin) return res.status(404).json({ success: false, message: 'Pin not found' });

    pin.status = 'cancelled';
    await pin.save();

    await ScheduleSlot.updateOne({ pinId: pin._id, userId: req.userId }, { status: 'cancelled' });

    res.json({
      success: true,
      message: 'Pin cancelled',
      pin,
    });
  } catch (err) {
    next(err);
  }
}

export async function regeneratePinImage(req, res, next) {
  try {
    const pin = await Pin.findOne({ _id: req.params.id, userId: req.userId }).populate('productId');
    if (!pin) return res.status(404).json({ success: false, message: 'Pin not found' });

    const imageResult = await generatePinImage({
      conceptIndex: pin.conceptIndex,
      conceptName: pin.conceptName,
      title: pin.title,
      overlayTitle: pin.title.slice(0, 30),
      overlaySubtitle: 'New creative synthesis',
      imagePrompt: `Vertical 2:3 Pinterest Pin for ${pin.productId.title}`,
      product: pin.productId,
      userId: req.userId,
    });

    pin.imageUrl = imageResult.url;
    pin.localImagePath = imageResult.localPath;
    await pin.save();

    res.json({
      success: true,
      message: 'Pin image regenerated successfully',
      pin,
    });
  } catch (err) {
    next(err);
  }
}

export async function duplicatePin(req, res, next) {
  try {
    const sourcePin = await Pin.findOne({ _id: req.params.id, userId: req.userId });
    if (!sourcePin) return res.status(404).json({ success: false, message: 'Source pin not found' });

    const duplicated = await Pin.create({
      userId: req.userId,
      productId: sourcePin.productId,
      campaignId: sourcePin.campaignId,
      boardId: sourcePin.boardId,
      conceptIndex: sourcePin.conceptIndex,
      conceptName: `${sourcePin.conceptName} (Copy)`,
      imageUrl: sourcePin.imageUrl,
      localImagePath: sourcePin.localImagePath,
      title: `Copy of ${sourcePin.title}`.slice(0, 100),
      description: sourcePin.description,
      keywords: sourcePin.keywords,
      destinationUrl: sourcePin.destinationUrl,
      status: 'queued',
    });

    res.status(201).json({
      success: true,
      message: 'Pin duplicated successfully',
      pin: duplicated,
    });
  } catch (err) {
    next(err);
  }
}

export async function bulkAction(req, res, next) {
  try {
    const { pinIds, action, targetBoardId } = req.body;

    if (!pinIds || !Array.isArray(pinIds) || pinIds.length === 0) {
      return res.status(400).json({ success: false, message: 'No pin IDs provided' });
    }

    if (action === 'pause') {
      for (const id of pinIds) {
        await pausePin(id, req.userId).catch(() => {});
      }
    } else if (action === 'resume') {
      for (const id of pinIds) {
        await resumePin(id, req.userId).catch(() => {});
      }
    } else if (action === 'cancel') {
      await Pin.updateMany({ _id: { $in: pinIds }, userId: req.userId }, { status: 'cancelled' });
      await ScheduleSlot.updateMany({ pinId: { $in: pinIds }, userId: req.userId }, { status: 'cancelled' });
    } else if (action === 'change_board') {
      if (!targetBoardId) {
        return res.status(400).json({ success: false, message: 'Target board ID required' });
      }
      await Pin.updateMany({ _id: { $in: pinIds }, userId: req.userId }, { boardId: targetBoardId });
    } else {
      return res.status(400).json({ success: false, message: 'Unknown bulk action' });
    }

    res.json({
      success: true,
      message: `Bulk action "${action}" completed for ${pinIds.length} Pins`,
    });
  } catch (err) {
    next(err);
  }
}
