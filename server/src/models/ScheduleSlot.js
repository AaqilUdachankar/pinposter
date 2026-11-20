import mongoose from 'mongoose';

const ScheduleSlotSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    pinId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Pin',
      required: true,
    },
    campaignId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Campaign',
      required: true,
    },
    slotTime: {
      type: Date,
      required: true,
    },
    timezone: {
      type: String,
      default: 'Asia/Kolkata',
    },
    status: {
      type: String,
      enum: ['reserved', 'ready', 'overdue', 'completed', 'cancelled', 'released'],
      default: 'reserved',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Guarantee that no user can have two pins booked for the same slot time
ScheduleSlotSchema.index({ userId: 1, slotTime: 1 }, { unique: true });
ScheduleSlotSchema.index({ userId: 1, status: 1, slotTime: 1 });

export default mongoose.model('ScheduleSlot', ScheduleSlotSchema);
