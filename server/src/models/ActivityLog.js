import mongoose from 'mongoose';

const ActivityLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    action: {
      type: String,
      required: true,
      trim: true,
    },
    entityType: {
      type: String,
      enum: ['campaign', 'pin', 'board', 'product', 'api_config', 'user', 'schedule'],
      required: true,
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

ActivityLogSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model('ActivityLog', ActivityLogSchema);
