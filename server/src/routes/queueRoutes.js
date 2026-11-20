import express from 'express';
import { getPublishingQueue, getNextSlot } from '../controllers/queueController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/', getPublishingQueue);
router.get('/next-slot', getNextSlot);

export default router;
