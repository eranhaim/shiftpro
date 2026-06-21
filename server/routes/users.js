import { Router } from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import auth from '../middleware/auth.js';

const router = Router();
const ADMIN_PANEL_PASSWORD = process.env.ADMIN_PANEL_PASSWORD || 'Eran123';

function requirePanelPassword(req, res, next) {
  const panelPass = req.headers['x-admin-password'];
  if (panelPass !== ADMIN_PANEL_PASSWORD) {
    return res.status(403).json({ message: 'Invalid admin panel password' });
  }
  next();
}

router.use(auth);
router.use(requirePanelPassword);

// GET /api/users
router.get('/', async (_req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/users
router.post('/', async (req, res) => {
  try {
    const { email, password, displayName, role } = req.body;
    if (!email || !password || !displayName) {
      return res.status(400).json({ message: 'Email, password, and display name are required' });
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(409).json({ message: 'User with this email already exists' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      email: email.toLowerCase().trim(),
      password: hashed,
      displayName,
      role: role || 'admin',
    });

    res.status(201).json({
      _id: user._id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      createdAt: user.createdAt,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// DELETE /api/users/:id
router.delete('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user._id.toString() === req.user.id) {
      return res.status(400).json({ message: 'Cannot delete yourself' });
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

export default router;
