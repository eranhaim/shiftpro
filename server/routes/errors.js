import { Router } from 'express';
import ErrorLog from '../models/ErrorLog.js';
import auth from '../middleware/auth.js';

const router = Router();
router.use(auth);

// GET /api/errors
router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.resolved !== undefined) {
      filter.resolved = req.query.resolved === 'true';
    }
    const errors = await ErrorLog.find(filter).sort({ createdAt: -1 });
    res.json(errors);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/errors
router.post('/', async (req, res) => {
  try {
    const errorLog = await ErrorLog.create(req.body);
    res.status(201).json(errorLog);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PUT /api/errors/:id
router.put('/:id', async (req, res) => {
  try {
    const errorLog = await ErrorLog.findByIdAndUpdate(
      req.params.id,
      { resolved: true },
      { new: true },
    );
    if (!errorLog) return res.status(404).json({ message: 'Error log not found' });
    res.json(errorLog);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

export default router;
