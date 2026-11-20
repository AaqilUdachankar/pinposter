import Board from '../models/Board.js';
import Pin from '../models/Pin.js';

export async function getBoards(req, res, next) {
  try {
    const boards = await Board.find({ userId: req.userId }).sort({ isDefault: -1, name: 1 });
    
    // Refresh pin counts dynamically
    const boardsWithCounts = await Promise.all(
      boards.map(async (board) => {
        const count = await Pin.countDocuments({ boardId: board._id, userId: req.userId });
        return {
          ...board.toObject(),
          pinCount: count,
        };
      })
    );

    res.json({
      success: true,
      boards: boardsWithCounts,
    });
  } catch (err) {
    next(err);
  }
}

export async function createBoard(req, res, next) {
  try {
    const { name, description, category, isDefault } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Board name is required' });
    }

    if (isDefault) {
      // Unset previous default board
      await Board.updateMany({ userId: req.userId }, { isDefault: false });
    }

    const board = await Board.create({
      userId: req.userId,
      name: name.trim(),
      description: description?.trim() || '',
      category: category?.trim() || 'General',
      isDefault: Boolean(isDefault),
    });

    res.status(201).json({
      success: true,
      message: 'Board created successfully',
      board,
    });
  } catch (err) {
    next(err);
  }
}

export async function updateBoard(req, res, next) {
  try {
    const { id } = req.params;
    const { name, description, category, isDefault } = req.body;

    const board = await Board.findOne({ _id: id, userId: req.userId });
    if (!board) {
      return res.status(404).json({ success: false, message: 'Board not found' });
    }

    if (isDefault && !board.isDefault) {
      await Board.updateMany({ userId: req.userId }, { isDefault: false });
    }

    if (name) board.name = name.trim();
    if (description !== undefined) board.description = description.trim();
    if (category !== undefined) board.category = category.trim();
    if (isDefault !== undefined) board.isDefault = Boolean(isDefault);

    await board.save();

    res.json({
      success: true,
      message: 'Board updated successfully',
      board,
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteBoard(req, res, next) {
  try {
    const { id } = req.params;
    const board = await Board.findOne({ _id: id, userId: req.userId });

    if (!board) {
      return res.status(404).json({ success: false, message: 'Board not found' });
    }

    const pinCount = await Pin.countDocuments({ boardId: id });
    if (pinCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete board because it contains ${pinCount} active Pins. Reassign the Pins first.`,
      });
    }

    await board.deleteOne();

    res.json({
      success: true,
      message: 'Board deleted successfully',
    });
  } catch (err) {
    next(err);
  }
}
