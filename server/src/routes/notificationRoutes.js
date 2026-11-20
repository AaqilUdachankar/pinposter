import express from 'express';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  clearAll,
} from '../controllers/notificationController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/', getNotifications);
router.put('/:id/read', markAsRead);
router.put('/read-all', markAllAsRead);
router.delete('/clear-all', clearAll);

export default router;
