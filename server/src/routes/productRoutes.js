import express from 'express';
import {
  extractMetadata,
  getProducts,
  getProductById,
  updateProduct,
} from '../controllers/productController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post('/extract', extractMetadata);
router.get('/', getProducts);
router.get('/:id', getProductById);
router.put('/:id', updateProduct);

export default router;
