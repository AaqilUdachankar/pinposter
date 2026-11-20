import express from 'express';
import { getScheduleSlots, triggerQueueCheck } from '../controllers/scheduleController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/', getScheduleSlots);
router.post('/check', triggerQueueCheck);

export default router;
