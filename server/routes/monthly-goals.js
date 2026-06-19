import { Router } from 'express';
import MonthlyGoal from '../models/MonthlyGoal.js';
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
