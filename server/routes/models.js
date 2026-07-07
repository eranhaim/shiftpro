import { Router } from 'express';
import Model from '../models/Model.js';
import auth from '../middleware/auth.js';

const router = Router();
router.use(auth);

// GET /api/models
router.get('/', async (req, res) => {
  try {
    const models = await Model.find().sort({ name: 1 });
    res.json(models);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/models
router.post('/', async (req, res) => {
  try {
    const model = await Model.create(req.body);
    res.status(201).json(model);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PUT /api/models/:id
router.put('/:id', async (req, res) => {
  try {
    const update = {};
    if (req.body.name !== undefined) update.name = req.body.name;
    if (req.body.active !== undefined) update.active = req.body.active;
    if (req.body.platforms !== undefined) update.platforms = req.body.platforms;
    const model = await Model.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true, runValidators: true },
    );
    if (!model) return res.status(404).json({ message: 'Model not found' });
    res.json(model);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// DELETE /api/models/:id
router.delete('/:id', async (req, res) => {
  try {
    const model = await Model.findByIdAndDelete(req.params.id);
    if (!model) return res.status(404).json({ message: 'Model not found' });
    res.json({ message: 'Model deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

export default router;
