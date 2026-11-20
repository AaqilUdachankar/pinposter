import mongoose from 'mongoose';

const CampaignSchema = new mongoose.Schema(
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
    boardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Board',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Campaign name is required'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['draft', 'generating', 'scheduled', 'completed', 'partially_scheduled', 'paused', 'cancelled'],
      default: 'generating',
      index: true,
    },
    generationStatus: {
      type: String,
      enum: ['pending', 'extracting', 'analyzing', 'generating_concepts', 'generating_images', 'scheduling', 'completed', 'failed'],
      default: 'pending',
    },
    generationError: {
      type: String,
      default: null,
    },
    totalPins: {
      type: Number,
      default: 10,
    },
    scheduledPinsCount: {
      type: Number,
      default: 0,
    },
    publishedPinsCount: {
      type: Number,
      default: 0,
    },
    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

CampaignSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model('Campaign', CampaignSchema);
