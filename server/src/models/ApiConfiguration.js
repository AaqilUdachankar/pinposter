import mongoose from 'mongoose';

const ApiConfigurationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    providerType: {
      type: String,
      enum: ['text_ai', 'image_generation', 'storage'],
      required: true,
      index: true,
    },
    providerName: {
      type: String,
      required: true,
      trim: true,
    },
    endpoint: {
      type: String,
      trim: true,
      default: '',
    },
    model: {
      type: String,
      trim: true,
      default: '',
    },
    dimensions: {
      type: String,
      default: '1080x1920',
    },
    encryptedApiKey: {
      type: String,
      default: '',
    },
    encryptedApiSecret: {
      type: String,
      default: '',
    },
    isEnabled: {
      type: Boolean,
      default: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    testStatus: {
      type: String,
      enum: ['untested', 'connected', 'failed'],
      default: 'untested',
    },
    lastTestedAt: {
      type: Date,
      default: null,
    },
    lastErrorMessage: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

ApiConfigurationSchema.index({ userId: 1, providerType: 1, isDefault: 1 });

export default mongoose.model('ApiConfiguration', ApiConfigurationSchema);
