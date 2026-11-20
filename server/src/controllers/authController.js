import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Board from '../models/Board.js';
import Campaign from '../models/Campaign.js';
import Pin from '../models/Pin.js';
import ScheduleSlot from '../models/ScheduleSlot.js';
import Product from '../models/Product.js';
import ApiConfiguration from '../models/ApiConfiguration.js';
import Notification from '../models/Notification.js';
import ActivityLog from '../models/ActivityLog.js';
import { z } from 'zod';
import { getJwtSecret } from '../config/secrets.js';

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  timezone: z.string().default('Asia/Kolkata'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

function generateToken(user) {
  return jwt.sign(
    { id: user._id, role: user.role },
    getJwtSecret(),
    { expiresIn: '30d' }
  );
}

export async function register(req, res, next) {
  try {
    const { name, email, password, timezone } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists.',
      });
    }

    const user = await User.create({
      name,
      email,
      password,
      timezone: timezone || 'Asia/Kolkata',
    });

    // Create an initial default Pinterest reference board for new user
    await Board.create({
      userId: user._id,
      name: 'Best Products & Reviews',
      description: 'Default board for top trending product recommendations',
      category: 'Lifestyle',
      isDefault: true,
    });

    const token = generateToken(user);

    res.status(201).json({
      success: true,
      message: 'Account registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        timezone: user.timezone,
        preferences: user.preferences,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const email = req.body.email?.trim().toLowerCase();
    const password = req.body.password;

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const token = generateToken(user);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        timezone: user.timezone,
        preferences: user.preferences,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getMe(req, res, next) {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        timezone: user.timezone,
        preferences: user.preferences,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function updateProfile(req, res, next) {
  try {
    const { name, timezone, preferences } = req.body;
    const user = await User.findById(req.userId);

    if (name) user.name = name;
    if (timezone) user.timezone = timezone;
    if (preferences) {
      user.preferences = {
        ...user.preferences,
        ...preferences,
      };
    }

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        timezone: user.timezone,
        preferences: user.preferences,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.userId).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password does not match.',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters.',
      });
    }

    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Permanently deletes user account and all associated personal data (GDPR / Right to be Forgotten).
 */
export async function deleteAccount(req, res, next) {
  try {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your current password to confirm permanent account deletion.',
      });
    }

    const user = await User.findById(req.userId).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Incorrect password. Account deletion aborted.',
      });
    }

    const userId = user._id;

    // Cascade delete all user-related data across all collections
    await Promise.all([
      Campaign.deleteMany({ userId }),
      Pin.deleteMany({ userId }),
      ScheduleSlot.deleteMany({ userId }),
      Product.deleteMany({ userId }),
      Board.deleteMany({ userId }),
      ApiConfiguration.deleteMany({ userId }),
      Notification.deleteMany({ userId }),
      ActivityLog.deleteMany({ userId }),
      User.deleteOne({ _id: userId }),
    ]);

    res.json({
      success: true,
      message: 'Your account and all associated personal data have been permanently deleted.',
    });
  } catch (err) {
    next(err);
  }
}

export async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    // Return safe message regardless of email existence to prevent user enumeration
    res.json({
      success: true,
      message: 'If an account exists with this email, password reset instructions have been sent.',
    });
  } catch (err) {
    next(err);
  }
}
