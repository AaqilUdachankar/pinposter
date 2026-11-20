import mongoose from 'mongoose';

const GenerationJobSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    campaignId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Campaign',
      required: true,
      index: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    status: {
      type: String,
      enum: ['queued', 'processing', 'completed', 'failed'],
      default: 'queued',
      index: true,
    },
    currentStep: {
      type: String,
      enum: [
        'extracting',
        'analyzing',
        'generating_concepts',
        'generating_images',
        'reserving_slots',
        'completed',
        'failed'
      ],
      default: 'extracting',
    },
    progress: {
      type: Number,
      default: 0,
    },
    logs: [
      {
        timestamp: { type: Date, default: Date.now },
        message: String,
        status: { type: String, enum: ['info', 'warning', 'error', 'success'], default: 'info' },
      },
    ],
    error: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

GenerationJobSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model('GenerationJob', GenerationJobSchema);
