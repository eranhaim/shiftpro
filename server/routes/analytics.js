import { Router } from 'express';
import Chatter from '../models/Chatter.js';
import Model from '../models/Model.js';
import Shift from '../models/Shift.js';
import DailySummary from '../models/DailySummary.js';
import auth from '../middleware/auth.js';

const router = Router();
router.use(auth);

// GET /api/analytics/overview
router.get('/overview', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dateFilter = {};
    if (req.query.startDate || req.query.endDate) {
      dateFilter.date = {};
      if (req.query.startDate) dateFilter.date.$gte = new Date(req.query.startDate);
      if (req.query.endDate) dateFilter.date.$lte = new Date(req.query.endDate);
    }

    const [totalChatters, totalModels, shiftsToday, shiftRequestsToday, pendingApprovals] =
      await Promise.all([
        Chatter.countDocuments({ active: true }),
        Model.countDocuments({ active: true }),
        Shift.countDocuments({ date: { $gte: today, $lt: tomorrow }, status: 'approved' }),
        Shift.countDocuments({ date: { $gte: today, $lt: tomorrow } }),
        Shift.countDocuments({ status: 'pending' }),
      ]);

    const shiftFilter = dateFilter.date ? { date: dateFilter.date } : { date: { $lt: today } };
    const pastShiftIds = (await Shift.find(shiftFilter).select('_id')).map((s) => s._id);
    const summaryShiftIds = new Set(
      (await DailySummary.find({ shiftId: { $in: pastShiftIds } }).select('shiftId'))
        .filter(s => s.shiftId)
        .map((s) => s.shiftId.toString()),
    );
    const pendingSummaryDebts = pastShiftIds.filter((id) => !summaryShiftIds.has(id.toString())).length;

    const completedFilter = dateFilter.date ? { ...dateFilter, status: 'completed' } : { status: 'completed' };
    const allFilter = dateFilter.date ? dateFilter : {};
    const totalCompleted = await Shift.countDocuments(completedFilter);
    const totalShifts = await Shift.countDocuments(allFilter);
    const completionRate = totalShifts > 0 ? Math.round((totalCompleted / totalShifts) * 100) : 0;

    res.json({
      totalChatters,
      totalModels,
      shiftsToday,
      shiftRequestsToday,
      pendingApprovals,
      pendingSummaryDebts,
      completionRate,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/analytics/income
router.get('/income', async (req, res) => {
  try {
    const match = {};
    if (req.query.startDate || req.query.endDate) {
      match.date = {};
      if (req.query.startDate) match.date.$gte = new Date(req.query.startDate);
      if (req.query.endDate) match.date.$lte = new Date(req.query.endDate);
    }

    const [totals, byChatter] = await Promise.all([
      DailySummary.aggregate([
        { $match: match },
        {
          $group: {
            _id: null,
            totalIncome: { $sum: '$incomeTotal' },
            avgIncome: { $avg: '$incomeTotal' },
            telegram: { $sum: '$incomeTelegram' },
            onlyfans: { $sum: '$incomeOnlyfans' },
            transfers: { $sum: '$incomeTransfers' },
          },
        },
      ]),
      DailySummary.aggregate([
        { $match: match },
        {
          $group: {
            _id: '$chatterId',
            totalIncome: { $sum: '$incomeTotal' },
            summaryCount: { $sum: 1 },
          },
        },
        {
          $lookup: {
            from: 'chatters',
            localField: '_id',
            foreignField: '_id',
            as: 'chatter',
          },
        },
        { $unwind: '$chatter' },
        {
          $project: {
            chatterId: '$_id',
            chatterName: '$chatter.name',
            totalIncome: 1,
            summaryCount: 1,
          },
        },
        { $sort: { totalIncome: -1 } },
      ]),
    ]);

    const t = totals[0] || { totalIncome: 0, avgIncome: 0, telegram: 0, onlyfans: 0, transfers: 0 };

    res.json({
      totalIncome: t.totalIncome,
      avgIncome: Math.round(t.avgIncome || 0),
      incomeByChatter: byChatter,
      incomeByPlatform: {
        telegram: t.telegram,
        onlyfans: t.onlyfans,
        transfers: t.transfers,
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/analytics/shifts
router.get('/shifts', async (req, res) => {
  try {
    const match = {};
    if (req.query.startDate || req.query.endDate) {
      match.date = {};
      if (req.query.startDate) match.date.$gte = new Date(req.query.startDate);
      if (req.query.endDate) match.date.$lte = new Date(req.query.endDate);
    }

    const [statusBreakdown, shiftsByDay] = await Promise.all([
      Shift.aggregate([
        { $match: match },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Shift.aggregate([
        { $match: match },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
        { $project: { date: '$_id', count: 1, _id: 0 } },
      ]),
    ]);

    const breakdown = { scheduled: 0, completed: 0, pending: 0, rejected: 0 };
    for (const item of statusBreakdown) {
      if (item._id in breakdown) breakdown[item._id] = item.count;
    }

    res.json({ statusBreakdown: breakdown, shiftsByDay });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

export default router;
