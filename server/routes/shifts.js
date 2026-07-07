import { Router } from 'express';
import Shift from '../models/Shift.js';
import ShiftAssignment from '../models/ShiftAssignment.js';
import Chatter from '../models/Chatter.js';
import auth from '../middleware/auth.js';

const router = Router();
router.use(auth);

// GET /api/shifts/pending  (defined before /:id to avoid route clash)
router.get('/pending', async (req, res) => {
  try {
    const shifts = await Shift.find({ status: 'pending' })
      .populate('chatterId', 'name')
      .sort({ date: 1, startTime: 1 });
    res.json(shifts);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/shifts
router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.weekStart && req.query.weekEnd) {
      filter.date = {
        $gte: new Date(req.query.weekStart),
        $lte: new Date(req.query.weekEnd),
      };
    }

    const shifts = await Shift.find(filter)
      .populate('chatterId', 'name')
      .sort({ date: 1, startTime: 1 });

    const shiftIds = shifts.map((s) => s._id);
    const assignments = await ShiftAssignment.find({ shiftId: { $in: shiftIds } });

    const assignmentsByShift = {};
    for (const a of assignments) {
      const key = a.shiftId.toString();
      if (!assignmentsByShift[key]) assignmentsByShift[key] = [];
      assignmentsByShift[key].push(a);
    }

    const result = shifts.map((s) => ({
      ...s.toObject(),
      assignments: assignmentsByShift[s._id.toString()] || [],
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/shifts
router.post('/', async (req, res) => {
  try {
    const shift = await Shift.create(req.body);
    res.status(201).json(shift);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/shifts/generate-week
router.post('/generate-week', async (req, res) => {
  try {
    const { weekStart } = req.body;
    if (!weekStart) return res.status(400).json({ message: 'weekStart is required' });

    const start = new Date(weekStart);
    const chatters = await Chatter.find({ active: true });
    const shifts = [];

    for (let day = 0; day < 7; day++) {
      const date = new Date(start);
      date.setDate(date.getDate() + day);

      for (const chatter of chatters) {
        shifts.push({
          chatterId: chatter._id,
          date,
          startTime: '12:00',
          endTime: '19:00',
          status: 'scheduled',
        });
        shifts.push({
          chatterId: chatter._id,
          date,
          startTime: '19:00',
          endTime: '02:00',
          status: 'scheduled',
        });
      }
    }

    const created = await Shift.insertMany(shifts);
    res.status(201).json({ message: `Generated ${created.length} shifts`, count: created.length });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/shifts/assignments-for-slot?date=YYYY-MM-DD&shiftType=morning|night
router.get('/assignments-for-slot', async (req, res) => {
  try {
    const { date, shiftType } = req.query;
    if (!date || !shiftType) return res.status(400).json({ message: 'date and shiftType are required' });

    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const startTime = shiftType === 'morning' ? '12:00' : '19:00';

    const slotShifts = await Shift.find({
      date: { $gte: dayStart, $lte: dayEnd },
      startTime,
      status: { $in: ['approved', 'scheduled', 'active'] },
    });

    const shiftIds = slotShifts.map((s) => s._id);
    const assignments = await ShiftAssignment.find({ shiftId: { $in: shiftIds } });
    res.json(assignments);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PUT /api/shifts/:id/assignments
router.put('/:id/assignments', async (req, res) => {
  try {
    const shift = await Shift.findById(req.params.id);
    if (!shift) return res.status(404).json({ message: 'Shift not found' });

    const { modelAssignments } = req.body;
    await ShiftAssignment.deleteMany({ shiftId: shift._id });

    if (Array.isArray(modelAssignments) && modelAssignments.length > 0) {
      const docs = modelAssignments.map((a) => ({
        shiftId: shift._id,
        modelId: a.modelId,
        modelName: a.modelName,
        platform: a.platform,
        shiftDate: shift.date,
        shiftStartTime: shift.startTime,
      }));
      await ShiftAssignment.insertMany(docs);
    }

    const assignments = await ShiftAssignment.find({ shiftId: shift._id });
    res.json({ ...shift.toObject(), assignments });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PUT /api/shifts/:id/approve
router.put('/:id/approve', async (req, res) => {
  try {
    const shift = await Shift.findByIdAndUpdate(req.params.id, { status: 'approved' }, { new: true });
    if (!shift) return res.status(404).json({ message: 'Shift not found' });

    const { modelAssignments } = req.body;
    if (Array.isArray(modelAssignments) && modelAssignments.length > 0) {
      const docs = modelAssignments.map((a) => ({
        shiftId: shift._id,
        modelId: a.modelId,
        modelName: a.modelName,
        platform: a.platform,
        shiftDate: shift.date,
        shiftStartTime: shift.startTime,
      }));
      await ShiftAssignment.insertMany(docs);
    }

    const assignments = await ShiftAssignment.find({ shiftId: shift._id });
    res.json({ ...shift.toObject(), assignments });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PUT /api/shifts/:id/reject
router.put('/:id/reject', async (req, res) => {
  try {
    const update = { status: 'rejected' };
    if (req.body.rejectReason) update.rejectReason = req.body.rejectReason;
    const shift = await Shift.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!shift) return res.status(404).json({ message: 'Shift not found' });
    res.json(shift);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PUT /api/shifts/:id
router.put('/:id', async (req, res) => {
  try {
    const shift = await Shift.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!shift) return res.status(404).json({ message: 'Shift not found' });
    res.json(shift);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// DELETE /api/shifts/:id
router.delete('/:id', async (req, res) => {
  try {
    const shift = await Shift.findByIdAndDelete(req.params.id);
    if (!shift) return res.status(404).json({ message: 'Shift not found' });
    await ShiftAssignment.deleteMany({ shiftId: req.params.id });
    res.json({ message: 'Shift deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

export default router;
