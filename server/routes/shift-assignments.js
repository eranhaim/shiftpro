import { Router } from 'express';
import ShiftAssignment from '../models/ShiftAssignment.js';
import auth from '../middleware/auth.js';

const router = Router();
router.use(auth);

// GET /api/shift-assignments?shiftId=xxx
router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.shiftId) filter.shiftId = req.query.shiftId;
    const assignments = await ShiftAssignment.find(filter).populate('modelId', 'name');
    res.json(assignments);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/shift-assignments
router.post('/', async (req, res) => {
  try {
    const assignment = await ShiftAssignment.create(req.body);
    res.status(201).json(assignment);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// DELETE /api/shift-assignments/:id
router.delete('/:id', async (req, res) => {
  try {
    const assignment = await ShiftAssignment.findByIdAndDelete(req.params.id);
    if (!assignment) return res.status(404).json({ message: 'Assignment not found' });
    res.json({ message: 'Assignment deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

export default router;
