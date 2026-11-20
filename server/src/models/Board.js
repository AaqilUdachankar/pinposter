import mongoose from 'mongoose';

const BoardSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Board name is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    category: {
      type: String,
      default: 'General',
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    pinCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

BoardSchema.index({ userId: 1, name: 1 }, { unique: true });

export default mongoose.model('Board', BoardSchema);
