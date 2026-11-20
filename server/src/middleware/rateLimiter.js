import rateLimit from 'express-rate-limit';
import crypto from 'crypto';

// Global API rate limiter: 300 requests per 15 minutes per IP
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP. Please try again after 15 minutes.',
  },
});

// Strict Login rate limiter: Maximum 5 attempts per minute per IP
export const loginLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 attempts per minute
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    const correlationId = `limit_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    res.status(429).json({
      success: false,
      message: 'Too many login attempts. Please wait 1 minute before trying again.',
      correlationId,
    });
  },
});

// Registration / Signup rate limiter: Maximum 5 accounts per 15 minutes per IP
export const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 registrations per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    const correlationId = `limit_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    res.status(429).json({
      success: false,
      message: 'Too many account creation requests from this IP. Please try again later.',
      correlationId,
    });
  },
});

// Password reset / recovery limiter: Maximum 3 attempts per hour per IP
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 attempts per hour
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    const correlationId = `limit_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    res.status(429).json({
      success: false,
      message: 'Too many password reset requests. Please wait 1 hour before trying again.',
      correlationId,
    });
  },
});

// General auth rate limiter (fallback)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication requests. Please try again after 15 minutes.',
  },
});

// Campaign generation rate limiter: Maximum 10 generations per minute per IP
export const generationLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Campaign generation rate limit reached. Please wait a minute before generating another campaign.',
  },
});
