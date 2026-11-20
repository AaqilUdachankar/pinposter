import express from 'express';
import {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  forgotPassword,
  deleteAccount,
  registerSchema,
  loginSchema,
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  loginLimiter,
  registerLimiter,
  passwordResetLimiter,
} from '../middleware/rateLimiter.js';

const router = express.Router();

// Strict Rate Limiting applied to authentication endpoints
router.post('/register', registerLimiter, validate(registerSchema), register);
router.post('/login', loginLimiter, validate(loginSchema), login);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/change-password', protect, passwordResetLimiter, changePassword);
router.post('/forgot-password', passwordResetLimiter, forgotPassword);
router.delete('/delete-account', protect, deleteAccount);

export default router;
