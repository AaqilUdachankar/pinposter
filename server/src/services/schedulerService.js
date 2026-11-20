import ScheduleSlot from '../models/ScheduleSlot.js';
import Pin from '../models/Pin.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { dispatchPinToMakeWebhook } from './webhookService.js';

/**
 * Normalizes any Date object to the exact start of that hour (minutes: 0, seconds: 0, ms: 0).
 */
export function normalizeToHour(date) {
  const d = new Date(date);
  d.setMinutes(0, 0, 0);
  return d;
}

/**
 * Calculates the next top-of-the-hour strictly in the future.
 * E.g., if current time is 12:20 PM, returns 1:00 PM today.
 * If 12:00:00 PM exactly, returns 1:00 PM to ensure adequate publishing window.
 */
export function getNextUpcomingHour(referenceDate = new Date()) {
  const d = new Date(referenceDate);
  d.setHours(d.getHours() + 1);
  d.setMinutes(0, 0, 0);
  return d;
}

/**
 * Finds the earliest available future hourly slot for a user across all products and campaigns.
 * Looks for the latest active reserved slot across the system.
 */
export async function findNextAvailableSlot(userId) {
  // Find the latest active future reserved slot
  const latestSlot = await ScheduleSlot.findOne({
    userId,
    status: { $in: ['reserved', 'ready'] },
  }).sort({ slotTime: -1 });

  const minNextHour = getNextUpcomingHour();

  if (!latestSlot) {
    return minNextHour;
  }

  const latestTime = new Date(latestSlot.slotTime);
  const nextCandidate = new Date(latestTime);
  nextCandidate.setHours(nextCandidate.getHours() + 1);
  nextCandidate.setMinutes(0, 0, 0);

  // If latest reserved slot was in the past, return the upcoming top-of-the-hour
  if (nextCandidate < minNextHour) {
    return minNextHour;
  }

  return nextCandidate;
}

/**
 * Atomically reserves 10 consecutive hourly slots for a campaign.
 * Maintains one global chronological queue across all products.
 */
export async function reserveSlotsForCampaign({ userId, campaignId, pins, timezone = 'Asia/Kolkata' }) {
  const reservedPins = [];

  // Start from the next available global slot
  let candidateSlotTime = await findNextAvailableSlot(userId);

  for (const pin of pins) {
    let reserved = false;
    let attempts = 0;

    while (!reserved && attempts < 24) {
      attempts++;
      candidateSlotTime = normalizeToHour(candidateSlotTime);

      try {
        // Create ScheduleSlot (guaranteed atomic uniqueness via compound index { userId: 1, slotTime: 1 })
        const slot = await ScheduleSlot.create({
          userId,
          pinId: pin._id,
          campaignId,
          slotTime: candidateSlotTime,
          timezone,
          status: 'reserved',
        });

        // Update the Pin with the assigned slot
        pin.scheduledAt = candidateSlotTime;
        pin.status = 'scheduled';
        await pin.save();

        reservedPins.push({ pin, slot });
        reserved = true;

        // Advance by exactly 1 hour for the next Pin in this campaign
        candidateSlotTime = new Date(candidateSlotTime);
        candidateSlotTime.setHours(candidateSlotTime.getHours() + 1);
      } catch (err) {
        if (err.code === 11000) {
          // Slot conflict with an existing reservation: advance 1 hour and retry
          candidateSlotTime = new Date(candidateSlotTime);
          candidateSlotTime.setHours(candidateSlotTime.getHours() + 1);
        } else {
          throw err;
        }
      }
    }

    if (!reserved) {
      throw new Error(`Could not find an available scheduling slot for Pin #${pin.conceptIndex}`);
    }
  }

  return reservedPins;
}

/**
 * Checks all reserved slots and promotes those whose scheduled time has arrived to 'ready_to_publish'.
 * Detects missed slots (overdue) if backend was offline or user hasn't published within 24h.
 */
