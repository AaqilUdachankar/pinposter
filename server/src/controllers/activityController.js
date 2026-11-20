import ActivityLog from '../models/ActivityLog.js';

export async function getActivityLogs(req, res, next) {
  try {
    const { entityType, page = 1, limit = 40 } = req.query;
    const filter = { userId: req.userId };

    if (entityType) {
      filter.entityType = entityType;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [logs, total] = await Promise.all([
      ActivityLog.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      ActivityLog.countDocuments(filter),
    ]);

    res.json({
      success: true,
      logs,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    });
  } catch (err) {
    next(err);
  }
}
