import { Router } from 'express';
import MonthlyGoal from '../models/MonthlyGoal.js';
import DailySummary from '../models/DailySummary.js';
import auth from '../middleware/auth.js';

const router = Router();
router.use(auth);

// GET /api/monthly-goals?month=YYYY-MM-01
router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.month) filter.month = req.query.month;
    const goals = await MonthlyGoal.find(filter).populate('chatterId', 'name').sort({ goalAmount: -1 });
    res.json(goals);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/monthly-goals  (upsert by chatterId + month)
router.post('/', async (req, res) => {
  try {
    const { chatterId, month, goalAmount } = req.body;
    if (!chatterId || !month) {
      return res.status(400).json({ message: 'chatterId and month are required' });
    }

    const goal = await MonthlyGoal.findOneAndUpdate(
      { chatterId, month },
      { chatterId, month, goalAmount: goalAmount || 0 },
      { new: true, upsert: true, runValidators: true },
    );
    res.status(201).json(goal);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PUT /api/monthly-goals/:id
router.put('/:id', async (req, res) => {
  try {
    const goal = await MonthlyGoal.findByIdAndUpdate(
      req.params.id,
      { goalAmount: req.body.goalAmount },
      { new: true, runValidators: true },
    );
    if (!goal) return res.status(404).json({ message: 'Goal not found' });
    res.json(goal);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/monthly-goals/progress?month=YYYY-MM-01
// מחזיר לכל צ'אטר: יעד + הכנסה מצטברת בחודש
router.get('/progress', async (req, res) => {
  try {
    const month = req.query.month;
    if (!month) return res.status(400).json({ message: 'month is required' });

    const [year, m] = month.split('-').map(Number);
    const monthStart = new Date(year, m - 1, 1);
    const monthEnd = new Date(year, m, 1);

    const [goals, incomeByChatter] = await Promise.all([
      MonthlyGoal.find({ month }).populate('chatterId', 'name'),
      DailySummary.aggregate([
        { $match: { date: { $gte: monthStart, $lt: monthEnd } } },
        { $group: { _id: '$chatterId', earned: { $sum: '$incomeTotalUSD' } } },
      ]),
    ]);

    const earnedMap = {};
    for (const row of incomeByChatter) {
      if (row._id) earnedMap[row._id.toString()] = row.earned;
    }

    const result = goals.map((g) => {
      const chatterId = g.chatterId?._id?.toString() || g.chatterId?.toString();
      return {
        chatterId,
        chatterName: g.chatterId?.name,
        goalAmount: g.goalAmount,
        earned: earnedMap[chatterId] || 0,
      };
    });

    // צ'אטרים שיש להם הכנסה אבל אין יעד
    for (const [id, earned] of Object.entries(earnedMap)) {
      if (!result.find((r) => r.chatterId === id)) {
        result.push({ chatterId: id, chatterName: null, goalAmount: null, earned });
      }
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/monthly-goals/copy
router.post('/copy', async (req, res) => {
  try {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

    const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}-01`;

    const prevGoals = await MonthlyGoal.find({ month: prevMonth });
    if (prevGoals.length === 0) {
      return res.status(404).json({ message: 'No goals found for previous month' });
    }

    const ops = prevGoals.map((g) => ({
      updateOne: {
        filter: { chatterId: g.chatterId, month: currentMonth },
        update: { chatterId: g.chatterId, month: currentMonth, goalAmount: g.goalAmount },
        upsert: true,
      },
    }));

    await MonthlyGoal.bulkWrite(ops);
    const newGoals = await MonthlyGoal.find({ month: currentMonth }).populate('chatterId', 'name');
    res.status(201).json(newGoals);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

export default router;
