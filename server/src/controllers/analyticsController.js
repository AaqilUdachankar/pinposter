import Product from '../models/Product.js';
import Campaign from '../models/Campaign.js';
import Pin from '../models/Pin.js';
import Board from '../models/Board.js';
import ActivityLog from '../models/ActivityLog.js';
import { subDays, startOfDay, endOfDay, format } from 'date-fns';

export async function getDashboardAnalytics(req, res, next) {
  try {
    const userId = req.userId;
    const { range = '30d' } = req.query;

    let startDate = subDays(new Date(), 30);
    if (range === 'today') startDate = startOfDay(new Date());
    else if (range === '7d') startDate = subDays(new Date(), 7);
    else if (range === '90d') startDate = subDays(new Date(), 90);

    // 1. Metric Counts
    const [
      totalProducts,
      totalCampaigns,
      totalPins,
      queuedPins,
      scheduledPins,
      readyPins,
      publishedPins,
      pausedPins,
      failedPins,
      boards,
    ] = await Promise.all([
      Product.countDocuments({ userId }),
      Campaign.countDocuments({ userId }),
      Pin.countDocuments({ userId }),
      Pin.countDocuments({ userId, status: 'queued' }),
      Pin.countDocuments({ userId, status: 'scheduled' }),
      Pin.countDocuments({ userId, status: 'ready_to_publish' }),
      Pin.countDocuments({ userId, status: 'published' }),
      Pin.countDocuments({ userId, status: 'paused' }),
      Pin.countDocuments({ userId, status: 'failed' }),
      Board.find({ userId }),
    ]);

    // 2. Status Distribution Data for Pie Chart
    const statusDistribution = [
      { name: 'Ready to Publish', value: readyPins, color: '#f43f5e' },
      { name: 'Scheduled', value: scheduledPins, color: '#3b82f6' },
      { name: 'Published', value: publishedPins, color: '#10b981' },
      { name: 'Queued', value: queuedPins, color: '#8b5cf6' },
      { name: 'Paused', value: pausedPins, color: '#f59e0b' },
      { name: 'Failed', value: failedPins, color: '#ef4444' },
    ].filter((item) => item.value > 0);

    // 3. Board Distribution
    const boardDistribution = await Promise.all(
      boards.map(async (b) => {
        const count = await Pin.countDocuments({ userId, boardId: b._id });
        return {
          name: b.name,
          count,
        };
      })
    );

    // 4. Activity Over Time (Daily Generated vs Published)
    const pinsInRange = await Pin.find({
      userId,
      createdAt: { $gte: startDate },
    }).select('createdAt publishedAt status');

    const activityByDate = {};
    const daysCount = range === 'today' ? 1 : range === '7d' ? 7 : range === '90d' ? 90 : 30;

    for (let i = daysCount - 1; i >= 0; i--) {
      const d = subDays(new Date(), i);
      const dateKey = format(d, 'MMM dd');
      activityByDate[dateKey] = { date: dateKey, generated: 0, published: 0 };
    }

    pinsInRange.forEach((p) => {
      const genKey = format(new Date(p.createdAt), 'MMM dd');
      if (activityByDate[genKey]) {
        activityByDate[genKey].generated++;
      }
      if (p.publishedAt) {
        const pubKey = format(new Date(p.publishedAt), 'MMM dd');
        if (activityByDate[pubKey]) {
          activityByDate[pubKey].published++;
        }
      }
    });

    const activityChart = Object.values(activityByDate);

    // 5. Aggregate Manual Metrics (Impressions, Clicks, Saves)
    const allPublishedPins = await Pin.find({ userId, status: 'published' }).select('manualMetrics');
    let totalImpressions = 0;
    let totalClicks = 0;
    let totalSaves = 0;

    allPublishedPins.forEach((p) => {
      if (p.manualMetrics) {
        totalImpressions += p.manualMetrics.impressions || 0;
        totalClicks += p.manualMetrics.outboundClicks || 0;
        totalSaves += p.manualMetrics.saves || 0;
      }
    });

    // 6. Recent Activity Log
    const recentActivity = await ActivityLog.find({ userId })
      .sort({ createdAt: -1 })
      .limit(8);

    // 7. Upcoming 5 Scheduled Pins
    const upcomingPins = await Pin.find({
      userId,
      status: { $in: ['scheduled', 'ready_to_publish'] },
    })
      .populate('productId')
      .populate('boardId')
      .sort({ scheduledAt: 1 })
      .limit(6);

    res.json({
      success: true,
      metrics: {
        totalProducts,
        totalCampaigns,
        totalPins,
        queuedPins,
        scheduledPins,
        readyPins,
        publishedPins,
        pausedPins,
        failedPins,
        totalImpressions,
        totalClicks,
        totalSaves,
      },
      statusDistribution,
      boardDistribution: boardDistribution.filter((b) => b.count > 0),
      activityChart,
      recentActivity,
      upcomingPins,
    });
  } catch (err) {
    next(err);
  }
}
