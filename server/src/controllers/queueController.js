import Pin from '../models/Pin.js';
import ScheduleSlot from '../models/ScheduleSlot.js';
import { findNextAvailableSlot } from '../services/schedulerService.js';

export async function getPublishingQueue(req, res, next) {
  try {
    const { status, campaignId, boardId } = req.query;

    const filter = {
      userId: req.userId,
    };

    if (status) {
      filter.status = status;
    } else {
      // Default publishing queue shows active items
      filter.status = { $in: ['ready_to_publish', 'scheduled', 'overdue', 'queued'] };
    }

    if (campaignId) filter.campaignId = campaignId;
    if (boardId) filter.boardId = boardId;

    const [pins, nextAvailableSlot, readyCount, scheduledCount, overdueCount] = await Promise.all([
      Pin.find(filter)
        .populate('productId')
        .populate('boardId')
        .populate('campaignId')
        .sort({ scheduledAt: 1 }),
      findNextAvailableSlot(req.userId),
      Pin.countDocuments({ userId: req.userId, status: 'ready_to_publish' }),
      Pin.countDocuments({ userId: req.userId, status: 'scheduled' }),
      Pin.countDocuments({ userId: req.userId, status: 'overdue' }),
    ]);

    res.json({
      success: true,
      nextAvailableSlot,
      stats: {
        readyToPublish: readyCount,
        scheduled: scheduledCount,
        overdue: overdueCount,
        totalInQueue: pins.length,
      },
      pins,
    });
  } catch (err) {
    next(err);
  }
}

export async function getNextSlot(req, res, next) {
  try {
    const nextSlot = await findNextAvailableSlot(req.userId);
    res.json({
      success: true,
      nextAvailableSlot: nextSlot,
    });
  } catch (err) {
    next(err);
  }
}
