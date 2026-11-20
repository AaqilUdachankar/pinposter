import mongoose from 'mongoose';

const PinSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },
    campaignId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Campaign',
      required: true,
      index: true,
    },
    boardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Board',
      required: true,
      index: true,
    },
    conceptIndex: {
      type: Number,
      required: true,
      min: 1,
      max: 10,
    },
    conceptName: {
      type: String,
      required: true,
      trim: true,
    },
    imageUrl: {
      type: String,
      required: true,
    },
    localImagePath: {
      type: String,
      default: '',
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 800,
    },
    keywords: {
      type: [String],
      default: [],
    },
    destinationUrl: {
      type: String,
      required: true,
      trim: true,
    },
    scheduledAt: {
      type: Date,
      index: true,
    },
    publishedAt: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['queued', 'scheduled', 'ready_to_publish', 'overdue', 'published', 'paused', 'failed', 'cancelled'],
      default: 'scheduled',
      index: true,
    },
    failureReason: {
      type: String,
      default: null,
    },
    retryCount: {
      type: Number,
      default: 0,
    },
    manualMetrics: {
      impressions: { type: Number, default: 0 },
      outboundClicks: { type: Number, default: 0 },
      saves: { type: Number, default: 0 },
      lastUpdated: { type: Date },
    },
    notes: {
      type: String,
      default: '',
      trim: true,
    },
    publishedPinUrl: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

PinSchema.index({ userId: 1, scheduledAt: 1 });
PinSchema.index({ userId: 1, status: 1 });
PinSchema.index({ campaignId: 1, conceptIndex: 1 });

export default mongoose.model('Pin', PinSchema);