export async function checkAndAdvanceScheduleQueue(userId = null) {
  const now = new Date();
  const query = {
    status: 'reserved',
    slotTime: { $lte: now },
  };

  if (userId) {
    query.userId = userId;
  }

  const dueSlots = await ScheduleSlot.find(query).populate('pinId');
  const promotedPins = [];

  for (const slot of dueSlots) {
    if (slot.pinId) {
      const pin = await Pin.findById(slot.pinId);
      if (pin && (pin.status === 'scheduled' || pin.status === 'queued')) {
        pin.status = 'ready_to_publish';
        await pin.save();
        promotedPins.push(pin);

        // Check if user has Make.com automation enabled
        const user = await User.findById(pin.userId);
        let makeDispatched = false;
        const method = user?.preferences?.autoPublishMethod || 'rss';

        if (
          user?.preferences?.makeWebhookEnabled &&
          user?.preferences?.makeWebhookUrl &&
          (method === 'make' || method === 'both')
        ) {
          try {
            const webhookResult = await dispatchPinToMakeWebhook({ pin, user });
            if (webhookResult.success) {
              makeDispatched = true;
              pin.status = 'published';
              pin.publishedAt = new Date();
              await pin.save();

              slot.status = 'completed';
              await slot.save();

              await Notification.create({
                userId: pin.userId,
                type: 'pin_published',
                title: 'Pin Auto-Published via Make.com!',
                message: `Pin "${pin.title}" was automatically dispatched to your Make.com Pinterest webhook.`,
                data: { pinId: pin._id, campaignId: pin.campaignId, boardId: pin.boardId },
              });
            }
          } catch (err) {
            console.error(`Make.com webhook dispatch failed for Pin #${pin._id}:`, err.message);
          }
        }

        if (!makeDispatched) {
          slot.status = 'ready';
          await slot.save();

          // Create in-app notification for RSS auto-publisher or manual handoff
          await Notification.create({
            userId: pin.userId,
            type: 'pin_ready',
            title: 'Pin Ready to Publish!',
            message: `Pin "${pin.title}" is ready and live in your RSS feed for Pinterest.`,
            data: { pinId: pin._id, campaignId: pin.campaignId, boardId: pin.boardId },
          });
        }
      } else {
        slot.status = 'ready';
        await slot.save();
      }
    } else {
      slot.status = 'ready';
      await slot.save();
    }
  }

  // Check for overdue pins (ready for > 24 hours without manual publishing)
  const overdueThreshold = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const overdueSlots = await ScheduleSlot.find({
    status: 'ready',
    slotTime: { $lte: overdueThreshold },
    ...(userId && { userId }),
  });

  for (const slot of overdueSlots) {
    slot.status = 'overdue';
    await slot.save();

    const pin = await Pin.findById(slot.pinId);
    if (pin && pin.status === 'ready_to_publish') {
      pin.status = 'overdue';
      await pin.save();

      await Notification.create({
        userId: pin.userId,
        type: 'slot_missed',
        title: 'Scheduled Slot Overdue',
        message: `Pin "${pin.title}" was scheduled for ${slot.slotTime.toLocaleString()} and is overdue. You can publish now or reschedule.`,
        data: { pinId: pin._id },
      });
    }
  }

  return { promotedCount: promotedPins.length, overdueCount: overdueSlots.length };
}

/**
 * Reschedules an individual Pin to a new future hourly slot safely.
 */
export async function reschedulePin(pinId, newSlotTime, userId) {
  const normalizedTime = normalizeToHour(newSlotTime);
  const now = new Date();

  if (normalizedTime <= now) {
    throw new Error('New schedule slot must be strictly in the future');
  }

  const pin = await Pin.findOne({ _id: pinId, userId });
  if (!pin) {
    throw new Error('Pin not found');
  }

  // Remove existing slot if any
  await ScheduleSlot.deleteOne({ pinId: pin._id, userId });

  // Reserve the requested slot
  const slot = await ScheduleSlot.create({
    userId,
    pinId: pin._id,
    campaignId: pin.campaignId,
    slotTime: normalizedTime,
    status: 'reserved',
  });

  pin.scheduledAt = normalizedTime;
  pin.status = 'scheduled';
  await pin.save();

  return { pin, slot };
}

/**
 * Pauses a Pin and releases its scheduled slot.
 */
export async function pausePin(pinId, userId) {
  const pin = await Pin.findOne({ _id: pinId, userId });
  if (!pin) throw new Error('Pin not found');

  pin.status = 'paused';
  await pin.save();

  // Mark slot as cancelled/released so it frees up
  await ScheduleSlot.updateOne({ pinId: pin._id, userId }, { status: 'cancelled' });

  return pin;
}

/**
 * Resumes a paused Pin and assigns it the next available global slot.
 */
export async function resumePin(pinId, userId) {
  const pin = await Pin.findOne({ _id: pinId, userId });
  if (!pin) throw new Error('Pin not found');

  const nextSlot = await findNextAvailableSlot(userId);

  // Remove old slot
  await ScheduleSlot.deleteOne({ pinId: pin._id, userId });

  // Create new slot
  const slot = await ScheduleSlot.create({
    userId,
    pinId: pin._id,
    campaignId: pin.campaignId,
    slotTime: nextSlot,
    status: 'reserved',
  });

  pin.scheduledAt = nextSlot;
  pin.status = 'scheduled';
  await pin.save();

  return { pin, slot };
}
