import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Chatter from '../models/Chatter.js';

const router = Router();

// POST /api/chatter-auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const chatter = await Chatter.findOne({ email: email.toLowerCase().trim(), active: true });
    if (!chatter) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!chatter.password) {
      return res.status(401).json({ message: 'No password set. Contact your manager.' });
    }

    const isMatch = await bcrypt.compare(password, chatter.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    chatter.lastSignInAt = new Date();
    await chatter.save();

    const token = jwt.sign(
      { id: chatter._id, email: chatter.email, name: chatter.name, role: 'chatter' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' },
    );

    res.json({
      token,
      user: {
        id: chatter._id,
        email: chatter.email,
        name: chatter.name,
        role: 'chatter',
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/chatter-auth/me
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: 'No token' });

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'chatter') return res.status(403).json({ message: 'Not a chatter' });

    const chatter = await Chatter.findById(decoded.id).select('-password');
    if (!chatter) return res.status(404).json({ message: 'Chatter not found' });

    res.json(chatter);
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
});

export default router;
