import express from 'express';
import {
  getPublicRssFeed,
  getFeedSettings,
  regenerateFeedToken,
  saveAutoPublishSettings,
  testMakeWebhook,
  dispatchSinglePinToMake,
} from '../controllers/feedController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Public RSS endpoint for Pinterest's auto-publisher (NO auth header required)
router.get('/rss/:feedToken', getPublicRssFeed);

// Protected routes for dashboard UI
router.get('/settings', protect, getFeedSettings);
router.put('/settings', protect, saveAutoPublishSettings);
router.post('/regenerate-token', protect, regenerateFeedToken);
router.post('/test-webhook', protect, testMakeWebhook);
router.post('/dispatch/:pinId', protect, dispatchSinglePinToMake);

export default router;
