import { Router } from 'express';
import Reminder from '../models/Reminder.js';
import auth from '../middleware/auth.js';

const router = Router();
router.use(auth);

router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.completed === 'true') filter.completed = true;
    else if (req.query.completed === 'false') filter.completed = false;
    const reminders = await Reminder.find(filter)
      .populate('chatterId', 'name')
      .sort({ dueDate: 1, createdAt: -1 });
    res.json(reminders);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { chatterId, message, type, dueDate } = req.body;
    if (!message) return res.status(400).json({ message: 'Message is required' });
    const reminder = await Reminder.create({
      chatterId: chatterId || undefined,
      message,
      type: type || 'general',
      dueDate: dueDate ? new Date(dueDate) : undefined,
      createdBy: req.user.id,
    });
    const populated = await Reminder.findById(reminder._id).populate('chatterId', 'name');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const update = {};
    if (req.body.completed !== undefined) update.completed = req.body.completed;
    if (req.body.message) update.message = req.body.message;
    if (req.body.type) update.type = req.body.type;
    if (req.body.dueDate) update.dueDate = new Date(req.body.dueDate);
    const reminder = await Reminder.findByIdAndUpdate(req.params.id, update, { new: true })
      .populate('chatterId', 'name');
    if (!reminder) return res.status(404).json({ message: 'Not found' });
    res.json(reminder);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const reminder = await Reminder.findByIdAndDelete(req.params.id);
    if (!reminder) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

export default router;
