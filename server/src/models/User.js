import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
      select: false,
    },
    role: {
      type: String,
      enum: ['admin', 'user'],
      default: 'admin',
    },
    timezone: {
      type: String,
      default: 'Asia/Kolkata',
    },
    feedToken: {
      type: String,
      unique: true,
      sparse: true,
    },
    preferences: {
      defaultDisclosure: {
        type: String,
        default: '#ad #affiliate When you buy through our links, we may earn an affiliate commission.',
      },
      includeDisclosure: {
        type: Boolean,
        default: true,
      },
      emailNotifications: {
        type: Boolean,
        default: false,
      },
      theme: {
        type: String,
        default: 'light',
      },
      makeWebhookUrl: {
        type: String,
        default: '',
        trim: true,
      },
      makeWebhookEnabled: {
        type: Boolean,
        default: false,
      },
      autoPublishMethod: {
        type: String,
        enum: ['rss', 'make', 'both', 'manual'],
        default: 'rss',
      },
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
  },
  {
    timestamps: true,
  }
);

// Generate feedToken and hash password before saving
UserSchema.pre('save', async function (next) {
  if (!this.feedToken) {
    this.feedToken = crypto.randomBytes(16).toString('hex');
  }
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model('User', UserSchema);
