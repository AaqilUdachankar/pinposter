import Notification from '../models/Notification.js';

export async function getNotifications(req, res, next) {
  try {
    const { unreadOnly } = req.query;
    const filter = { userId: req.userId };
    if (unreadOnly === 'true') {
      filter.readAt = null;
    }

    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .limit(50);

    const unreadCount = await Notification.countDocuments({
      userId: req.userId,
      readAt: null,
    });

    res.json({
      success: true,
      unreadCount,
      notifications,
    });
  } catch (err) {
    next(err);
  }
}

export async function markAsRead(req, res, next) {
  try {
    const { id } = req.params;
    const notification = await Notification.findOne({ _id: id, userId: req.userId });

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    notification.readAt = new Date();
    await notification.save();

    res.json({
      success: true,
      message: 'Notification marked as read',
    });
  } catch (err) {
    next(err);
  }
}

export async function markAllAsRead(req, res, next) {
  try {
    await Notification.updateMany(
      { userId: req.userId, readAt: null },
      { readAt: new Date() }
    );

    res.json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (err) {
    next(err);
  }
}

export async function clearAll(req, res, next) {
  try {
    await Notification.deleteMany({ userId: req.userId });
    res.json({
      success: true,
      message: 'All notifications cleared',
    });
  } catch (err) {
    next(err);
  }
}
