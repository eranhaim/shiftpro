import { Router } from 'express';
import auth from '../middleware/auth.js';
import Chatter from '../models/Chatter.js';

const router = Router();
router.use(auth);

const WHATSAPP_SERVICE = process.env.WHATSAPP_SERVICE_URL || 'http://localhost:4001';

async function proxyGet(path) {
  const res = await fetch(`${WHATSAPP_SERVICE}${path}`);
  return res.json();
}

async function proxyPost(path, body = {}) {
  const res = await fetch(`${WHATSAPP_SERVICE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || 'WhatsApp service error');
  return data;
}

router.get('/status', async (req, res) => {
  try {
    const data = await proxyGet('/status');
    res.json(data);
  } catch (err) {
    res.json({ connected: false, phone: null, error: err.message });
  }
});

router.get('/qr', async (req, res) => {
  try {
    const data = await proxyGet('/qr');
    res.json(data);
  } catch (err) {
    res.status(500).json({ qr: null, error: err.message });
  }
});

router.post('/connect', async (req, res) => {
  try {
    const data = await proxyPost('/connect');
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/broadcast', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ message: 'message required' });

    const chatters = await Chatter.find({
      active: true,
      phone: { $exists: true, $ne: '' },
    }).select('name phone');

    if (chatters.length === 0) {
      return res.json({ sent: 0, total: 0, message: 'No chatters with phone numbers found' });
    }

    const phones = chatters.map((c) => c.phone);
    const data = await proxyPost('/broadcast', { phones, message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/disconnect', async (req, res) => {
  try {
    const data = await proxyPost('/disconnect');
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
