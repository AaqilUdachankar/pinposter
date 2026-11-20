import ScheduleSlot from '../models/ScheduleSlot.js';
import { checkAndAdvanceScheduleQueue } from '../services/schedulerService.js';

export async function getScheduleSlots(req, res, next) {
  try {
    const { startDate, endDate, status } = req.query;

    const filter = { userId: req.userId };

    if (startDate || endDate) {
      filter.slotTime = {};
      if (startDate) filter.slotTime.$gte = new Date(startDate);
      if (endDate) filter.slotTime.$lte = new Date(endDate);
    }

    if (status) {
      filter.status = status;
    }

    const slots = await ScheduleSlot.find(filter)
      .populate({
        path: 'pinId',
        populate: [{ path: 'productId' }, { path: 'boardId' }, { path: 'campaignId' }],
      })
      .sort({ slotTime: 1 });

    res.json({
      success: true,
      slots,
    });
  } catch (err) {
    next(err);
  }
}

export async function triggerQueueCheck(req, res, next) {
  try {
    const result = await checkAndAdvanceScheduleQueue(req.userId);
    res.json({
      success: true,
      message: 'Queue checked and advanced',
      result,
    });
  } catch (err) {
    next(err);
  }
}
