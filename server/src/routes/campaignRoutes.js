import express from 'express';
import {
  createAndRunCampaign,
  getCampaigns,
  getCampaignById,
  getCampaignJob,
  deleteCampaign,
} from '../controllers/campaignController.js';
import { protect } from '../middleware/auth.js';
import { generationLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.use(protect);

router.post('/', generationLimiter, createAndRunCampaign);
router.get('/', getCampaigns);
router.get('/:id', getCampaignById);
router.get('/:id/job', getCampaignJob);
router.delete('/:id', deleteCampaign);

export default router;
