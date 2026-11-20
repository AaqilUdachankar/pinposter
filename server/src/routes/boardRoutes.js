import express from 'express';
import { getBoards, createBoard, updateBoard, deleteBoard } from '../controllers/boardController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/', getBoards);
router.post('/', createBoard);
router.put('/:id', updateBoard);
router.delete('/:id', deleteBoard);

export default router;
