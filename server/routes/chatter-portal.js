import { Router } from 'express';
import jwt from 'jsonwebtoken';
import Shift from '../models/Shift.js';
import DailySummary from '../models/DailySummary.js';
import ShiftAssignment from '../models/ShiftAssignment.js';

const router = Router();

function chatterAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: 'No token' });

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'chatter') return res.status(403).json({ message: 'Not a chatter' });

    req.chatter = decoded;
    next();
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
}

router.use(chatterAuth);

// GET /api/chatter-portal/my-shifts — get my shifts
router.get('/my-shifts', async (req, res) => {
  try {
    const shifts = await Shift.find({ chatterId: req.chatter.id })
      .sort({ date: -1 })
      .limit(50);

    const shiftIds = shifts.map((s) => s._id);
    const assignments = await ShiftAssignment.find({ shiftId: { $in: shiftIds } });

    const result = shifts.map((s) => ({
      ...s.toObject(),
      assignments: assignments.filter((a) => a.shiftId.toString() === s._id.toString()),
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/chatter-portal/request-shift — request a new shift
router.post('/request-shift', async (req, res) => {
  try {
    const { date, startTime, endTime } = req.body;
    if (!date || !startTime || !endTime) {
      return res.status(400).json({ message: 'Date, start time, and end time are required' });
    }

    const shift = await Shift.create({
      chatterId: req.chatter.id,
      date: new Date(date),
      startTime,
      endTime,
      status: 'pending',
    });

    res.status(201).json(shift);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/chatter-portal/submit-summary — submit a daily summary
router.post('/submit-summary', async (req, res) => {
  try {
    const { shiftId, date, shiftType, incomeTelegram, incomeOnlyfans, incomeTransfers, incomeOther, availabilityStatus, hasDebts, debtsDetail, hasPendingSales, pendingSalesDetail, hasUnusualEvents, unusualEventsDetail, improvementSuggestions } = req.body;

    if (!date) {
      return res.status(400).json({ message: 'Date is required' });
    }

    const summary = await DailySummary.create({
      chatterId: req.chatter.id,
      shiftId: shiftId || undefined,
      date: new Date(date),
      shiftType,
      incomeTelegram: Number(incomeTelegram) || 0,
      incomeOnlyfans: Number(incomeOnlyfans) || 0,
      incomeTransfers: Number(incomeTransfers) || 0,
      incomeOther: Number(incomeOther) || 0,
      incomeTotal: (Number(incomeTelegram) || 0) + (Number(incomeOnlyfans) || 0) + (Number(incomeTransfers) || 0) + (Number(incomeOther) || 0),
      availabilityStatus: availabilityStatus || 'full',
      hasDebts: hasDebts || false,
      debtsDetail,
      hasPendingSales: hasPendingSales || false,
      pendingSalesDetail,
      hasUnusualEvents: hasUnusualEvents || false,
      unusualEventsDetail,
      improvementSuggestions,
    });

    res.status(201).json(summary);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/chatter-portal/my-summaries — get my summaries
router.get('/my-summaries', async (req, res) => {
  try {
    const summaries = await DailySummary.find({ chatterId: req.chatter.id })
      .sort({ date: -1 })
      .limit(50);
    res.json(summaries);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

export default router;
