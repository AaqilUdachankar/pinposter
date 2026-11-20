import express from 'express';
import {
  getApiConfigurations,
  saveApiConfiguration,
  testConnection,
  deleteApiConfiguration,
} from '../controllers/apiConfigController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/', getApiConfigurations);
router.post('/', saveApiConfiguration);
router.post('/test', testConnection);
router.delete('/:id', deleteApiConfiguration);

export default router;
