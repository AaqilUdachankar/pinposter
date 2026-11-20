import mongoose from 'mongoose';

const ProductSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    originalAffiliateUrl: {
      type: String,
      required: [true, 'Original affiliate URL is required'],
      trim: true,
    },
    extractedProductUrl: {
      type: String,
      trim: true,
    },
    title: {
      type: String,
      required: [true, 'Product title is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    price: {
      type: String,
      default: '',
    },
    currency: {
      type: String,
      default: 'USD',
    },
    brand: {
      type: String,
      default: '',
    },
    category: {
      type: String,
      default: 'General',
    },
    images: {
      type: [String],
      default: [],
    },
    features: {
      type: [String],
      default: [],
    },
    extractionStatus: {
      type: String,
      enum: ['pending', 'completed', 'partial', 'manual', 'failed'],
      default: 'pending',
    },
    rawMetadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

ProductSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model('Product', ProductSchema);
