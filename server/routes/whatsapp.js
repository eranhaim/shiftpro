import { Router } from 'express';
import auth from '../middleware/auth.js';
import Chatter from '../models/Chatter.js';
import * as wa from '../services/whatsapp-wwjs.js';

const router = Router();
router.use(auth);

router.get('/status', async (req, res) => {
  try {
    res.json(wa.getStatus());
  } catch (err) {
    res.json({ connected: false, phone: null, error: err.message });
  }
});

router.get('/qr', async (req, res) => {
  try {
    res.json(wa.getQR());
  } catch (err) {
    res.status(500).json({ qr: null, error: err.message });
  }
});

router.post('/connect', async (req, res) => {
  try {
    const data = await wa.connect();
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
    const data = await wa.broadcast(phones, message);
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/disconnect', async (req, res) => {
  try {
    const data = await wa.disconnect();
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
