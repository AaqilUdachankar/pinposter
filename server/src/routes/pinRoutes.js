import express from 'express';
import {
  getPins,
  getPinById,
  updatePin,
  markPinAsPublished,
  logPinMetrics,
  handleReschedule,
  handlePause,
  handleResume,
  handleCancel,
  regeneratePinImage,
  duplicatePin,
  bulkAction,
} from '../controllers/pinController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/', getPins);
router.get('/:id', getPinById);
router.put('/:id', updatePin);
router.post('/:id/publish', markPinAsPublished);
router.post('/:id/metrics', logPinMetrics);
router.post('/:id/reschedule', handleReschedule);
router.post('/:id/pause', handlePause);
router.post('/:id/resume', handleResume);
router.post('/:id/cancel', handleCancel);
router.post('/:id/regenerate-image', regeneratePinImage);
router.post('/:id/duplicate', duplicatePin);
router.post('/bulk', bulkAction);

export default router;
