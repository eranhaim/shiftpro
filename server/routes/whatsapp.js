import { Router } from 'express';
import auth from '../middleware/auth.js';
import Chatter from '../models/Chatter.js';
import Shift from '../models/Shift.js';
import {
  isConfigured, checkInstance, sendMessage, broadcastMessage,
  buildCustomMessage, buildShiftReminderMessage, buildDailySummaryReminderMessage,
} from '../services/whatsapp.js';

const router = Router();
router.use(auth);

// GET /api/whatsapp/status — check GreenAPI connection status
router.get('/status', async (req, res) => {
  try {
    if (!isConfigured()) {
      return res.json({ configured: false, message: 'GreenAPI credentials not set' });
    }
    const state = await checkInstance();
    res.json({ configured: true, state });
  } catch (err) {
    res.json({ configured: true, error: err.message });
  }
});

// POST /api/whatsapp/send — send message to single phone
router.post('/send', async (req, res) => {
  try {
    const { phone, message } = req.body;
    if (!phone || !message) return res.status(400).json({ message: 'phone and message required' });
    const result = await sendMessage(phone, message);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/whatsapp/broadcast — send message to all chatters (or selected ones)
router.post('/broadcast', async (req, res) => {
  try {
    const { message, chatterIds } = req.body;
    if (!message) return res.status(400).json({ message: 'message required' });

    const filter = { active: true, phone: { $exists: true, $ne: '' } };
    if (chatterIds && chatterIds.length > 0) {
      filter._id = { $in: chatterIds };
    }

    const chatters = await Chatter.find(filter).select('name phone');
    if (chatters.length === 0) {
      return res.json({ sent: 0, results: [], message: 'No chatters with phone numbers found' });
    }

    const results = [];
    for (const c of chatters) {
      try {
        const personalMsg = buildCustomMessage(c.name, message);
        const result = await sendMessage(c.phone, personalMsg);
        results.push({ chatterId: c._id, name: c.name, phone: c.phone, success: true, id: result.idMessage });
      } catch (err) {
        results.push({ chatterId: c._id, name: c.name, phone: c.phone, success: false, error: err.message });
      }
      await new Promise(r => setTimeout(r, 500));
    }

    const sent = results.filter(r => r.success).length;
    res.json({ sent, total: chatters.length, results });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/whatsapp/shift-reminders — send shift reminders for tomorrow
router.post('/shift-reminders', async (req, res) => {
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const dayAfter = new Date(tomorrow);
    dayAfter.setDate(dayAfter.getDate() + 1);

    const shifts = await Shift.find({
      date: { $gte: tomorrow, $lt: dayAfter },
      status: { $in: ['approved', 'scheduled'] },
    }).populate('chatterId', 'name phone');

    const results = [];
    for (const shift of shifts) {
      const chatter = shift.chatterId;
      if (!chatter?.phone) {
        results.push({ name: chatter?.name || '?', success: false, error: 'No phone' });
        continue;
      }

      const dateStr = `${tomorrow.getDate()}.${tomorrow.getMonth() + 1}.${tomorrow.getFullYear()}`;
      try {
        const msg = buildShiftReminderMessage(chatter.name, dateStr, shift.startTime, shift.endTime);
        const result = await sendMessage(chatter.phone, msg);
        results.push({ name: chatter.name, success: true, id: result.idMessage });
      } catch (err) {
        results.push({ name: chatter.name, success: false, error: err.message });
      }
      await new Promise(r => setTimeout(r, 500));
    }

    const sent = results.filter(r => r.success).length;
    res.json({ sent, total: shifts.length, results });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/whatsapp/summary-reminders — remind chatters who haven't submitted today's summary
router.post('/summary-reminders', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayShifts = await Shift.find({
      date: { $gte: today, $lt: tomorrow },
      status: { $in: ['approved', 'scheduled', 'completed', 'active'] },
    }).populate('chatterId', 'name phone');

    const DailySummary = (await import('../models/DailySummary.js')).default;
    const todaySummaries = await DailySummary.find({
      date: { $gte: today, $lt: tomorrow },
    }).select('chatterId');
    const submittedIds = new Set(todaySummaries.map(s => s.chatterId.toString()));

    const needsReminder = todayShifts.filter(s =>
      s.chatterId && !submittedIds.has(s.chatterId._id.toString()) && s.chatterId.phone
    );

    const seen = new Set();
    const unique = needsReminder.filter(s => {
      const id = s.chatterId._id.toString();
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });

    const results = [];
    for (const shift of unique) {
      try {
        const msg = buildDailySummaryReminderMessage(shift.chatterId.name);
        const result = await sendMessage(shift.chatterId.phone, msg);
        results.push({ name: shift.chatterId.name, success: true, id: result.idMessage });
      } catch (err) {
        results.push({ name: shift.chatterId.name, success: false, error: err.message });
      }
      await new Promise(r => setTimeout(r, 500));
    }

    const sent = results.filter(r => r.success).length;
    res.json({ sent, total: unique.length, results });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
