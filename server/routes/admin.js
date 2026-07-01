import { Router } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import User from '../models/User.js';
import Chatter from '../models/Chatter.js';

const router = Router();

function requirePanelPassword(req, res, next) {
  const panelPass = req.headers['x-admin-password'];
  const expected = process.env.ADMIN_PANEL_PASSWORD || 'Eran123';
  if (panelPass !== expected) {
    return res.status(403).json({ message: 'Invalid admin panel password' });
  }
  next();
}

router.use(requirePanelPassword);

// POST /api/admin/verify — just verifies the password is correct
router.post('/verify', (_req, res) => {
  res.json({ ok: true });
});

// --- Managers (User model) ---

router.get('/managers', async (_req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});


router.post('/managers', async (req, res) => {
  try {
    const { email, password, displayName } = req.body;
    if (!email || !password || !displayName) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) return res.status(409).json({ message: 'Email already exists' });

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ email: email.toLowerCase().trim(), password: hashed, rawPassword: password, displayName, role: 'admin' });
    res.status(201).json({ _id: user._id, email: user.email, displayName: user.displayName, role: user.role, rawPassword: password });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.delete('/managers/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// --- Chatters ---

router.get('/chatters', async (_req, res) => {
  try {
    const chatters = await Chatter.find().select('-password').sort({ name: 1 });
    res.json(chatters);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});


router.post('/chatters', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    const existing = await Chatter.findOne({ email: email.toLowerCase().trim() });
    if (existing) return res.status(409).json({ message: 'Email already exists' });

    const hashed = await bcrypt.hash(password, 10);
    const chatter = await Chatter.create({
      name,
      email: email.toLowerCase().trim(),
      password: hashed,
      rawPassword: password,
      phone,
      token: crypto.randomBytes(16).toString('hex'),
      active: true,
    });
    res.status(201).json({ _id: chatter._id, name: chatter.name, email: chatter.email, phone: chatter.phone, rawPassword: password });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.delete('/chatters/:id', async (req, res) => {
  try {
    const chatter = await Chatter.findByIdAndDelete(req.params.id);
    if (!chatter) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

export default router;
