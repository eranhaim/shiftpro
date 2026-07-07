import { Router } from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import Chatter from '../models/Chatter.js';
import auth from '../middleware/auth.js';

const router = Router();
router.use(auth);

// GET /api/chatters
router.get('/', async (req, res) => {
  try {
    const chatters = await Chatter.find().sort({ name: 1 });
    res.json(chatters);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/chatters
router.post('/', async (req, res) => {
  try {
    const data = { ...req.body };
    if (!data.token) {
      data.token = crypto.randomBytes(16).toString('hex');
    }
    if (data.password) {
      data.rawPassword = data.password;
      data.password = await bcrypt.hash(data.password, 10);
    }
    const chatter = await Chatter.create(data);
    res.status(201).json(chatter);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PUT /api/chatters/:id
router.put('/:id', async (req, res) => {
  try {
    const data = { ...req.body };
    if (data.password && data.password.trim()) {
      data.rawPassword = data.password;
      data.password = await bcrypt.hash(data.password, 10);
    } else {
      delete data.password;
      delete data.rawPassword;
    }
    const chatter = await Chatter.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
    if (!chatter) return res.status(404).json({ message: 'Chatter not found' });
    res.json(chatter);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// DELETE /api/chatters/:id
router.delete('/:id', async (req, res) => {
  try {
    const chatter = await Chatter.findByIdAndDelete(req.params.id);
    if (!chatter) return res.status(404).json({ message: 'Chatter not found' });
    res.json({ message: 'Chatter deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/chatters/:id/link
router.get('/:id/link', async (req, res) => {
  try {
    const chatter = await Chatter.findById(req.params.id).select('name token');
    if (!chatter) return res.status(404).json({ message: 'Chatter not found' });
    res.json({ name: chatter.name, token: chatter.token });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

export default router;
